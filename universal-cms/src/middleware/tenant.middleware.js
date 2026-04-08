/**
 * Tenant Resolution Middleware
 * Identifies and attaches tenant context from subdomain, custom domain, or header
 */

const db = require('../config/database');
const redis = require('../config/redis');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Extract tenant identifier from request
 * Priority: Header > Subdomain > Custom Domain > Query Param
 */
const extractTenantIdentifier = (req) => {
  // 1. Check X-Tenant-ID header (for API clients)
  const headerId = req.headers['x-tenant-id'];
  if (headerId) {
    return { type: 'id', value: headerId };
  }

  // 2. Check X-Tenant-Slug header
  const headerSlug = req.headers['x-tenant-slug'];
  if (headerSlug) {
    return { type: 'slug', value: headerSlug };
  }

  // 3. Extract from subdomain
  const host = req.headers.host || '';
  const url = new URL(`http://${host}`);
  const hostname = url.hostname;
  
  // Skip localhost and IP addresses
  if (!hostname.includes('.') || hostname === 'localhost') {
    // Check query param as fallback
    if (req.query.tenant) {
      return { type: 'slug', value: req.query.tenant };
    }
    return null;
  }

  const parts = hostname.split('.');
  
  // Check if it's a custom domain (no subdomain or multiple subdomains)
  if (parts.length === 2) {
    // Could be custom domain like example.com
    return { type: 'domain', value: hostname };
  }
  
  if (parts.length >= 3) {
    const subdomain = parts[0];
    
    // Ignore common subdomains like www, api, app
    if (['www', 'api', 'app', 'admin', 'dev', 'staging'].includes(subdomain)) {
      return { type: 'domain', value: hostname };
    }
    
    return { type: 'subdomain', value: subdomain };
  }

  return null;
};

/**
 * Get tenant from cache or database
 */
const getTenant = async (identifier) => {
  const cacheKey = `tenant:${identifier.type}:${identifier.value}`;
  
  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached && cached.id) {
      return cached;
    }
  } catch (error) {
    logger.warn('Redis cache miss for tenant', { identifier });
  }

  // Database query
  let query;
  let params;

  switch (identifier.type) {
    case 'id':
      query = 'SELECT * FROM tenants WHERE id = $1 AND is_active = true';
      params = [identifier.value];
      break;
    case 'slug':
      query = 'SELECT * FROM tenants WHERE slug = $1 AND is_active = true';
      params = [identifier.value];
      break;
    case 'subdomain':
      query = 'SELECT * FROM tenants WHERE subdomain = $1 AND is_active = true';
      params = [identifier.value];
      break;
    case 'domain':
      query = `SELECT t.* FROM tenants t
               JOIN custom_domains cd ON t.id = cd.tenant_id
               WHERE cd.domain = $1 AND cd.is_verified = true AND t.is_active = true`;
      params = [identifier.value];
      break;
    default:
      return null;
  }

  const result = await db.query(query, params);
  const tenant = result.rows[0];

  if (tenant) {
    // Cache for 5 minutes
    try {
      await redis.set(cacheKey, tenant, 300);
    } catch (error) {
      logger.warn('Failed to cache tenant', { tenantId: tenant.id });
    }
  }

  return tenant || null;
};

/**
 * Check tenant plan limits
 */
const checkPlanLimits = async (tenant, action, metadata = {}) => {
  const plan = tenant.plan || 'free';
  
  const limits = {
    free: {
      collections: 5,
      pages: 10,
      storage: 104857600, // 100MB
      users: 3,
      apiCallsPerMonth: 10000,
      bandwidth: 1073741824, // 1GB
    },
    pro: {
      collections: 50,
      pages: 500,
      storage: 10737418240, // 10GB
      users: 10,
      apiCallsPerMonth: 100000,
      bandwidth: 107374182400, // 100GB
    },
    business: {
      collections: 500,
      pages: 5000,
      storage: 107374182400, // 100GB
      users: 50,
      apiCallsPerMonth: 1000000,
      bandwidth: 1099511627776, // 1TB
    },
    enterprise: {
      collections: -1, // unlimited
      pages: -1,
      storage: -1,
      users: -1,
      apiCallsPerMonth: -1,
      bandwidth: -1,
    },
  };

  const planLimits = limits[plan] || limits.free;

  // Check specific action limits
  switch (action) {
    case 'create_collection':
      if (planLimits.collections !== -1) {
        const count = await db.query(
          'SELECT COUNT(*) as count FROM collections WHERE tenant_id = $1',
          [tenant.id]
        );
        if (parseInt(count.rows[0].count) >= planLimits.collections) {
          throw new Error(`Plan limit reached: maximum ${planLimits.collections} collections`);
        }
      }
      break;

    case 'create_page':
      if (planLimits.pages !== -1) {
        const count = await db.query(
          'SELECT COUNT(*) as count FROM pages WHERE tenant_id = $1',
          [tenant.id]
        );
        if (parseInt(count.rows[0].count) >= planLimits.pages) {
          throw new Error(`Plan limit reached: maximum ${planLimits.pages} pages`);
        }
      }
      break;

    case 'upload_file':
      if (planLimits.storage !== -1 && metadata.fileSize) {
        const usage = await db.query(
          'SELECT COALESCE(SUM(file_size), 0) as total FROM media WHERE tenant_id = $1',
          [tenant.id]
        );
        const currentUsage = parseInt(usage.rows[0].total);
        if (currentUsage + metadata.fileSize > planLimits.storage) {
          throw new Error(`Storage limit reached: ${Math.round(planLimits.storage / 1024 / 1024)}MB`);
        }
      }
      break;

    case 'add_user':
      if (planLimits.users !== -1) {
        const count = await db.query(
          'SELECT COUNT(*) as count FROM tenant_users WHERE tenant_id = $1 AND is_active = true',
          [tenant.id]
        );
        if (parseInt(count.rows[0].count) >= planLimits.users) {
          throw new Error(`User limit reached: maximum ${planLimits.users} users`);
        }
      }
      break;
  }

  return true;
};

/**
 * Track API usage for billing
 */
const trackUsage = async (tenantId, type, amount = 1) => {
  const today = new Date().toISOString().split('T')[0];
  const key = `usage:${tenantId}:${type}:${today}`;

  try {
    await redis.incr(key);
    await redis.expire(key, 86400 * 32); // Keep for 32 days
    
    // Also store in database for persistent tracking
    await db.query(
      `INSERT INTO usage_logs (tenant_id, usage_type, amount, date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, usage_type, date)
       DO UPDATE SET amount = usage_logs.amount + $3`,
      [tenantId, type, amount, today]
    );
  } catch (error) {
    logger.errorWithContext(error, { context: 'usage_tracking' });
  }
};

/**
 * Main tenant middleware
 */
const resolveTenant = async (req, res, next) => {
  try {
    const identifier = extractTenantIdentifier(req);

    if (!identifier) {
      // No tenant identified - might be platform-level request
      if (req.path.startsWith('/auth') || req.path.startsWith('/webhooks')) {
        return next();
      }
      
      // For public content, try to resolve by domain later
      return next();
    }

    const tenant = await getTenant(identifier);

    if (!tenant) {
      return ApiResponse.notFound(res, 'Tenant not found');
    }

    // Attach tenant to request
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      settings: tenant.settings,
      customDomain: identifier.type === 'domain' ? identifier.value : null,
    };

    // Track API usage
    if (!req.path.startsWith('/public/')) {
      await trackUsage(tenant.id, 'api_calls', 1);
    }

    logger.http('Tenant resolved', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan: tenant.plan,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.errorWithContext(error, { middleware: 'tenant' });

    if (error.message.includes('limit')) {
      return ApiResponse.error(res, error.message, 403);
    }

    return ApiResponse.error(res, 'Tenant resolution failed', 500);
  }
};

/**
 * Middleware factory for checking specific plan requirements
 */
const requirePlan = (...allowedPlans) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return ApiResponse.forbidden(res, 'Tenant context required');
    }

    if (!allowedPlans.includes(req.tenant.plan)) {
      return ApiResponse.forbidden(
        res,
        `This feature requires one of these plans: ${allowedPlans.join(', ')}`
      );
    }

    next();
  };
};

module.exports = {
  resolveTenant,
  requirePlan,
  checkPlanLimits,
  trackUsage,
  extractTenantIdentifier,
  getTenant,
};

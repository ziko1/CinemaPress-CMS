/**
 * Tenant Service - Multi-tenancy management
 * Handles tenant isolation, creation, and lifecycle
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class TenantService {
  constructor(pool, redis) {
    this.pool = pool;
    this.redis = redis;
    this.cacheTTL = 300; // 5 minutes
  }

  /**
   * Create a new tenant
   */
  async createTenant(data, userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const tenantId = uuidv4();
      const slug = this.generateSlug(data.name);
      
      // Create tenant
      const tenantResult = await client.query(`
        INSERT INTO tenants (id, name, slug, subdomain, plan, settings, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [
        tenantId,
        data.name,
        slug,
        data.subdomain || null,
        data.plan || 'free',
        JSON.stringify(data.settings || {})
      ]);
      
      const tenant = tenantResult.rows[0];
      
      // Add user as owner
      await client.query(`
        INSERT INTO tenant_users (tenant_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [tenantId, userId, 'owner']);
      
      // Create default subscription
      await client.query(`
        INSERT INTO subscriptions (tenant_id, plan, status, current_period_start, current_period_end)
        VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '1 month')
      `, [tenantId, tenant.plan, data.trial ? 'trialing' : 'active']);
      
      await client.query('COMMIT');
      
      // Cache tenant
      await this.cacheTenant(tenant);
      
      return tenant;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId) {
    // Check cache first
    const cached = await this.redis.get(`tenant:${tenantId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const result = await this.pool.query(`
      SELECT t.*, s.plan as subscription_plan, s.status as subscription_status
      FROM tenants t
      LEFT JOIN subscriptions s ON t.id = s.tenant_id AND s.status = 'active'
      WHERE t.id = $1 AND t.status = 'active'
    `, [tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const tenant = result.rows[0];
    await this.cacheTenant(tenant);
    
    return tenant;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug) {
    const result = await this.pool.query(`
      SELECT * FROM tenants
      WHERE slug = $1 AND status = 'active'
    `, [slug]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain) {
    const result = await this.pool.query(`
      SELECT * FROM tenants
      WHERE subdomain = $1 AND status = 'active'
    `, [subdomain]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * Get tenant by custom domain
   */
  async getTenantByDomain(domain) {
    const result = await this.pool.query(`
      SELECT * FROM tenants
      WHERE (subdomain = $1 OR custom_domain = $1) AND status = 'active'
    `, [domain]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId, data) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (data.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(data.name);
    }
    
    if (data.settings !== undefined) {
      fields.push(`settings = $${index++}::jsonb`);
      values.push(JSON.stringify(data.settings));
    }
    
    if (data.custom_domain !== undefined) {
      fields.push(`custom_domain = $${index++}`);
      values.push(data.custom_domain);
    }
    
    if (fields.length === 0) {
      return await this.getTenantById(tenantId);
    }
    
    values.push(tenantId);
    
    const result = await this.pool.query(`
      UPDATE tenants
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING *
    `, values);
    
    const tenant = result.rows[0];
    if (tenant) {
      await this.cacheTenant(tenant);
    }
    
    return tenant;
  }

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(tenantId) {
    await this.pool.query(`
      UPDATE tenants
      SET status = 'deleted', updated_at = NOW()
      WHERE id = $1
    `, [tenantId]);
    
    // Remove from cache
    await this.redis.del(`tenant:${tenantId}`);
  }

  /**
   * Get user's tenants
   */
  async getUserTenants(userId) {
    const result = await this.pool.query(`
      SELECT t.*, tu.role, tu.permissions
      FROM tenants t
      INNER JOIN tenant_users tu ON t.id = tu.tenant_id
      WHERE tu.user_id = $1 AND t.status = 'active'
      ORDER BY t.created_at DESC
    `, [userId]);
    
    return result.rows;
  }

  /**
   * Invite user to tenant
   */
  async inviteUser(tenantId, email, role, invitedBy) {
    // Find or create user
    let userResult = await this.pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    let userId;
    if (userResult.rows.length === 0) {
      // Create new user with temporary password
      const tempPassword = this.generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      
      userResult = await this.pool.query(`
        INSERT INTO users (email, password_hash, email_verified)
        VALUES ($1, $2, FALSE)
        RETURNING id
      `, [email, passwordHash]);
      
      userId = userResult.rows[0].id;
      
      // TODO: Send invitation email with temp password
    } else {
      userId = userResult.rows[0].id;
    }
    
    // Add to tenant
    await this.pool.query(`
      INSERT INTO tenant_users (tenant_id, user_id, role, invited_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (tenant_id, user_id) DO UPDATE
      SET role = $3, invited_at = NOW()
    `, [tenantId, userId, role]);
    
    return { userId, tempPassword };
  }

  /**
   * Update user role in tenant
   */
  async updateUserRole(tenantId, userId, role) {
    await this.pool.query(`
      UPDATE tenant_users
      SET role = $1
      WHERE tenant_id = $2 AND user_id = $3
    `, [role, tenantId, userId]);
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(tenantId, userId) {
    await this.pool.query(`
      DELETE FROM tenant_users
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, userId]);
  }

  /**
   * Check tenant limits based on plan
   */
  async checkLimit(tenantId, limitType, currentValue) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    const limits = this.getPlanLimits(tenant.plan);
    
    if (currentValue >= limits[limitType]) {
      return {
        allowed: false,
        limit: limits[limitType],
        current: currentValue,
        message: `Plan limit exceeded for ${limitType}. Current: ${currentValue}, Limit: ${limits[limitType]}`
      };
    }
    
    return {
      allowed: true,
      limit: limits[limitType],
      current: currentValue
    };
  }

  /**
   * Get plan limits
   */
  getPlanLimits(plan) {
    const limits = {
      free: {
        collections: 5,
        items_per_collection: 100,
        storage_bytes: 100 * 1024 * 1024, // 100MB
        bandwidth_bytes: 1 * 1024 * 1024 * 1024, // 1GB
        api_calls_per_month: 1000,
        users: 1,
        custom_domain: false,
        watermark: true
      },
      pro: {
        collections: 50,
        items_per_collection: 10000,
        storage_bytes: 10 * 1024 * 1024 * 1024, // 10GB
        bandwidth_bytes: 100 * 1024 * 1024 * 1024, // 100GB
        api_calls_per_month: 100000,
        users: 5,
        custom_domain: true,
        watermark: false
      },
      business: {
        collections: 500,
        items_per_collection: 100000,
        storage_bytes: 100 * 1024 * 1024 * 1024, // 100GB
        bandwidth_bytes: 1000 * 1024 * 1024 * 1024, // 1TB
        api_calls_per_month: 1000000,
        users: 25,
        custom_domain: true,
        watermark: false
      },
      enterprise: {
        collections: -1, // unlimited
        items_per_collection: -1,
        storage_bytes: -1,
        bandwidth_bytes: -1,
        api_calls_per_month: -1,
        users: -1,
        custom_domain: true,
        watermark: false
      }
    };
    
    return limits[plan] || limits.free;
  }

  /**
   * Cache tenant data
   */
  async cacheTenant(tenant) {
    await this.redis.setex(
      `tenant:${tenant.id}`,
      this.cacheTTL,
      JSON.stringify(tenant)
    );
  }

  /**
   * Generate URL-friendly slug
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Generate temporary password
   */
  generateTempPassword() {
    return Math.random().toString(36).slice(-8) + 
           Math.random().toString(36).slice(-8).toUpperCase();
  }
}

module.exports = TenantService;

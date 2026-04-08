/**
 * Authentication Middleware
 * JWT token validation and user attachment
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Extract token from request
 * @param {Object} req - Express request
 * @returns {string|null}
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check query param (for websockets or special cases)
  if (req.query.token) {
    return req.query.token;
  }
  
  return null;
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if token is in blacklist (logout)
    const isBlacklisted = await db.query(
      'SELECT 1 FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()',
      [require('crypto').createHash('sha256').update(token).digest('hex')]
    );
    
    if (isBlacklisted.rows.length > 0) {
      throw new Error('Token has been revoked');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Get user from database
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
const getUserById = async (userId) => {
  const result = await db.query(
    `SELECT u.id, u.email, u.full_name, u.avatar_url, u.role, u.is_active, 
            u.created_at, u.last_login, t.id as tenant_id, t.name as tenant_name,
            t.slug as tenant_slug, t.plan, tu.role as tenant_role
     FROM users u
     LEFT JOIN tenant_users tu ON u.id = tu.user_id AND tu.is_active = true
     LEFT JOIN tenants t ON tu.tenant_id = t.id
     WHERE u.id = $1`,
    [userId]
  );
  
  return result.rows[0] || null;
};

/**
 * Main authentication middleware
 * Validates JWT and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }
    
    const decoded = await verifyToken(token);
    const user = await getUserById(decoded.userId);
    
    if (!user || !user.is_active) {
      return ApiResponse.unauthorized(res, 'User not found or inactive');
    }
    
    // Attach user and tenant to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role,
    };
    
    if (user.tenant_id) {
      req.tenant = {
        id: user.tenant_id,
        name: user.tenant_name,
        slug: user.tenant_slug,
        plan: user.plan,
        role: user.tenant_role,
      };
    }
    
    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    logger.http('User authenticated', { userId: user.id, email: user.email });
    
    next();
  } catch (error) {
    logger.errorWithContext(error, { middleware: 'auth' });
    
    if (error.message.includes('expired')) {
      return ApiResponse.unauthorized(res, 'Token expired');
    }
    if (error.message.includes('Invalid') || error.message.includes('revoked')) {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    
    return ApiResponse.error(res, 'Authentication failed', 500);
  }
};

/**
 * Optional authentication
 * Doesn't fail if no token, but attaches user if valid token present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = await verifyToken(token);
      const user = await getUserById(decoded.userId);
      
      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        };
        
        if (user.tenant_id) {
          req.tenant = {
            id: user.tenant_id,
            name: user.tenant_name,
            slug: user.tenant_slug,
            plan: user.plan,
            role: user.tenant_role,
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};

/**
 * Role-based access control middleware
 * @param  {...string} allowedRoles - Roles that are allowed
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }
    
    // Super admin can access everything
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Check tenant role if tenant context exists
    if (req.tenant?.role && allowedRoles.includes(req.tenant.role)) {
      return next();
    }
    
    // Check global role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    logger.warn('Authorization failed', {
      userId: req.user.id,
      userRole: req.user.role,
      tenantRole: req.tenant?.role,
      requiredRoles: allowedRoles,
      path: req.path,
    });
    
    return ApiResponse.forbidden(res, 'Insufficient permissions');
  };
};

/**
 * Check if user is owner or admin of tenant
 */
const isTenantAdmin = (req, res, next) => {
  if (!req.tenant) {
    return ApiResponse.forbidden(res, 'No tenant context');
  }
  
  const adminRoles = ['owner', 'admin'];
  
  if (!adminRoles.includes(req.tenant.role)) {
    return ApiResponse.forbidden(res, 'Admin access required');
  }
  
  next();
};

/**
 * Blacklist token (logout)
 * @param {string} token
 * @param {number} expiresIn - Seconds until token naturally expires
 */
const blacklistToken = async (token, expiresIn) => {
  const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  
  await db.query(
    'INSERT INTO token_blacklist (token_hash, expires_at) VALUES ($1, $2) ON CONFLICT (token_hash) DO NOTHING',
    [tokenHash, expiresAt]
  );
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  isTenantAdmin,
  blacklistToken,
  extractToken,
  verifyToken,
};

/**
 * Rate Limiting Middleware
 * Flexible rate limiting with Redis backend
 */

const redis = require('../config/redis');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Generate rate limit key based on request
 */
const generateKey = (req, identifier) => {
  const type = identifier || 'ip';
  
  switch (type) {
    case 'ip':
      return `ratelimit:${req.ip || req.connection.remoteAddress}`;
    case 'user':
      return `ratelimit:user:${req.user?.id || 'anonymous'}`;
    case 'tenant':
      return `ratelimit:tenant:${req.tenant?.id || 'unknown'}`;
    case 'api':
      return `ratelimit:api:${req.ip || req.connection.remoteAddress}:${req.path}`;
    default:
      return `ratelimit:${type}:${identifier}`;
  }
};

/**
 * Get plan-specific limits
 */
const getPlanLimits = (plan) => {
  const limits = {
    free: { requests: 100, windowMs: 900000 }, // 100 per 15 min
    pro: { requests: 500, windowMs: 900000 },   // 500 per 15 min
    business: { requests: 2000, windowMs: 900000 }, // 2000 per 15 min
    enterprise: { requests: 10000, windowMs: 900000 }, // 10000 per 15 min
    api: { requests: config.rateLimit.maxRequests, windowMs: config.rateLimit.windowMs },
  };
  
  return limits[plan] || limits.free;
};

/**
 * Create rate limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.identifier - Key type (ip, user, tenant, api)
 * @param {Function} options.skip - Function to skip rate limiting
 * @param {Function} options.onLimitReached - Callback when limit reached
 */
const rateLimit = (options = {}) => {
  const {
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
    identifier = 'ip',
    skip = () => false,
    onLimitReached = null,
  } = options;

  return async (req, res, next) => {
    try {
      // Skip if condition met
      if (skip(req, res)) {
        return next();
      }

      const key = generateKey(req, identifier);
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use Redis sorted set for sliding window
      await redis.connect();
      
      // Remove old entries
      await redis.client.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests in window
      const currentCount = await redis.client.zcard(key);
      
      if (currentCount >= maxRequests) {
        // Get time until oldest entry expires
        const oldestEntry = await redis.client.zrange(key, 0, 0, 'WITHSCORES');
        const retryAfter = Math.ceil((oldestEntry[1] - windowStart) / 1000);
        
        // Set response headers
        res.set('X-RateLimit-Limit', maxRequests);
        res.set('X-RateLimit-Remaining', 0);
        res.set('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000));
        res.set('Retry-After', retryAfter);

        // Callback
        if (onLimitReached) {
          onLimitReached(req, res);
        }

        logger.warn('Rate limit exceeded', {
          key,
          currentCount,
          maxRequests,
          path: req.path,
          userId: req.user?.id,
          tenantId: req.tenant?.id,
        });

        return ApiResponse.tooManyRequests(res, `Too many requests. Try again in ${retryAfter}s`);
      }

      // Add current request
      await redis.client.zadd(key, now, `${now}-${Math.random()}`);
      await redis.client.expire(key, Math.ceil(windowMs / 1000));

      // Set headers
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount - 1));
      res.set('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      next();
    } catch (error) {
      logger.errorWithContext(error, { middleware: 'rateLimit' });
      // Fail open - allow request if Redis is down
      next();
    }
  };
};

/**
 * Pre-configured rate limiters for common use cases
 */
const limiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    identifier: 'ip',
  }),

  // Auth endpoints (stricter)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    identifier: 'ip',
  }),

  // User-specific (uses plan limits)
  user: async (req, res, next) => {
    if (!req.user) {
      return limiters.general(req, res, next);
    }

    const limits = getPlanLimits(req.user.plan || 'free');
    
    return rateLimit({
      windowMs: limits.windowMs,
      maxRequests: limits.requests,
      identifier: 'user',
    })(req, res, next);
  },

  // Tenant-specific (uses plan limits)
  tenant: async (req, res, next) => {
    if (!req.tenant) {
      return limiters.general(req, res, next);
    }

    const limits = getPlanLimits(req.tenant.plan || 'free');
    
    return rateLimit({
      windowMs: limits.windowMs,
      maxRequests: limits.requests,
      identifier: 'tenant',
    })(req, res, next);
  },

  // File upload (stricter)
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    identifier: 'user',
  }),

  // API endpoint specific
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    identifier: 'api',
  }),
};

/**
 * Slow down middleware - progressively slower responses under load
 */
const slowDown = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    delayAfter = 100,
    delayMs = 1000,
    maxDelayMs = 30000,
  } = options;

  return async (req, res, next) => {
    try {
      const key = `slowdown:${req.ip || req.connection.remoteAddress}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      await redis.connect();
      await redis.client.zremrangebyscore(key, 0, windowStart);
      
      const count = await redis.client.zcard(key);
      await redis.client.zadd(key, now, `${now}-${Math.random()}`);
      await redis.client.expire(key, Math.ceil(windowMs / 1000));

      if (count > delayAfter) {
        const excessRequests = count - delayAfter;
        const delay = Math.min(excessRequests * delayMs, maxDelayMs);
        
        res.set('X-Delay-MS', delay);
        
        logger.http('Request delayed', { delay, count, path: req.path });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      next();
    } catch (error) {
      logger.errorWithContext(error, { middleware: 'slowDown' });
      next();
    }
  };
};

module.exports = {
  rateLimit,
  limiters,
  slowDown,
  generateKey,
  getPlanLimits,
};

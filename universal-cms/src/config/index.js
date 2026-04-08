/**
 * Universal CMS - Main Configuration
 * Centralized configuration management
 */

require('dotenv').config();

const config = {
  // Application
  app: {
    name: process.env.APP_NAME || 'Universal CMS',
    version: process.env.APP_VERSION || '2.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    url: process.env.APP_URL || 'http://localhost:3000',
    secret: process.env.APP_SECRET || 'change-me-in-production',
  },

  // Database
  database: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'universal_cms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    plans: {
      free: process.env.STRIPE_PLAN_FREE || 'price_free',
      pro: process.env.STRIPE_PLAN_PRO || 'price_pro',
      business: process.env.STRIPE_PLAN_BUSINESS || 'price_business',
      enterprise: process.env.STRIPE_PLAN_ENTERPRISE || 'price_enterprise',
    },
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000,
  },

  // Storage (S3 Compatible)
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // local, s3, minio
    bucket: process.env.STORAGE_BUCKET || 'cms-uploads',
    region: process.env.STORAGE_REGION || 'us-east-1',
    endpoint: process.env.STORAGE_ENDPOINT || '',
    accessKeyId: process.env.STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.STORAGE_SECRET_KEY || '',
    cdnUrl: process.env.STORAGE_CDN_URL || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'jwt-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@universalcms.com',
  },

  // i18n
  i18n: {
    defaultLocale: process.env.DEFAULT_LOCALE || 'en',
    supportedLocales: (process.env.SUPPORTED_LOCALES || 'en,uk,ru,de,fr,es,it,ja,zh,ar').split(','),
    fallbackLocale: process.env.FALLBACK_LOCALE || 'en',
  },

  // Security
  security: {
    corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
    helmet: process.env.HELMET_ENABLED !== 'false',
    trustedProxy: process.env.TRUSTED_PROXY || '',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json', // json, combined
    directory: process.env.LOG_DIR || './logs',
  },
};

// Validate required environment variables in production
if (config.app.env === 'production') {
  const required = ['APP_SECRET', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing required env vars in production: ${missing.join(', ')}`);
  }
}

module.exports = config;

# Universal CMS - Main Server Entry Point

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import responseTime from 'response-time';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import winston from 'winston';

// Load environment variables
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import core modules
import CMSEngine from './core/engine.js';
import PluginSystem from './core/plugin-system.js';
import TenantManager from './core/tenant-manager.js';
import LocalizationService from './core/localization.js';

// Import API routes
import authRoutes from './api/routes/auth.js';
import cmsRoutes from './api/routes/cms.js';
import builderRoutes from './api/routes/builder.js';
import billingRoutes from './api/routes/billing.js';
import aiRoutes from './api/routes/ai.js';
import webhookRoutes from './api/routes/webhooks.js';

// Import middleware
import authMiddleware from './api/middleware/auth.js';
import tenantMiddleware from './api/middleware/tenant.js';
import rateLimitMiddleware from './api/middleware/rate-limit.js';
import usageTrackerMiddleware from './api/middleware/usage-tracker.js';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Compression
app.use(compression());

// Request timing
app.use(responseTime());

// Body parsing
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0-saas'
  });
});

// Initialize core systems
async function initializeSystems() {
  try {
    logger.info('Initializing Universal CMS Platform...');

    // Initialize CMS Engine
    const cmsEngine = new CMSEngine({
      database: process.env.DATABASE_URL,
      redis: process.env.REDIS_URL,
      logger
    });
    await cmsEngine.initialize();

    // Initialize Tenant Manager
    const tenantManager = new TenantManager({
      database: process.env.DATABASE_URL,
      defaultPlan: process.env.DEFAULT_TENANT_PLAN || 'free'
    });
    await tenantManager.initialize();

    // Initialize Localization
    const localization = new LocalizationService({
      defaultLocale: 'en',
      supportedLocales: ['en', 'uk', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru']
    });
    await localization.initialize();

    // Initialize Plugin System
    const pluginSystem = new PluginSystem({
      cmsEngine,
      logger
    });
    await pluginSystem.initialize();

    // Load plugins
    await pluginSystem.loadPlugins();

    // Apply global middleware
    app.use(rateLimitMiddleware);
    app.use(authMiddleware);
    app.use(tenantMiddleware);
    app.use(usageTrackerMiddleware);

    // Mount API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/cms', cmsRoutes);
    app.use('/api/builder', builderRoutes);
    app.use('/api/billing', billingRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/webhooks', webhookRoutes);

    // Serve admin panel (production)
    if (process.env.NODE_ENV === 'production') {
      const adminPath = join(__dirname, 'admin', 'dist');
      app.use('/admin', express.static(adminPath));
      
      // SPA fallback for admin
      app.get('/admin/*', (req, res) => {
        res.sendFile(join(adminPath, 'index.html'));
      });
    }

    // Serve uploads
    app.use('/uploads', express.static(join(__dirname, 'storage', 'uploads')));

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
      });

      res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
      });
    });

    logger.info('✅ Universal CMS Platform initialized successfully');

    return {
      cmsEngine,
      tenantManager,
      pluginSystem,
      localization
    };
  } catch (error) {
    logger.error('Failed to initialize systems:', error);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    const systems = await initializeSystems();

    app.listen(PORT, () => {
      logger.info(`🚀 Universal CMS Platform running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌍 API URL: http://localhost:${PORT}/api`);
      logger.info(`🎨 Admin Panel: http://localhost:${PORT}/admin`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      systems.cmsEngine.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      systems.cmsEngine.shutdown();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing and programmatic use
export { app, initializeSystems, logger };

// Start if not imported
if (process.argv[1] && process.argv[1].includes('server.js')) {
  startServer();
}

export default startServer;

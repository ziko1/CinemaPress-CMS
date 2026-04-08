/**
 * Logger Utility
 * Winston-based structured logging with file and console outputs
 */

const winston = require('winston');
const path = require('path');
const config = require('../config');

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Log formats
const logDir = config.logging.directory;

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// JSON format for production/file
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'ISO8601' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [];

// Console transport
transports.push(
  new winston.transports.Console({
    format: config.app.env === 'production' ? jsonFormat : consoleFormat,
    level: config.logging.level,
  })
);

// File transport for errors
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// File transport for all logs
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    level: config.logging.level,
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// HTTP request logger middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    let level = 'http';
    if (status >= 500) level = 'error';
    else if (status >= 400) level = 'warn';
    
    logger.log(level, 'HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      status,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      tenantId: req.tenant?.id,
      userId: req.user?.id,
    });
  });
  
  next();
};

// Create logger instance
const logger = winston.createLogger({
  levels,
  transports,
  defaultMeta: {
    service: config.app.name,
    version: config.app.version,
    environment: config.app.env,
  },
});

// Helper methods
logger.httpRequest = (req, res, next) => httpLogger(req, res, next);

logger.audit = (action, details, user) => {
  logger.info('AUDIT', {
    action,
    details,
    userId: user?.id,
    userEmail: user?.email,
    timestamp: new Date().toISOString(),
  });
};

logger.errorWithContext = (error, context = {}) => {
  logger.error(error.message || error, {
    ...context,
    stack: error.stack,
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

module.exports = logger;

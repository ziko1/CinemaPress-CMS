/**
 * Error Handling Middleware
 * Centralized error handler for all routes
 */

import logger from '../utils/logger.js';
import config from '../config/index.js';

class ApiError extends Error {
  constructor(statusCode, message, code = 'API_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    tenantId: req.tenant?.id,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(404, message, 'NOT_FOUND');
  }

  // Mongoose duplicate key
  if (err.code === 23514 || err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ApiError(400, message, 'DUPLICATE_VALUE');
    
    // Try to extract field name
    if (err.detail) {
      const field = err.detail.match(/\(([^)]+)\)/)?.[1];
      if (field) {
        error.details = { field, message: `Value for ${field} already exists` };
      }
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message, 'VALIDATION_ERROR', err.errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ApiError(401, message, 'TOKEN_EXPIRED');
  }

  // Handle our custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unhandled errors
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
};

// Async handler wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { ApiError, asyncHandler };
export default errorHandler;

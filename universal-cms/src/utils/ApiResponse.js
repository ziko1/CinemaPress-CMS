/**
 * API Response Helper
 * Standardized response formatting for REST API
 */

class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {any} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Created response (201)
   * @param {Object} res
   * @param {any} data
   * @param {string} message
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   * @param {Object} res
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Error response
   * @param {Object} res
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {any} errors - Validation errors or additional details
   */
  static error(res, message = 'Error occurred', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Bad request response (400)
   * @param {Object} res
   * @param {string} message
   * @param {any} errors
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Unauthorized response (401)
   * @param {Object} res
   * @param {string} message
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response (403)
   * @param {Object} res
   * @param {string} message
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Not found response (404)
   * @param {Object} res
   * @param {string} message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Conflict response (409)
   * @param {Object} res
   * @param {string} message
   */
  static conflict(res, message = 'Resource already exists') {
    return this.error(res, message, 409);
  }

  /**
   * Too many requests response (429)
   * @param {Object} res
   * @param {string} message
   */
  static tooManyRequests(res, message = 'Too many requests') {
    return this.error(res, message, 429);
  }

  /**
   * Paginated response
   * @param {Object} res
   * @param {Array} items - Array of items
   * @param {Object} pagination - Pagination metadata
   * @param {string} message
   */
  static paginated(res, items, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        items,
        pagination: {
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          hasNext: pagination.page < pagination.totalPages,
          hasPrev: pagination.page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Validation error response
   * @param {Object} res
   * @param {Array} errors - Array of validation errors
   */
  static validationError(res, errors) {
    return this.error(res, 'Validation failed', 400, {
      type: 'validation_error',
      details: errors,
    });
  }

  /**
   * Rate limit exceeded response
   * @param {Object} res
   * @param {number} retryAfter - Seconds to wait
   */
  static rateLimitExceeded(res, retryAfter = 60) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      retryAfter,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ApiResponse;

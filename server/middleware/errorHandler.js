/**
 * Central Error Handler Middleware
 * Handles all errors and sends appropriate responses
 * BACKWARD COMPATIBLE: Supports both old and new error formats
 */
const logger = require('../utils/logger');
const { AppError } = require('../errors');
const { ValidationError } = require('../../shared/validation');

function errorHandler(err, req, res, next) {
  const correlationId = req.correlationId || 'unknown';
  
  // Log error with full details
  logger.error('Error occurred', {
    correlationId,
    error: err.message,
    stack: err.stack,
    type: err.constructor.name,
    path: req.path,
    method: req.method,
    ...(err.details && { details: err.details }),
  });
  
  // Determine if this is an operational error
  const isOperational = err.isOperational || err instanceof AppError;
  
  // Default error response
  let statusCode = 500;
  let errorMessage = 'An internal error occurred';
  let errorType = 'InternalServerError';
  let errorDetails = null;
  
  // Handle operational errors
  if (isOperational) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorType = err.type;
    errorDetails = err.details;
  }
  
  // Handle ValidationError specially
  if (err.isValidationError || err instanceof ValidationError) {
    statusCode = 400;
    errorMessage = err.message;
    errorType = 'ValidationError';
    errorDetails = err.errors; // Array of field errors
  }
  
  // ============================================
  // BACKWARD COMPATIBLE RESPONSE FORMAT
  // ============================================
  // Old format: { "error": "message" }
  // New format: { "error": {...}, "errorDetails": {...} }
  
  const response = {
    // OLD FORMAT (for backward compatibility with frontend)
    error: errorMessage,
    
    // NEW FORMAT (for enhanced error handling)
    errorDetails: {
      type: errorType,
      message: errorMessage,
      correlationId,
      ...(errorDetails && { details: errorDetails })
    }
  };
  
  // For ValidationError: Include errors array at top level
  if (err.isValidationError || err instanceof ValidationError) {
    response.errors = err.errors;
  }
  
  // In development, include stack trace in errorDetails
  if (process.env.NODE_ENV !== 'production') {
    response.errorDetails.stack = err.stack;
  }
  
  // Send response
  res.status(statusCode).json(response);
  
  // For non-operational errors in production, consider alerting
  if (!isOperational && process.env.NODE_ENV === 'production') {
    logger.error('Non-operational error detected!', {
      correlationId,
      error: err.message,
      stack: err.stack,
    });
    // TODO: Send alert to monitoring system (e.g., Sentry)
  }
}

module.exports = errorHandler;
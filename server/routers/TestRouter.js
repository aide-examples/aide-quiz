/**
 * Test Router - Endpoints for testing error handling and validation
 * Only available in development mode
 */

const express = require('express');
const logger = require('../utils/logger');

class TestRouter {
  constructor(validator = null) {
    this.validator = validator;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Only enable in development
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Test endpoints disabled in production');
      return;
    }

    // ============================================
    // VALIDATION TEST ENDPOINTS
    // ============================================

    /**
     * Test endpoint: Quiz validation
     * POST /api/test/validate/quiz
     */
    if (this.validator) {
      this.router.post('/test/validate/quiz', async (req, res, next) => {
        try {
          const { title, imagePath } = req.body;
          
          logger.info('Test: Quiz validation triggered', {
            correlationId: req.correlationId,
            title,
            imagePath
          });
          
          // Perform validation (as in repository)
          const validated = this.validator.validate('Quiz', {
            title,
            imagePath
          });
          
          // Success
          res.json({
            success: true,
            message: 'Validation successful',
            validated
          });
          
        } catch (error) {
          // ValidationError is handled by ErrorHandler
          next(error);
        }
      });

      logger.info('Validation test endpoint enabled: POST /api/test/validate/quiz');
      
      /**
       * Test endpoint: User validation (Email + Uppercase)
       * POST /api/test/validate/user
       */
      this.router.post('/test/validate/user', async (req, res, next) => {
        try {
          const { email, name } = req.body;
          
          logger.info('Test: User validation triggered', {
            correlationId: req.correlationId,
            email,
            name
          });
          
          // Define user rules (if not already present)
          if (!this.validator.getRules('User')) {
            this.validator.defineRules('User', {
              email: {
                type: 'string',
                required: true,
                trim: true,
                email: true,
                maxLength: 100
              },
              name: {
                type: 'string',
                required: true,
                trim: true,
                transform: 'uppercase',
                maxLength: 50
              }
            });
          }
          
          // Perform validation
          const validated = this.validator.validate('User', {
            email,
            name
          });
          
          // Success
          res.json({
            success: true,
            message: 'Validation successful',
            validated
          });
          
        } catch (error) {
          // ValidationError is handled by ErrorHandler
          next(error);
        }
      });
      
      logger.info('Validation test endpoint enabled: POST /api/test/validate/user');
    }

    // ============================================
    // ERROR TEST ENDPOINTS
    // ============================================

    /**
     * Test endpoint: Division by zero
     * GET /api/test/error/divzero
     */
    this.router.get('/test/error/divzero', (req, res, next) => {
      logger.info('Test: Division by zero error triggered', {
        correlationId: req.correlationId
      });
      
      const x = 1;
      const y = 0;
      const result = x / y; // JavaScript: Infinity, not an error
      
      // Force an actual error
      if (!isFinite(result)) {
        const error = new Error('Division by zero detected');
        error.statusCode = 500;
        throw error;
      }
      
      res.json({ result });
    });

    /**
     * Test endpoint: Null pointer / undefined access
     * GET /api/test/error/nullpointer
     */
    this.router.get('/test/error/nullpointer', (req, res, next) => {
      logger.info('Test: Null pointer error triggered', {
        correlationId: req.correlationId
      });
      
      const obj = null;
      const value = obj.property; // TypeError: Cannot read property of null
      
      res.json({ value });
    });

    /**
     * Test endpoint: Array index out of bounds
     * GET /api/test/error/arrayindex
     */
    this.router.get('/test/error/arrayindex', (req, res, next) => {
      logger.info('Test: Array access error triggered', {
        correlationId: req.correlationId
      });
      
      const arr = [1, 2, 3];
      const value = arr[10].toString(); // undefined.toString() → TypeError
      
      res.json({ value });
    });

    /**
     * Test endpoint: JSON parse error
     * GET /api/test/error/jsonparse
     */
    this.router.get('/test/error/jsonparse', (req, res, next) => {
      logger.info('Test: JSON parse error triggered', {
        correlationId: req.correlationId
      });
      
      const invalidJson = '{ invalid json }';
      const obj = JSON.parse(invalidJson); // SyntaxError
      
      res.json({ obj });
    });

    /**
     * Test endpoint: Database error simulation
     * GET /api/test/error/database
     */
    this.router.get('/test/error/database', (req, res, next) => {
      logger.info('Test: Database error triggered', {
        correlationId: req.correlationId
      });
      
      // Simulate database error
      const error = new Error('SQLITE_ERROR: no such table: nonexistent_table');
      error.code = 'SQLITE_ERROR';
      error.statusCode = 500;
      throw error;
    });

    /**
     * Test endpoint: Async error
     * GET /api/test/error/async
     */
    this.router.get('/test/error/async', async (req, res, next) => {
      logger.info('Test: Async error triggered', {
        correlationId: req.correlationId
      });
      
      try {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Async operation failed'));
          }, 100);
        });
        
        res.json({ success: true });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Test endpoint: Custom error with details
     * GET /api/test/error/custom
     */
    this.router.get('/test/error/custom', (req, res, next) => {
      logger.info('Test: Custom error triggered', {
        correlationId: req.correlationId
      });
      
      const error = new Error('Custom test error with details');
      error.statusCode = 418; // I'm a teapot
      error.details = [
        'This is detail 1',
        'This is detail 2',
        'This is detail 3'
      ];
      throw error;
    });

    /**
     * Test endpoint: Success (control test)
     * GET /api/test/success
     */
    this.router.get('/test/success', (req, res) => {
      logger.info('Test: Success endpoint called', {
        correlationId: req.correlationId
      });
      
      res.json({
        success: true,
        message: 'Test endpoint working correctly',
        correlationId: req.correlationId
      });
    });

    logger.info('Test error endpoints enabled', {
      endpoints: [
        'POST /api/test/validate/quiz',
        'GET /api/test/error/divzero',
        'GET /api/test/error/nullpointer',
        'GET /api/test/error/arrayindex',
        'GET /api/test/error/jsonparse',
        'GET /api/test/error/database',
        'GET /api/test/error/async',
        'GET /api/test/error/custom',
        'GET /api/test/success'
      ]
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = TestRouter;
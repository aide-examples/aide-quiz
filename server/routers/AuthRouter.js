const express = require('express');
const logger = require('../utils/logger');

/**
 * Authentication Router
 * Handles teacher login, logout, and status checks.
 * @module routers/AuthRouter
 */
class AuthRouter {
  constructor(authService) {
    this.authService = authService;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * Teacher Login
     * @name LoginTeacher
     * @route POST /api/teacher/login
     * @description Authenticate as teacher with password. Sets session cookie on success.
     *
     * @example
     * // Request
     * POST /api/teacher/login
     * Content-Type: application/json
     *
     * {
     *   "password": "your-teacher-password"
     * }
     *
     * @example
     * // Response 200 OK
     * {
     *   "ok": true
     * }
     *
     * @example
     * // Response 401 Unauthorized
     * {
     *   "error": "Invalid credentials",
     *   "errorDetails": { "type": "InvalidCredentialsError" }
     * }
     */
    this.router.post('/teacher/login', async (req, res, next) => {
      try {
        const { password } = req.body;

        // Verify password (throws on error)
        await this.authService.verifyTeacherPassword(password);

        // Set teacher session
        this.authService.setTeacherSession(req.session);

        logger.info('Teacher login successful', {
          correlationId: req.correlationId
        });

        return res.json({ ok: true });
      } catch (err) {
        // Pass error to error handler
        next(err);
      }
    });

    /**
     * Teacher Logout
     * @name LogoutTeacher
     * @route POST /api/teacher/logout
     * @description End teacher session. Clears session cookie.
     *
     * @example
     * // Request
     * POST /api/teacher/logout
     *
     * @example
     * // Response 200 OK
     * {
     *   "ok": true
     * }
     */
    this.router.post('/teacher/logout', (req, res) => {
      this.authService.clearTeacherSession(req.session);

      logger.info('Teacher logout', {
        correlationId: req.correlationId
      });

      return res.json({ ok: true });
    });

    /**
     * Check Authentication Status
     * @name GetAuthStatus
     * @route GET /api/teacher/status
     * @description Check if current session is authenticated as teacher.
     *
     * @example
     * // Request
     * GET /api/teacher/status
     *
     * @example
     * // Response 200 OK (authenticated)
     * {
     *   "authenticated": true
     * }
     *
     * @example
     * // Response 200 OK (not authenticated)
     * {
     *   "authenticated": false
     * }
     */
    this.router.get('/teacher/status', (req, res) => {
      const isTeacher = this.authService.isTeacher(req.session);
      return res.json({ authenticated: isTeacher });
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = AuthRouter;

const bcrypt = require('bcrypt');
const Constants = require('../config/constants');
const logger = require('../utils/logger');
const { AuthenticationError, InvalidCredentialsError } = require('../errors');

class AuthService {
  constructor() {
    this.teacherPasswordHash = null;
    this.initializePasswordHash();
  }

  async initializePasswordHash() {
    try {
      this.teacherPasswordHash = await bcrypt.hash(
        Constants.TEACHER_PASSWORD,
        Constants.BCRYPT_ROUNDS
      );
      logger.info('Teacher password hash initialized');
    } catch (err) {
      logger.error('Failed to initialize password hash', { error: err.message });
      throw err;
    }
  }

  /**
   * Verify teacher password (async with bcrypt)
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} - True if password is correct
   */
  async verifyTeacherPassword(password) {
    if (!password) {
      logger.warn('Login attempt with empty password');
      throw new InvalidCredentialsError();
    }

    if (!this.teacherPasswordHash) {
      logger.error('Password hash not initialized');
      throw new AuthenticationError('Authentication system not ready');
    }

    try {
      // Use bcrypt compare instead of plaintext comparison
      const isValid = await bcrypt.compare(password, this.teacherPasswordHash);
      
      if (!isValid) {
        logger.warn('Failed login attempt - invalid password');
        throw new InvalidCredentialsError();
      }

      logger.info('Successful teacher login');
      return true;
    } catch (err) {
      if (err instanceof AuthenticationError) {
        throw err;
      }
      logger.error('Password verification error', { error: err.message });
      throw new AuthenticationError('Authentication failed');
    }
  }

  isTeacher(session) {
    return !!(session && session.teacher);
  }

  setTeacherSession(session) {
    session.teacher = true;
    session.demoMode = false;
    logger.debug('Teacher session set');
  }

  clearTeacherSession(session) {
    delete session.teacher;
    delete session.demoMode;
    delete session.demoQuizPath;
    logger.debug('Teacher session cleared');
  }

  // ======================
  // DEMO MODE
  // ======================

  /**
   * Check if password is the demo password
   * @param {string} password
   * @returns {boolean}
   */
  isDemoPassword(password) {
    return password === Constants.DEMO_PASSWORD;
  }

  /**
   * Set demo session (limited access)
   * @param {object} session
   */
  setDemoSession(session) {
    session.teacher = true;
    session.demoMode = true;
    session.demoQuizPath = Constants.DEMO_QUIZ_PATH;
    logger.info('Demo session set');
  }

  /**
   * Check if session is in demo mode
   * @param {object} session
   * @returns {boolean}
   */
  isDemoMode(session) {
    return !!(session && session.demoMode);
  }

  /**
   * Get the demo quiz path from session
   * @param {object} session
   * @returns {string|null}
   */
  getDemoQuizPath(session) {
    return session?.demoQuizPath || null;
  }

  /**
   * Middleware to require teacher authentication
   */
  requireTeacher() {
    return (req, res, next) => {
      if (this.isTeacher(req.session)) {
        return next();
      }
      
      logger.warn('Unauthorized access attempt', {
        path: req.path,
        correlationId: req.correlationId,
      });
      
      // Throw error instead of sending response (let errorHandler handle it)
      next(new AuthenticationError('Teacher authentication required'));
    };
  }
}

module.exports = AuthService;

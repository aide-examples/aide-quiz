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
    logger.debug('Teacher session set');
  }

  clearTeacherSession(session) {
    delete session.teacher;
    logger.debug('Teacher session cleared');
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

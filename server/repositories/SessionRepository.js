const logger = require('../utils/logger');

class SessionRepository {
  constructor(db, validator) {
    this.db = db;
    this.validator = validator;
    
    // Register validation rules
    if (this.validator) {
      this._registerValidationRules();
    }
  }
  
  /**
   * Register validation rules for Session entity
   * @private
   */
  _registerValidationRules() {
    // Skip if already registered
    if (this.validator.hasRules('Session')) {
      logger.debug('Session validation rules already registered - skipping');
      return;
    }
    
    this.validator.defineRules('Session', {
      sessionName: {
        type: 'string',
        required: true,
        trim: true,
        pattern: /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/  // Format: YYYY-MM-DD-HH-MM
      }
    });
    
    logger.debug('Session validation rules registered');
  }

  create(id, sessionName, quizId, teacherId, openFrom, openUntil, createdAt) {
    try {
      // Validate if validator available
      if (this.validator) {
        const validated = this.validator.validate('Session', { sessionName });
        sessionName = validated.sessionName;
      }
      
      this.db.prepare(`
        INSERT INTO quiz_sessions (id, session_name, quiz_id, teacher_id, open_from, open_until, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, sessionName, quizId, teacherId, openFrom, openUntil, createdAt);
      
      logger.debug('Session created in repository', { id, sessionName });
    } catch (err) {
      logger.error('Failed to create session in database', {
        id,
        sessionName,
        error: err.message
      });
      throw err;
    }
  }

  findByName(sessionName) {
    try {
      return this.db.prepare(`
        SELECT * FROM quiz_sessions WHERE session_name = ?
      `).get(sessionName);
    } catch (err) {
      logger.error('Failed to find session by name', {
        sessionName,
        error: err.message
      });
      throw err;
    }
  }

  findById(id) {
    try {
      return this.db.prepare(`
        SELECT * FROM quiz_sessions WHERE id = ?
      `).get(id);
    } catch (err) {
      logger.error('Failed to find session by ID', { id, error: err.message });
      throw err;
    }
  }

  findAll(limit = 100) {
    try {
      return this.db.prepare(`
        SELECT session_name, quiz_sessions.id, quiz_sessions.quiz_id, quizzes.title, quiz_sessions.created_at
        FROM quiz_sessions
        LEFT JOIN quizzes ON quiz_sessions.quiz_id = quizzes.id
        ORDER BY quiz_sessions.created_at DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      logger.error('Failed to find all sessions', { error: err.message });
      throw err;
    }
  }

  findCurrentlyOpen() {
    try {
      const now = new Date().toISOString();
      return this.db.prepare(`
        SELECT session_name, quiz_sessions.id, quiz_sessions.quiz_id, quizzes.title,
               quiz_sessions.created_at, quiz_sessions.open_from, quiz_sessions.open_until
        FROM quiz_sessions
        LEFT JOIN quizzes ON quiz_sessions.quiz_id = quizzes.id
        WHERE quiz_sessions.open_from <= ?
          AND (quiz_sessions.open_until IS NULL OR quiz_sessions.open_until >= ?)
        ORDER BY quiz_sessions.created_at DESC
      `).all(now, now);
    } catch (err) {
      logger.error('Failed to find currently open sessions', { error: err.message });
      throw err;
    }
  }

  update(id, openFrom, openUntil) {
    try {
      this.db.prepare(`
        UPDATE quiz_sessions 
        SET open_from = ?, open_until = ? 
        WHERE id = ?
      `).run(openFrom, openUntil, id);
      
      logger.debug('Session updated in repository', { id });
    } catch (err) {
      logger.error('Failed to update session', { id, error: err.message });
      throw err;
    }
  }

  delete(id) {
    try {
      this.db.prepare(`
        DELETE FROM quiz_sessions WHERE id = ?
      `).run(id);
      
      logger.info('Session deleted from repository', { id });
    } catch (err) {
      logger.error('Failed to delete session', { id, error: err.message });
      throw err;
    }
  }

  deleteByQuizId(quizId) {
    try {
      const result = this.db.prepare(`
        DELETE FROM quiz_sessions WHERE quiz_id = ?
      `).run(quizId);
      
      logger.info('Sessions deleted by quiz_id', { quizId, count: result.changes });
      return result.changes;
    } catch (err) {
      logger.error('Failed to delete sessions by quiz_id', { quizId, error: err.message });
      throw err;
    }
  }

  findSessionIdsByQuizId(quizId) {
    try {
      const rows = this.db.prepare(`
        SELECT id FROM quiz_sessions WHERE quiz_id = ?
      `).all(quizId);
      
      return rows.map(row => row.id);
    } catch (err) {
      logger.error('Failed to find session IDs by quiz_id', { quizId, error: err.message });
      throw err;
    }
  }
}

module.exports = SessionRepository;
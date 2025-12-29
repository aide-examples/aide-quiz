const logger = require('../utils/logger');

class SubmissionRepository {
  constructor(db, validator) {
    this.db = db;
    this.validator = validator;
    
    // Register validation rules
    if (this.validator) {
      this._registerValidationRules();
    }
  }
  
  /**
   * Register validation rules for Submission entity
   * @private
   */
  _registerValidationRules() {
    // Skip if already registered
    if (this.validator.hasRules('Submission')) {
      logger.debug('Submission validation rules already registered - skipping');
      return;
    }
    
    this.validator.defineRules('Submission', {
      userCode: {
        type: 'string',
        required: true,
        trim: true,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9äöüÄÖÜß _-]+$/  // Alphanumeric, umlauts, spaces, hyphen, underscore
      }
    });
    
    logger.debug('Submission validation rules registered');
  }

  create(id, sessionId, sessionName, userCode, resultLink, answersJson, score, maxScore, createdAt) {
    try {
      // Validate if validator available
      if (this.validator) {
        const validated = this.validator.validate('Submission', { userCode });
        userCode = validated.userCode;
      }
      
      this.db.prepare(`
        INSERT INTO submissions 
        (id, session_id, session_name, user_code, result_link, answers_json, score, max_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, sessionId, sessionName, userCode, resultLink, answersJson, score, maxScore, createdAt);
      
      logger.debug('Submission created in repository', { id, userCode, sessionName });
    } catch (err) {
      logger.error('Failed to create submission in database', {
        id,
        userCode,
        sessionName,
        error: err.message
      });
      throw err;
    }
  }

  findById(id) {
    try {
      return this.db.prepare(`
        SELECT * FROM submissions WHERE id = ?
      `).get(id);
    } catch (err) {
      logger.error('Failed to find submission by ID', { id, error: err.message });
      throw err;
    }
  }

  findBySessionAndUser(sessionName, userCode) {
    try {
      return this.db.prepare(`
        SELECT * FROM submissions 
        WHERE session_name = ? AND user_code = ?
      `).get(sessionName, userCode);
    } catch (err) {
      logger.error('Failed to find submission by session and user', {
        sessionName,
        userCode,
        error: err.message
      });
      throw err;
    }
  }

  findBySessionName(sessionName) {
    try {
      return this.db.prepare(`
        SELECT * FROM submissions WHERE session_name = ?
        ORDER BY created_at DESC
      `).all(sessionName);
    } catch (err) {
      logger.error('Failed to find submissions by session name', {
        sessionName,
        error: err.message
      });
      throw err;
    }
  }

  findSummaryBySessionName(sessionName) {
    try {
      return this.db.prepare(`
        SELECT id, session_name, user_code, result_link, score, max_score, created_at 
        FROM submissions 
        WHERE session_name = ?
        ORDER BY created_at DESC
      `).all(sessionName);
    } catch (err) {
      logger.error('Failed to find submission summary', {
        sessionName,
        error: err.message
      });
      throw err;
    }
  }

  delete(id) {
    try {
      this.db.prepare(`
        DELETE FROM submissions WHERE id = ?
      `).run(id);
      
      logger.info('Submission deleted from repository', { id });
    } catch (err) {
      logger.error('Failed to delete submission', { id, error: err.message });
      throw err;
    }
  }

  deleteBySessionIds(sessionIds) {
    if (!sessionIds || sessionIds.length === 0) {
      return 0;
    }
    
    try {
      const placeholders = sessionIds.map(() => '?').join(',');
      const result = this.db.prepare(`
        DELETE FROM submissions WHERE session_id IN (${placeholders})
      `).run(...sessionIds);
      
      logger.info('Submissions deleted by session_ids', { 
        sessionIds, 
        count: result.changes 
      });
      return result.changes;
    } catch (err) {
      logger.error('Failed to delete submissions by session_ids', { 
        sessionIds, 
        error: err.message 
      });
      throw err;
    }
  }
}

module.exports = SubmissionRepository;
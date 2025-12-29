const logger = require('../utils/logger');
const { ObjectValidator } = require('../../shared/validation');

class QuizRepository {
  constructor(db, validator) {
    this.db = db;
    this.validator = validator;
    
    // Register validation rules
    this._registerValidationRules();
  }
  
  /**
   * Register validation rules for Quiz entity and content
   * @private
   */
  _registerValidationRules() {
    // Skip if already registered
    if (this.validator.hasRules('Quiz')) {
      logger.debug('Quiz validation rules already registered - skipping');
      return;
    }
    
    // Quiz Metadata Rules
    this.validator.defineRules('Quiz', {
      title: {
        type: 'string',
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 200
      },
      imagePath: {
        type: 'string',
        required: true,
        trim: true,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9_-]+$/
      }
    });
    
    // QuizContent Rules (for complete quiz objects)
    this.validator.defineRules('QuizContent', {
      id: {
        type: 'string',
        required: false, // Optional - assigned by server
        minLength: 1,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: 'Quiz ID must be alphanumeric (with _ or -) and 1-100 characters'
      },
      title: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 200,
        message: 'Quiz title is required and must be 1-200 characters'
      },
      description: {
        type: 'string',
        required: false,
        maxLength: 1000,
        message: 'Quiz description must be max 1000 characters'
      },
      questions: {
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 100,
        message: 'Quiz must have 1-100 questions'
      }
    });
    
    // Question Rules
    this.validator.defineRules('Question', {
      id: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: 'Question ID must be alphanumeric (with _ or -) and 1-100 characters'
      },
      text: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 5000,
        message: 'Question text is required and must be 1-5000 characters'
      },
      image: {
        type: 'string',
        required: false,
        maxLength: 1000,
        pattern: /^[a-zA-Z0-9_.,-\s]+$/,
        message: 'Question image must be comma-separated filenames (alphanumeric with . _ - , and spaces)'
      },
      reason: {
        type: 'string',
        required: false,
        maxLength: 5000,
        message: 'Question reason must be max 5000 characters'
      },
      reasonImage: {
        type: 'string',
        required: false,
        maxLength: 1000,
        pattern: /^[a-zA-Z0-9_.,-\s]+$/,
        message: 'Question reason image must be comma-separated filenames (alphanumeric with . _ - , and spaces)'
      },
      type: {
        type: 'string',
        required: true,
        enum: ['single', 'multiple'],
        message: 'Question type must be "single" or "multiple"'
      },
      options: {
        type: 'array',
        required: true,
        minItems: 2,
        maxItems: 10,
        message: 'Question must have 2-10 options'
      }
    });
    
    // Option Rules
    this.validator.defineRules('Option', {
      id: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: 'Option ID must be alphanumeric (with _ or -) and 1-100 characters'
      },
      text: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 2000,
        message: 'Option text is required and must be 1-2000 characters'
      },
      image: {
        type: 'string',
        required: false,
        maxLength: 1000,
        pattern: /^[a-zA-Z0-9_.,-\s]+$/,
        message: 'Option image must be comma-separated filenames (alphanumeric with . _ - , and spaces)'
      },
      correct: {
        type: 'boolean',
        required: true,
        message: 'Option must have correct flag (true/false)'
      },
      reason: {
        type: 'string',
        required: false,
        maxLength: 2000,
        message: 'Option reason must be max 2000 characters'
      },
      reasonImage: {
        type: 'string',
        required: false,
        maxLength: 1000,
        pattern: /^[a-zA-Z0-9_.,-\s]+$/,
        message: 'Option reason image must be comma-separated filenames (alphanumeric with . _ - , and spaces)'
      }
    });
    
    logger.debug('Quiz validation rules registered (Quiz, QuizContent, Question, Option)');
  }

  create(id, title, filename, mediaPath, quizJson, createdAt) {
    try {
      // Validate
      const validated = this.validator.validate('Quiz', {
        title,
        imagePath: mediaPath
      });

      // Use validated values (trimmed, transformed)
      this.db.prepare(`
        INSERT INTO quizzes (id, title, filename, media_path, quiz_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, validated.title, filename, validated.imagePath, quizJson, createdAt);
      
      logger.debug('Quiz created in repository', { id, title: validated.title });
    } catch (err) {
      logger.error('Failed to create quiz in database', {
        id,
        title,
        error: err.message
      });
      throw err;
    }
  }

  update(id, title, mediaPath, quizJson) {
    try {
      // Validate
      const validated = this.validator.validate('Quiz', {
        title,
        imagePath: mediaPath
      });

      // Use validated values
      this.db.prepare(`
        UPDATE quizzes 
        SET title = ?, media_path = ?, quiz_json = ? 
        WHERE id = ?
      `).run(validated.title, validated.imagePath, quizJson, id);
      
      logger.debug('Quiz updated in repository', { id, title: validated.title });
    } catch (err) {
      logger.error('Failed to update quiz in database', {
        id,
        error: err.message
      });
      throw err;
    }
  }

  findById(id) {
    try {
      return this.db.prepare(`
        SELECT * FROM quizzes WHERE id = ?
      `).get(id);
    } catch (err) {
      logger.error('Failed to find quiz by ID', { id, error: err.message });
      throw err;
    }
  }

  findAll() {
    try {
      return this.db.prepare(`
        SELECT id, title, filename, media_path, created_at 
        FROM quizzes
        ORDER BY created_at DESC
      `).all();
    } catch (err) {
      logger.error('Failed to find all quizzes', { error: err.message });
      throw err;
    }
  }

  findByFilename(filename) {
    try {
      return this.db.prepare(`
        SELECT * FROM quizzes WHERE filename = ?
      `).get(filename);
    } catch (err) {
      logger.error('Failed to find quiz by filename', {
        filename,
        error: err.message
      });
      throw err;
    }
  }

  existsByTitle(title) {
    try {
      const result = this.db.prepare(`
        SELECT id FROM quizzes WHERE title = ?
      `).get(title);
      return !!result;
    } catch (err) {
      logger.error('Failed to check quiz existence by title', {
        title,
        error: err.message
      });
      throw err;
    }
  }

  getQuizJson(id) {
    try {
      const row = this.db.prepare(`
        SELECT quiz_json FROM quizzes WHERE id = ?
      `).get(id);
      return row ? row.quiz_json : null;
    } catch (err) {
      logger.error('Failed to get quiz JSON', { id, error: err.message });
      throw err;
    }
  }

  getMediaPath(id) {
    try {
      const row = this.db.prepare(`
        SELECT media_path FROM quizzes WHERE id = ?
      `).get(id);
      return row ? row.media_path : null;
    } catch (err) {
      logger.error('Failed to get media path', { id, error: err.message });
      throw err;
    }
  }

  delete(id) {
    try {
      this.db.prepare(`
        DELETE FROM quizzes WHERE id = ?
      `).run(id);
      
      logger.info('Quiz deleted from repository', { id });
    } catch (err) {
      logger.error('Failed to delete quiz', { id, error: err.message });
      throw err;
    }
  }
}

module.exports = QuizRepository;
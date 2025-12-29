const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Constants = require('../config/constants');
const logger = require('../utils/logger');
const { 
  ValidationError, 
  InvalidInputError,
  QuizNotFoundError,
  QuizAlreadyExistsError,
  QuizValidationError
} = require('../errors');

class QuizService {
  constructor(quizRepository, sessionRepository = null, submissionRepository = null, txManager = null) {
    this.quizRepo = quizRepository;
    this.sessionRepo = sessionRepository;
    this.submissionRepo = submissionRepository;
    this.txManager = txManager;
  }
  
  createQuiz(title, imagePath, language = 'de') {
    logger.debug('Creating quiz', { title, imagePath, language });

    // Validation happens in QuizRepository

    // Check for duplicate
    if (this.quizRepo.existsByTitle(title.trim())) {
      logger.warn('Quiz creation failed - duplicate title', { title: title.trim() });
      throw new QuizAlreadyExistsError(title.trim());
    }

    // Validate language
    const supportedLanguages = ['en', 'de', 'es'];
    const validLanguage = supportedLanguages.includes(language) ? language : 'de';
    if (validLanguage !== language) {
      logger.warn('Invalid language provided, defaulting to "de"', { provided: language, using: validLanguage });
    }

    try {
      const id = uuidv4();
      const filename = `${imagePath.trim()}.json`;
      const emptyQuiz = {
        title,
        imagePath,
        language: validLanguage,
        questions: []
      };
      const createdAt = new Date().toISOString();

      // Repository validates title and imagePath automatically
      this.quizRepo.create(
        id,
        title,
        filename,
        imagePath,
        JSON.stringify(emptyQuiz),
        createdAt
      );

      this.ensureMediaDirectory(imagePath.trim());

      logger.info('Quiz created successfully', {
        quizId: id,
        title,
        imagePath,
        language: validLanguage
      });

      return { quizId: id, title, imagePath, language: validLanguage };
    } catch (err) {
      logger.error('Quiz creation failed', { error: err.message, title, imagePath });
      throw err;
    }
  }
  
  saveQuiz(quiz, quizId = null) {
    logger.debug('Saving quiz', { quizId, hasQuestions: quiz?.questions?.length });
    
    if (!quiz || !quiz.questions) {
      throw new ValidationError('Invalid quiz structure - questions missing');
    }
    
    // Set defaults and let repository validate
    const validatedTitle = quiz.title || 'Untitled';
    const validatedImagePath = quiz.imagePath || quizId || uuidv4();
    
    try {
      const isNew = !quizId;
      const id = quizId || uuidv4();
      const mediaPath = validatedImagePath;
      const filename = `${mediaPath}.json`;
      
      // Update quiz object with values (Repository validates on create/update)
      quiz.title = validatedTitle;
      quiz.imagePath = validatedImagePath;
      
      this.ensureMediaDirectory(mediaPath);
      
      if (isNew) {
        const createdAt = new Date().toISOString();
        this.quizRepo.create(
          id, 
          validatedTitle, 
          filename, 
          mediaPath, 
          JSON.stringify(quiz), 
          createdAt
        );
        logger.info('New quiz saved', { quizId: id, title: validatedTitle });
      } else {
        this.quizRepo.update(
          id,
          validatedTitle,
          mediaPath,
          JSON.stringify(quiz)
        );
        logger.info('Quiz updated', { quizId: id, title: validatedTitle });

        // Clear translation cache when quiz is updated
        this.clearTranslationCache(id);
      }

      return { quizId: id, mediaPath };
    } catch (err) {
      logger.error('Quiz save failed', { error: err.message, quizId });
      throw err;
    }
  }
  
  uploadQuiz(quiz) {
    logger.debug('Uploading quiz', { title: quiz?.title });
    
    if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
      throw new ValidationError(
        'Invalid quiz format - expected {title, questions:[...]}'
      );
    }
    
    // Set defaults and let repository validate
    const validatedTitle = quiz.title || 'Untitled';
    const validatedImagePath = quiz.imagePath || uuidv4();
    
    try {
      const id = uuidv4();
      const filename = `${id}.json`;
      const mediaPath = validatedImagePath;
      
      this.ensureMediaDirectory(mediaPath);
      
      const createdAt = new Date().toISOString();
      // Repository validates automatically on create
      this.quizRepo.create(
        id, 
        validatedTitle, 
        filename, 
        mediaPath, 
        null, 
        createdAt
      );
      
      logger.info('Quiz uploaded', { quizId: id, title: validatedTitle });
      
      return { quizId: id, mediaPath };
    } catch (err) {
      logger.error('Quiz upload failed', { error: err.message });
      throw err;
    }
  }
  
  loadQuiz(quizId) {
    logger.debug('Loading quiz', { quizId });
    
    const quizJson = this.quizRepo.getQuizJson(quizId);
    
    if (!quizJson) {
      logger.warn('Quiz not found', { quizId });
      throw new QuizNotFoundError(quizId);
    }
    
    try {
      const quiz = JSON.parse(quizJson);
      logger.debug('Quiz loaded successfully', { quizId, title: quiz.title });
      return quiz;
    } catch (err) {
      logger.error('Quiz JSON parse error', { quizId, error: err.message });
      throw new ValidationError('Quiz data is corrupted');
    }
  }
  
  getQuizMetadata(quizId) {
    logger.debug('Getting quiz metadata', { quizId });
    
    const metadata = this.quizRepo.findById(quizId);
    
    if (!metadata) {
      throw new QuizNotFoundError(quizId);
    }
    
    return metadata;
  }
  
  getAllQuizzes() {
    logger.debug('Getting all quizzes');
    
    try {
      const quizzes = this.quizRepo.findAll();
      logger.debug('Quizzes retrieved', { count: quizzes.length });
      return quizzes;
    } catch (err) {
      logger.error('Failed to retrieve quizzes', { error: err.message });
      throw err;
    }
  }
  
  getStrippedQuiz(quizId) {
    const quiz = this.loadQuiz(quizId);
    
    return {
      id: quizId,
      title: quiz.title,
      questions: quiz.questions.map(q => {
        // Extract correct answer IDs - supports both formats
        let correctAnswers = [];

        // NEW FORMAT: options[].correct = true/false
        if (q.options && Array.isArray(q.options)) {
          correctAnswers = q.options
            .filter(option => typeof option === 'object' && option.correct === true)
            .map(option => option.id);
        }
        // OLD FORMAT fallback: q.correct array
        if (correctAnswers.length === 0 && q.correct) {
          correctAnswers = Array.isArray(q.correct) ? q.correct : [q.correct];
        }

        const isMultiple = (correctAnswers.length > 1) || !!q.multiple;
        
        return {
          id: q.id,
          keyword: q.keyword || (q.text.length > 30 ? q.text.slice(0, 30) + '...' : q.text),
          text: q.text,
          image: q.image,
          reason: q.reason,
          reasonImage: q.reasonImage,
          options: q.options,
          points: q.points || 1,
          multiple: isMultiple
        };
      })
    };
  }
  
  getMediaPath(quizId) {
    const path = this.quizRepo.getMediaPath(quizId);
    
    if (!path) {
      throw new QuizNotFoundError(quizId);
    }
    
    return path;
  }
  
  ensureMediaDirectory(mediaPath) {
    try {
      const mediaDir = path.join(Constants.QUIZ_DIR, mediaPath);
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
        logger.debug('Media directory created', { mediaPath });
      }
      
      return mediaDir;
    } catch (err) {
      logger.error('Failed to create media directory', { 
        mediaPath, 
        error: err.message 
      });
      throw new ValidationError('Failed to create media directory');
    }
  }
  
  validateQuiz(quiz) {
    logger.debug('Validating quiz', { title: quiz?.title });
    
    const errors = [];
    
    if (!quiz.title) {
      errors.push('Quiz must have a title');
    }

    if (!Array.isArray(quiz.questions)) {
      errors.push('Quiz must have a questions array');
    }
    
    if (quiz.questions && quiz.questions.length === 0) {
      errors.push('Quiz must have at least one question');
    }

    quiz.questions?.forEach((q, index) => {
      if (!q.id) errors.push(`Question ${index + 1}: ID missing`);
      if (!q.text) errors.push(`Question ${index + 1}: Text missing`);
      if (!Array.isArray(q.options) || q.options.length === 0) {
        errors.push(`Question ${index + 1}: Answer options missing`);
      }
    });
    
    const isValid = errors.length === 0;
    
    if (!isValid) {
      logger.warn('Quiz validation failed', { errors });
      throw new QuizValidationError(errors);
    }
    
    logger.debug('Quiz validation passed');
    return { valid: true, errors: [] };
  }

  /**
   * Clear translation cache for a quiz (called on quiz update)
   * @param {string} quizId - Quiz ID
   */
  clearTranslationCache(quizId) {
    try {
      const TranslationService = require('./TranslationService');
      const translationService = new TranslationService();
      translationService.clearCache(quizId);
    } catch (error) {
      logger.warn('Failed to clear translation cache', { quizId, error: error.message });
    }
  }

  /**
   * Delete quiz with cascade delete of all related sessions and submissions
   * Returns the quiz JSON for backup before deletion
   * @param {string} quizId - Quiz ID to delete
   * @returns {object} Quiz JSON and deletion stats
   */
  deleteQuiz(quizId) {
    logger.info('Deleting quiz with cascade', { quizId });
    
    if (!this.sessionRepo || !this.submissionRepo) {
      throw new Error('QuizService requires SessionRepository and SubmissionRepository for delete operation');
    }
    
    // Load quiz JSON for backup (before deletion)
    const quiz = this.loadQuiz(quizId);
    if (!quiz) {
      throw new QuizNotFoundError(quizId);
    }
    
    const deleteOperation = () => {
      // Step 1: Find all session IDs for this quiz
      const sessionIds = this.sessionRepo.findSessionIdsByQuizId(quizId);
      logger.debug('Found sessions to delete', { quizId, sessionIds, count: sessionIds.length });
      
      // Step 2: Delete all submissions for these sessions
      let submissionsDeleted = 0;
      if (sessionIds.length > 0) {
        submissionsDeleted = this.submissionRepo.deleteBySessionIds(sessionIds);
      }
      logger.debug('Submissions deleted', { count: submissionsDeleted });
      
      // Step 3: Delete all sessions for this quiz
      const sessionsDeleted = this.sessionRepo.deleteByQuizId(quizId);
      logger.debug('Sessions deleted', { count: sessionsDeleted });
      
      // Step 4: Delete the quiz itself
      this.quizRepo.delete(quizId);
      logger.info('Quiz deleted', { quizId });
      
      return {
        quizId,
        quizTitle: quiz.title,
        quizJson: quiz,
        deletionStats: {
          sessions: sessionsDeleted,
          submissions: submissionsDeleted
        }
      };
    };
    
    // Execute in transaction if available
    if (this.txManager) {
      return this.txManager.transaction(deleteOperation, 'DeleteQuizCascade');
    } else {
      return deleteOperation();
    }
  }
}

module.exports = QuizService;
/**
 * QuizValidationService
 * Validates quiz content (questions, options) using validation rules from QuizRepository
 */

const logger = require('../utils/logger');

class QuizValidationService {
  /**
   * @param {ObjectValidator} validator - Global validator instance (shared across app)
   */
  constructor(validator) {
    if (!validator) {
      throw new Error('QuizValidationService requires a validator instance');
    }
    
    this.validator = validator;
    
    // Rules are registered by QuizRepository during its initialization
    // Here we just check if they're available
    const requiredRules = ['Quiz', 'QuizContent', 'Question', 'Option'];
    const missingRules = requiredRules.filter(type => !validator.hasRules(type));
    
    if (missingRules.length > 0) {
      logger.warn('QuizValidationService: Some rules not yet registered', { 
        missing: missingRules 
      });
    }
    
    logger.info('QuizValidationService initialized');
  }
  
  /**
   * Validates entire quiz structure
   * @param {object} quizData - Quiz JSON object
   * @throws {ValidationError} if validation fails
   */
  validateQuiz(quizData) {
    try {
      // Validate quiz metadata
      this.validator.validate('Quiz', quizData);
      
      // Validate each question
      if (!quizData.questions || quizData.questions.length === 0) {
        throw new Error('Quiz must have at least one question');
      }
      
      quizData.questions.forEach((question, idx) => {
        this.validateQuestion(question, idx);
      });
      
      logger.debug('Quiz validation passed', { 
        quizId: quizData.id, 
        questionCount: quizData.questions.length 
      });
      
    } catch (err) {
      logger.warn('Quiz validation failed', { 
        quizId: quizData.id, 
        error: err.message 
      });
      throw err;
    }
  }
  
  /**
   * Validates single question
   * @param {object} question - Question object
   * @param {number} index - Question index (for error messages)
   * @throws {ValidationError}
   */
  validateQuestion(question, index = 0) {
    try {
      // Validate question structure
      this.validator.validate('Question', question);
      
      // Check for at least one correct answer
      let hasCorrect = false;
      
      question.options.forEach((option, optIdx) => {
        this.validateOption(option, index, optIdx);
        
        // Track if we found a correct answer
        if (typeof option === 'object' && option.correct) {
          hasCorrect = true;
        }
      });
      
      if (!hasCorrect) {
        throw new Error('Question must have at least one correct answer');
      }
      
    } catch (err) {
      throw new Error(`Question ${index + 1}: ${err.message}`);
    }
  }
  
  /**
   * Validates single option
   * @param {object|string} option - Option object or string (legacy)
   * @param {number} questionIdx - Question index
   * @param {number} optionIdx - Option index
   * @throws {ValidationError}
   */
  validateOption(option, questionIdx, optionIdx) {
    try {
      // Handle legacy string format (backwards compatible)
      if (typeof option === 'string') {
        if (option.trim().length === 0) {
          throw new Error('Option text cannot be empty');
        }
        return; // Legacy format is valid
      }
      
      // Validate option object
      this.validator.validate('Option', option);
      
    } catch (err) {
      throw new Error(`Question ${questionIdx + 1}, Option ${optionIdx + 1}: ${err.message}`);
    }
  }
}

module.exports = QuizValidationService;
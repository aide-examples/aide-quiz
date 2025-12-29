/**
 * Grading Validation
 * Validation for quiz submissions and answers
 */

const { InvalidInputError } = require('../errors');

class GradingValidation {
  /**
   * Validate answer array structure
   * @param {Array} answers - Answer submissions
   * @throws {InvalidInputError} If invalid
   * @returns {Array} - Validated answers
   */
  static validateAnswers(answers) {
    if (!Array.isArray(answers)) {
      throw new InvalidInputError('answers', 'answers must be an array');
    }
    
    if (answers.length === 0) {
      throw new InvalidInputError('answers', 'answers array cannot be empty');
    }
    
    if (answers.length > 1000) {
      throw new InvalidInputError('answers', 'too many answers (max 1000)');
    }
    
    // Validate each answer
    answers.forEach((answer, idx) => {
      if (!answer || typeof answer !== 'object') {
        throw new InvalidInputError('answers', `answer at index ${idx} must be an object`);
      }
      
      if (!answer.questionId || typeof answer.questionId !== 'string') {
        throw new InvalidInputError('answers', `answer at index ${idx} missing questionId`);
      }
      
      if (answer.questionId.length > 100) {
        throw new InvalidInputError('answers', `questionId at index ${idx} too long`);
      }
      
      // chosen can be string or array
      if (answer.chosen !== undefined) {
        if (typeof answer.chosen === 'string') {
          if (answer.chosen.length > 10) {
            throw new InvalidInputError('answers', `chosen at index ${idx} too long`);
          }
        } else if (Array.isArray(answer.chosen)) {
          if (answer.chosen.length > 50) {
            throw new InvalidInputError('answers', `too many options at index ${idx}`);
          }
          answer.chosen.forEach(option => {
            if (typeof option !== 'string' || option.length > 10) {
              throw new InvalidInputError('answers', `invalid option at index ${idx}`);
            }
          });
        } else {
          throw new InvalidInputError('answers', `chosen at index ${idx} must be string or array`);
        }
      }
    });
    
    return answers;
  }
}

module.exports = GradingValidation;
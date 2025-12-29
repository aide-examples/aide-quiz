/**
 * NotFoundError - For resources that don't exist (HTTP 404)
 */
const AppError = require('./AppError');

class NotFoundError extends AppError {
  /**
   * @param {string} resource - Type of resource not found
   * @param {string} identifier - Resource identifier
   */
  constructor(resource, identifier = null) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;

    super(message, 404, 'NotFoundError');
    this.resource = resource;
    this.identifier = identifier;
  }
}

/**
 * Specific resource not found errors
 */
class QuizNotFoundError extends NotFoundError {
  constructor(quizId) {
    super('Quiz', quizId);
  }
}

class SessionNotFoundError extends NotFoundError {
  constructor(sessionName) {
    super('Session', sessionName);
  }
}

class SubmissionNotFoundError extends NotFoundError {
  constructor(submissionId) {
    super('Submission', submissionId);
  }
}

class MediaNotFoundError extends NotFoundError {
  constructor(filename) {
    super('Media file', filename);
  }
}

module.exports = { 
  NotFoundError, 
  QuizNotFoundError, 
  SessionNotFoundError, 
  SubmissionNotFoundError,
  MediaNotFoundError
};

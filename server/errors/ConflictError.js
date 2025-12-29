/**
 * ConflictError - For resource conflicts (HTTP 409)
 */
const AppError = require('./AppError');

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'ConflictError');
  }
}

class DuplicateSubmissionError extends ConflictError {
  constructor(userCode, sessionName) {
    super(`You have already participated in this quiz (${sessionName})`);
    this.userCode = userCode;
    this.sessionName = sessionName;
  }
}

class QuizAlreadyExistsError extends ConflictError {
  constructor(title) {
    super(`A quiz with the title '${title}' already exists`);
    this.title = title;
  }
}

module.exports = { ConflictError, DuplicateSubmissionError, QuizAlreadyExistsError };

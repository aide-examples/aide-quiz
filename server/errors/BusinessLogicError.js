/**
 * BusinessLogicError - For business rule violations (HTTP 422)
 */
const AppError = require('./AppError');

class BusinessLogicError extends AppError {
  constructor(message, details = null) {
    super(message, 422, 'BusinessLogicError', details);
  }
}

class SessionNotOpenError extends BusinessLogicError {
  constructor(reason = 'Session is not open') {
    super(reason);
  }
}

class SessionClosedError extends SessionNotOpenError {
  constructor() {
    super('Session is already closed');
  }
}

class SessionNotYetOpenError extends SessionNotOpenError {
  constructor() {
    super('Session is not yet open');
  }
}

class QuizValidationError extends BusinessLogicError {
  constructor(errors) {
    super('Quiz validation failed', errors);
  }
}

module.exports = { 
  BusinessLogicError, 
  SessionNotOpenError,
  SessionClosedError, 
  SessionNotYetOpenError,
  QuizValidationError 
};

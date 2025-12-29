/**
 * Central export for all error classes
 */
const AppError = require('./AppError');
const { ValidationError, InvalidInputError, SchemaValidationError } = require('./ValidationError');
const { NotFoundError, QuizNotFoundError, SessionNotFoundError, SubmissionNotFoundError, MediaNotFoundError } = require('./NotFoundError');
const { AuthenticationError, InvalidCredentialsError, TokenExpiredError } = require('./AuthenticationError');
const { ConflictError, DuplicateSubmissionError, QuizAlreadyExistsError } = require('./ConflictError');
const { BusinessLogicError, SessionNotOpenError, SessionClosedError, SessionNotYetOpenError, QuizValidationError } = require('./BusinessLogicError');

module.exports = {
  // Base
  AppError,
  
  // Validation (400)
  ValidationError,
  InvalidInputError,
  SchemaValidationError,
  
  // Not Found (404)
  NotFoundError,
  QuizNotFoundError,
  SessionNotFoundError,
  SubmissionNotFoundError,
  MediaNotFoundError,
  
  // Authentication (401)
  AuthenticationError,
  InvalidCredentialsError,
  TokenExpiredError,
  
  // Conflict (409)
  ConflictError,
  DuplicateSubmissionError,
  QuizAlreadyExistsError,
  
  // Business Logic (422)
  BusinessLogicError,
  SessionNotOpenError,
  SessionClosedError,
  SessionNotYetOpenError,
  QuizValidationError
};

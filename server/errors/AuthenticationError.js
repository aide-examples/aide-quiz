/**
 * AuthenticationError - For authentication failures (HTTP 401)
 */
const AppError = require('./AppError');

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AuthenticationError');
  }
}

class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid credentials');
  }
}

class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Session expired. Please log in again.');
  }
}

module.exports = { AuthenticationError, InvalidCredentialsError, TokenExpiredError };

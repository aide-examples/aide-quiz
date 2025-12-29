# Testing

> **Current State:** No test framework installed yet. This document provides the setup guide.

## Recommended Setup

### Install Jest

```bash
cd server
npm install --save-dev jest
```

### Add Script

In `server/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Create Config

`server/jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'repositories/**/*.js',
    'middleware/**/*.js'
  ]
};
```

## What to Test

| Layer | Priority | Example |
|-------|----------|---------|
| **Services** | High | QuizService, GradingService, SessionService |
| **Repositories** | High | CRUD operations, validation |
| **Middleware** | Medium | errorHandler, correlationId |
| **Validators** | High | ObjectValidator rules |

## Test Examples

### Service Test

```javascript
// services/QuizService.test.js
const QuizService = require('./QuizService');

describe('QuizService', () => {
  let quizService;
  let mockQuizRepo;

  beforeEach(() => {
    mockQuizRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      existsByTitle: jest.fn()
    };
    quizService = new QuizService(mockQuizRepo);
  });

  test('createQuiz throws if title exists', async () => {
    mockQuizRepo.existsByTitle.mockReturnValue(true);

    await expect(quizService.createQuiz('Existing'))
      .rejects.toThrow('Quiz already exists');
  });
});
```

### Repository Test

```javascript
// repositories/QuizRepository.test.js
const QuizRepository = require('./QuizRepository');
const Database = require('better-sqlite3');

describe('QuizRepository', () => {
  let db;
  let quizRepo;

  beforeEach(() => {
    db = new Database(':memory:');
    // Create tables...
    quizRepo = new QuizRepository(db);
  });

  afterEach(() => db.close());

  test('create stores quiz', () => {
    const quiz = quizRepo.create('test-id', 'My Quiz', 'path');
    expect(quiz.title).toBe('My Quiz');
  });
});
```

### Validator Test

```javascript
// shared/validation/ObjectValidator.test.js
const ObjectValidator = require('./ObjectValidator');

describe('ObjectValidator', () => {
  test('validates required fields', () => {
    const validator = new ObjectValidator();
    validator.registerRules('Test', {
      name: { type: 'string', required: true }
    });

    expect(() => validator.validate('Test', {}))
      .toThrow('name is required');
  });
});
```

## Coverage Goals

| Component | Target |
|-----------|--------|
| Services | 80% |
| Repositories | 70% |
| Validators | 90% |

## Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

---

*See [ERROR_HANDLING](ERROR_HANDLING.md) for testing error scenarios*

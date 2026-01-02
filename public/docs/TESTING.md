# Testing

## Current State

- **E2E API Test**: Implemented and integrated into pre-commit hook
- **Unit Tests**: Not yet implemented (Jest setup documented below)

## E2E API Test

The E2E test (`server/tests/e2e-quiz-workflow.js`) tests the complete quiz workflow:

1. Login as teacher
2. Create quiz with 2 questions (single + multiple choice)
3. Create session
4. Simulate 4 participants with different answers
5. Verify statistics
6. Fetch result for one participant
7. Cleanup (optional)

### Running the E2E Test

```bash
cd server

# Run with cleanup (default)
npm run test:e2e

# Keep test data in DB for inspection
node tests/e2e-quiz-workflow.js --keep
```

### Pre-commit Integration

The E2E test runs automatically on commit when server files are changed:
- Requires server running on `localhost:37373`
- Skipped if server is not running (with warning)
- Commit is blocked if test fails

### Limitations

- **DeepL Translation**: Not tested (requires API key)
- **File Uploads**: Not covered
- **Error scenarios**: Limited coverage

## Unit Tests (Planned)

> **Status:** Jest not yet installed. Unit tests would complement E2E tests for isolated component testing.

### Recommended Setup

```bash
cd server
npm install --save-dev jest
```

Add to `server/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Create `server/jest.config.js`:
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

### What to Test

| Layer | Priority | Example |
|-------|----------|---------|
| **Services** | High | QuizService, GradingService, SessionService |
| **Repositories** | High | CRUD operations, validation |
| **Middleware** | Medium | errorHandler, correlationId |
| **Validators** | High | ObjectValidator rules |

### Test Examples

#### Service Test

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

#### Repository Test

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

### Coverage Goals

| Component | Target |
|-----------|--------|
| Services | 80% |
| Repositories | 70% |
| Validators | 90% |

---

*See [ERROR_HANDLING](ERROR_HANDLING.md) for testing error scenarios*

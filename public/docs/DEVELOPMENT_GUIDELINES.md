# Development Guidelines

Principles, conventions, and rules for working on the Quiz App.

> **For implementation details**, see the specialized documents linked in each section.

---

## Architecture Principles

### Layered Architecture

```
┌─────────────────┐
│    Routers      │  → HTTP handling only
├─────────────────┤
│    Services     │  → Business logic
├─────────────────┤
│  Repositories   │  → Data access
├─────────────────┤
│   Database      │  → SQLite
└─────────────────┘
```

**Rules:**

| Rule | Violation Example |
|------|-------------------|
| Routers call only Services | `router.get(() => db.query(...))` |
| Services call only Repositories | `service.save(() => db.prepare(...))` |
| No business logic in Repositories | `repo.create() { if (title.length > 10)... }` |
| No SQL in Services | `service.find() { db.prepare('SELECT...')` |
| No HTTP concepts in Services | `service.create(req, res)` |

**Details:** [FUNCTIONS.md](FUNCTIONS.md)

### Dependency Injection

All dependencies are injected via constructor:

```javascript
// Good: Dependencies injected
class QuizService {
  constructor(quizRepo, sessionRepo, txManager) {
    this.quizRepo = quizRepo;
    this.sessionRepo = sessionRepo;
    this.txManager = txManager;
  }
}

// Bad: Dependencies created internally
class QuizService {
  constructor() {
    this.quizRepo = new QuizRepository(db);  // Hard to test!
  }
}
```

**Composition Root:** `server/app.js` - all wiring happens here, nowhere else.

### Tooling as Part of the Process

A professional development workflow includes tools for:
- Generating documentation from code (API docs from JSDoc)
- Validating consistency (docs indexed for search)
- Measuring quality (codebase metrics, coverage)

**Principle:** Having such tools is not enough. They must be integrated into the development workflow so they run automatically at the right moments.

| Tool | Integration | Trigger |
|------|-------------|---------|
| `docs:api` | Pre-commit hook | Router file changed |
| `validate` | Pre-commit hook | Every commit |
| `metrics` | Manual / CI | Major refactoring |

**Details:** [TOOLS.md](TOOLS.md)

---

## Code Conventions

### Naming

```javascript
// Classes: PascalCase
class QuizService { }
class QuizRepository { }

// Files: PascalCase (match class name)
QuizService.js
QuizRepository.js

// Functions/Methods: camelCase
createQuiz()
getActiveSession()

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Private methods: _prefixed
_validateQuizData()
_parseOptions()
```

### File Organization

```
server/                             ── Backend ──────────────────────────
├── app.js                          Entry point, DI composition root
├── config/
│   ├── constants.js                App-wide constants, limits, secrets
│   └── database.js                 SQLite schema & initialization
├── middleware/
│   ├── correlationId.js            Request tracing (UUID per request)
│   ├── requestLogger.js            HTTP request/response logging
│   └── errorHandler.js             Central error → JSON response
├── routers/                        One router per domain
│   ├── AuthRouter.js               /api/teacher/login, logout, status
│   ├── QuizRouter.js               /api/teacher/quiz, media upload
│   ├── SessionRouter.js            /api/session, submit, stats
│   ├── ResultRouter.js             /api/result/:linkId
│   └── ...
├── services/                       One service per domain
│   ├── AuthService.js              Password verification, sessions
│   ├── QuizService.js              Quiz CRUD, validation
│   ├── SessionService.js           Session lifecycle
│   ├── GradingService.js           Answer evaluation, scoring
│   ├── MediaService.js             File upload, sanitization
│   └── ...
├── repositories/                   One repository per entity
│   ├── QuizRepository.js           Quiz table operations
│   ├── SessionRepository.js        Session table operations
│   └── SubmissionRepository.js     Submission table operations
├── errors/                         Custom error classes
│   ├── AppError.js                 Base class (statusCode, type)
│   ├── NotFoundError.js            404 errors
│   ├── ValidationError.js          400 errors
│   └── ...
└── utils/
    ├── logger.js                   Winston configuration
    └── TransactionManager.js       DB transaction wrapper

shared/                             ── Client & Server ──────────────────
└── validation/
    ├── ObjectValidator.js          Validation engine (rules, patterns)
    └── ValidationError.js          Validation error class

public/                             ── Frontend ─────────────────────────
├── index.html                      Landing page
├── common/                         Shared across all pages
│   ├── ApiHelpers.js               Fetch wrapper, error handling
│   ├── AppHeader.js                Header component
│   ├── i18n.js                     Polyglot.js integration
│   ├── base.css                    Typography, colors, reset
│   ├── forms.css                   Form elements
│   └── utilities.css               Utility classes
├── editor/                         Quiz Editor (teacher)
│   ├── js/
│   │   ├── QuizEditor.js           Main editor logic
│   │   ├── QuestionEditor.js       Question type handling
│   │   ├── SessionManager.js       Session creation UI
│   │   └── MediaManager.js         Image/video upload
│   └── css/
├── quiz/                           Quiz Interface (student)
│   ├── js/
│   │   └── QuizPage.js             Quiz participation controller
│   └── css/
│       └── quiz.css
├── stats/                          Statistics Dashboard
│   ├── js/
│   │   └── StatsPage.js            Statistics controller
│   └── css/
│       └── stats.css
├── result/                         Result Display
│   ├── js/
│   │   └── ResultPage.js           Result display controller
│   └── css/
│       └── result.css
├── help/                           Help System
│   ├── HelpModal.js                User help (README.md)
│   └── TechDocsModal.js            Tech docs viewer
├── locales/                        Translations
│   ├── de.json
│   ├── en.json
│   └── es.json
├── vendor/                         External libraries (local)
│   ├── marked/                     Markdown rendering
│   ├── mermaid/                    UML diagrams
│   ├── polyglot/                   i18n
│   └── codemirror/                 Code editor
└── docs/                           Technical documentation

quizzes/                            ── Data ─────────────────────────────
└── {Quiz_Title}/                   One folder per quiz
    ├── quiz.json                   Quiz definition (in DB as BLOB)
    └── *.png, *.jpg, *.mp4         Media files
```

### Module Exports

**Server (CommonJS):**
```javascript
// Single class: default export
class QuizService { }
module.exports = QuizService;

// Multiple exports: named
module.exports = {
  correlationId,
  requestLogger,
  errorHandler
};
```

**Client (ES Modules):**
```javascript
// Named exports (preferred)
export class QuizPage { }
export function fetchWithErrorHandling() { }

// Import
import { QuizPage } from './QuizPage.js';
import { i18n, appReady } from '../../common/i18n.js';
```

### File Preamble Standard

All JavaScript files should start with a descriptive preamble:

```javascript
/**
 * FileName.js - Short description (one line)
 *
 * Longer description if needed for complex modules.
 */

import { x } from './other.js';

export class ClassName {
```

**Rules:**
- First line: `FileName.js - Short description`
- Dependencies are visible in imports - no need to list them in comments
- Entry-point classes initialize via `appReady.then(() => new PageClass().init())`

---

## Best Practices

### KISS - Keep It Simple

- Solve the problem at hand, not hypothetical future problems
- Prefer readable code over clever code
- One function = one responsibility

### DRY - Don't Repeat Yourself

- Extract shared logic into utilities or base classes
- But: Prefer duplication over wrong abstraction
- Rule of three: Abstract after third occurrence

### YAGNI - You Ain't Gonna Need It

- Don't add features "just in case"
- Don't add configuration options nobody asked for
- Don't add abstraction layers for single implementations

### Error Handling

```javascript
// Throw specific errors in Services
if (!quiz) {
  throw new QuizNotFoundError(quizId);
}

// Let errors bubble up through Routers
router.get('/quiz/:id', async (req, res, next) => {
  try {
    const quiz = await quizService.getQuiz(req.params.id);
    res.json(quiz);
  } catch (err) {
    next(err);  // → Central error handler
  }
});
```

**Details:** [ERROR_HANDLING.md](ERROR_HANDLING.md)

### Validation

- Always validate server-side (even if client validates)
- Use `ObjectValidator` for consistent validation
- Fail fast: Validate at entry points (Routers, Repositories)

**Details:** See `shared/validation/ObjectValidator.js`

### Database Access

```javascript
// Always use prepared statements
const stmt = this.db.prepare('SELECT * FROM quizzes WHERE id = ?');
const quiz = stmt.get(id);

// Never concatenate user input into SQL
const quiz = this.db.prepare(`SELECT * FROM quizzes WHERE id = '${id}'`);  // WRONG!
```

**Details:** [DATA.md](DATA.md)

### Logging

- Always include `correlationId` for request tracing
- Use appropriate log levels: error > warn > info > debug
- Log actions, not data dumps

**Details:** [LOGGING.md](LOGGING.md)

### API Responses

Always return explicit status information. The client should never have to guess whether an operation succeeded.

```javascript
// Bad: Client must inspect content to know if translation happened
return quiz;  // Did it translate? Client doesn't know!

// Good: Explicit status
return {
  success: true,
  translated: true,
  quiz: translatedQuiz
};

// Good: Explicit failure reason
return {
  success: false,
  reason: 'API key not configured',
  fallback: originalQuiz
};
```

**Rule:** When a component cannot fulfill its task, it must communicate this explicitly via status flags and reason codes.

### Frontend: Events Over Polling

Prefer event handlers over polling when monitoring user actions.

```javascript
// Good: Event-based
element.addEventListener('change', (e) => {
  handleLanguageChange(e.target.value);
});

// Bad: Polling
setInterval(() => {
  if (getCurrentValue() !== lastValue) {
    handleChange();
  }
}, 500);
```

**When polling is acceptable:**
- External resources not under our control
- Hardware/sensor monitoring without event APIs
- Graceful degradation fallback

---

## Git Hooks

Pre-commit hooks ensure code quality before commits reach the repository.

### Setup

```bash
git config core.hooksPath .githooks
```

### What Runs

| Hook | Script | Checks |
|------|--------|--------|
| `pre-commit` | `validate-docs-list.js` | All docs in search index |

### Manual Validation

```bash
cd server
npm run validate
```

---

## Code Review Checklist

Before merging, verify:

- [ ] No SQL string concatenation (prepared statements only)
- [ ] All user inputs validated
- [ ] Custom error classes used (not generic Error)
- [ ] Logs include correlationId
- [ ] No business logic in Routers
- [ ] No SQL statements in Services
- [ ] Dependencies injected via constructor
- [ ] Naming conventions followed
- [ ] No commented-out code

---

## Related Documentation

| Topic | Document |
|-------|----------|
| Data Model & Storage | [DATA.md](DATA.md) |
| Layered Architecture | [FUNCTIONS.md](FUNCTIONS.md) |
| Error Classes & Handler | [ERROR_HANDLING.md](ERROR_HANDLING.md) |
| Winston & Correlation IDs | [LOGGING.md](LOGGING.md) |
| Security Measures | [SECURITY.md](SECURITY.md) |
| Test Setup | [TESTING.md](TESTING.md) |
| Production Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |

---

*Last updated: 2025-12-27*

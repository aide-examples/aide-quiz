# Functional Architecture

The system follows a **layered architecture** with dependency injection.

## Layer Overview

```
┌──────────────────────────────────────────────────────────┐
│                        C L I E N T                       │
├──────────────────────────────────────────────────────────┤
│  Pages           QuizPage │ StatsPage │ ResultPage │ ... │
│                                                          │
│  Common          ApiHelpers │ i18n │ QuizHelpers │ ...   │
│                                                          │
│  Help            HelpModal │ TechDocsModal │ DocSearch   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ HTTP/JSON (REST API)
                             │
┌────────────────────────────▼─────────────────────────────┐
│                        S E R V E R                       │
├──────────────────────────────────────────────────────────┤
│  Routers         Auth │ Quiz │ Session │ Result │ Sync   │
│                                                          │
│  Services        Quiz │ Session │ Grading │ Media │ ...  │
│                                                          │
│  Repositories    QuizRepo │ SessionRepo │ SubmissionRepo │
│                                                          │
│  Database                  SQLite (better-sqlite3)       │
└──────────────────────────────────────────────────────────┘
```

---

## Client-Side Architecture

### Page Controllers (`public/*/js/`)

Each page has a dedicated controller class using ES Modules:

| Controller | Location | Purpose |
|------------|----------|---------|
| QuizPage | `quiz/js/QuizPage.js` | Quiz participation, answer submission |
| StatsPage | `stats/js/StatsPage.js` | Statistics display, charts |
| ResultPage | `result/js/ResultPage.js` | Result display with translation |
| EditorPage | `editor/js/EditorPage.js` | Quiz editing (orchestrates submodules) |

**Initialization pattern:**
```javascript
import { appReady } from '../../common/i18n.js';
appReady.then(() => new QuizPage().init());
```

### Common Modules (`public/common/`)

| Module | Exports | Purpose |
|--------|---------|---------|
| ApiHelpers.js | `fetchWithErrorHandling`, `toast`, `log` | API calls, error display, logging |
| i18n.js | `i18n`, `appReady` | Internationalization (Polyglot.js) |
| QuizHelpers.js | `QuizUtils` | Markdown prep, image URLs |
| ImageRendering.js | `renderQuestionWithImages`, ... | Image/media rendering |
| ValidationClient.js | `validationClient` | Client-side validation |
| AppHeader.js | (auto-init) | Shared header with language selector |

### Help System (`public/help/`)

| Module | Purpose |
|--------|---------|
| HelpModal.js | User help modal (README.md per page) |
| TechDocsModal.js | Technical documentation browser |
| DocSearch.js | Fuzzy search with Fuse.js |

---

## Server-Side Architecture

### Routers (`server/routers/`)

| Router | Endpoints | Purpose |
|--------|-----------|---------|
| AuthRouter | `/api/teacher/login`, `/logout`, `/status` | Teacher authentication |
| QuizRouter | `/api/teacher/quiz`, `/quizzes`, `/media` | Quiz CRUD + media upload |
| SessionRouter | `/api/teacher/session`, `/sessions`, `/submit` | Session lifecycle + submissions |
| ResultRouter | `/api/result/:linkId` | Public result display |
| SyncRouter | `/api/sync` | Filesystem ↔ DB sync |
| TranslationRouter | `/api/translate` | DeepL translation |

### Services (`server/services/`)

| Service | Dependencies | Purpose |
|---------|--------------|---------|
| AuthService | - | Password verification, session management |
| QuizService | QuizRepo, SessionRepo, SubmissionRepo, TxManager | Quiz CRUD, question management |
| SessionService | SessionRepo, QuizService | Session lifecycle |
| GradingService | SubmissionRepo, QuizService, SessionService | Answer evaluation, scoring |
| MediaService | QuizService | File upload, validation, storage |
| ExportService | SubmissionRepo, SessionService, QuizService | CSV export |
| SyncService | QuizRepo | Sync JSON files with database |
| TranslationService | - | DeepL API integration |

### Repositories (`server/repositories/`)

| Repository | Table | Purpose |
|------------|-------|---------|
| QuizRepository | `quizzes` | Quiz storage, JSON serialization |
| SessionRepository | `quiz_sessions` | Session storage |
| SubmissionRepository | `submissions` | Answer storage, results |

### Dependency Injection

**Composition Root:** `server/app.js` (lines 109-127)

```javascript
// Repositories (with shared validator)
const quizRepo = new QuizRepository(db, validator);
const sessionRepo = new SessionRepository(db, validator);
const submissionRepo = new SubmissionRepository(db, validator);

// Services (with repository dependencies)
const quizService = new QuizService(quizRepo, sessionRepo, submissionRepo, txManager);
const sessionService = new SessionService(sessionRepo, quizService);
const gradingService = new GradingService(submissionRepo, quizService, sessionService, txManager);
```

### Middleware Chain

```
Request → correlationId → requestLogger → bodyParser → session → routes → errorHandler
```

| Middleware | File | Purpose |
|------------|------|---------|
| correlationId | `middleware/correlationId.js` | Unique request ID |
| requestLogger | `middleware/requestLogger.js` | Request/response logging |
| errorHandler | `middleware/errorHandler.js` | Central error handling |

### Request Flow Example

```
POST /api/teacher/quiz { title: "My Quiz" }
  │
  ├─ QuizRouter.createQuiz()      → Parse body, check auth
  │
  ├─ QuizService.createQuiz()     → Validate, generate ID
  │
  ├─ QuizRepository.create()      → SQL INSERT with prepared statement
  │
  └─ Response: { id, title, questionCount: 0 }
```

---

*See [DATA](DATA.md) for data model, [SECURITY](SECURITY.md) for auth details*

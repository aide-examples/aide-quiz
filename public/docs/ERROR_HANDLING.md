# Error Handling

* We have structured error handling with custom error classes and a central error handler on the server. The chapters below describe this in more detail.
* There is also a (much simpler) error handling on the client.

---

## Client-Side Error Handling

**File:** `public/common/ApiHelpers.js`

### Toast Notifications

User feedback via toast messages (top-right corner, auto-dismiss):

```javascript
import { toast } from '../../common/ApiHelpers.js';

toast.success('Quiz saved!');           // Green, 3s
toast.error('Failed to load');          // Red, permanent
toast.warning('Session expires soon');  // Yellow, 5s
toast.info('Loading...');               // Blue, 5s
```

| Type | Default Duration | Use Case |
|------|------------------|----------|
| `success` | 3s | Confirmations |
| `error` | permanent | Failures requiring attention |
| `warning` | 5s | Recoverable issues |
| `info` | 5s | Status updates |

### Fetch Wrapper

Use `fetchWithErrorHandling()` for automatic error display:

```javascript
import { fetchWithErrorHandling } from '../../common/ApiHelpers.js';

try {
  const data = await fetchWithErrorHandling('/api/quiz/' + id);
  // Success - use data
} catch (err) {
  // Error already shown to user via toast
  // Only handle if additional logic needed
}
```

### Error Type Mapping

Server error types are mapped to appropriate toast styles:

| Server Error Type | Client Handling |
|-------------------|-----------------|
| `AuthenticationError` | Warning toast + "Please log in" |
| `ValidationError` | Warning toast + detail list |
| `NotFoundError`, `QuizNotFoundError` | Error toast (5s) |
| `NetworkError` | Error toast (permanent) + connection hint |
| Other | Error toast (permanent) |

### Duplicate Suppression

Identical errors within 5 seconds are suppressed to prevent toast spam:

```javascript
// If same error occurs 3x rapidly, user sees only 1 toast
// Console shows: "Duplicate error suppressed (count: 3)"
```

### Correlation ID Display

For server errors with `correlationId`, a secondary toast shows the ID for support:

```
✗ Quiz not found
🔍 Internal error: req-abc-123
```

### Retry Mechanism

For transient failures, use `fetchWithRetry()`:

```javascript
import { fetchWithRetry } from '../../common/ApiHelpers.js';

// Retries up to 3x with exponential backoff (1s, 2s, 4s)
const data = await fetchWithRetry('/api/sessions/open', {}, 3);
```

Retries on: Network errors, 5xx responses, timeouts.
No retry on: 4xx errors (client errors).

### Offline Detection

Automatic offline/online handling:

```javascript
// Triggered by browser events
window.addEventListener('offline', ...);  // Shows permanent error toast
window.addEventListener('online', ...);   // Shows success toast, removes offline toast
```

---

## Server-Side Error Handling

### Error Classes

**Location:** `server/errors/`

| Category | Status | Classes |
|----------|--------|---------|
| **Validation** | 400 | `ValidationError`, `InvalidInputError`, `SchemaValidationError` |
| **Authentication** | 401 | `AuthenticationError`, `InvalidCredentialsError`, `TokenExpiredError` |
| **Not Found** | 404 | `NotFoundError`, `QuizNotFoundError`, `SessionNotFoundError`, `MediaNotFoundError` |
| **Conflict** | 409 | `ConflictError`, `DuplicateSubmissionError`, `QuizAlreadyExistsError` |
| **Business Logic** | 422 | `BusinessLogicError`, `SessionNotOpenError`, `SessionClosedError` |

### Base Class

**File:** `server/errors/AppError.js`

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, type = 'AppError', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.isOperational = true;  // Expected errors
  }
}
```

### Throwing Errors

```javascript
// In services
if (!quiz) {
  throw new QuizNotFoundError(quizId);
}

if (existingSubmission) {
  throw new DuplicateSubmissionError(userCode, sessionId);
}

if (session.status !== 'open') {
  throw new SessionNotOpenError(sessionId);
}
```

### Central Error Handler

**File:** `server/middleware/errorHandler.js`

```javascript
function errorHandler(err, req, res, next) {
  // Log with correlation ID
  logger.error('Error occurred', {
    correlationId: req.correlationId,
    error: err.message,
    type: err.constructor.name,
  });

  // Operational vs programming errors
  const isOperational = err.isOperational || err instanceof AppError;

  // Build response
  res.status(err.statusCode || 500).json({
    error: err.message,
    errorDetails: {
      type: err.type,
      correlationId: req.correlationId,
    }
  });
}
```

### Response Format

```json
{
  "error": "Quiz not found: abc-123",
  "errorDetails": {
    "type": "QuizNotFoundError",
    "message": "Quiz not found: abc-123",
    "correlationId": "req-xyz-789"
  }
}
```

**Development only:** Stack trace included in `errorDetails.stack`

### Error Flow

```
1. Service throws: throw new QuizNotFoundError(id)
       ↓
2. Router catches: catch(err) { next(err) }
       ↓
3. Handler processes: errorHandler(err, req, res, next)
       ↓
4. Response: { error: "...", errorDetails: {...} }
```

### Operational vs Programming Errors

| Type | Example | Handling |
|------|---------|----------|
| **Operational** | Quiz not found, invalid input | Return error response, continue |
| **Programming** | TypeError, null reference | Log alert, return 500 |

```javascript
// Operational errors have isOperational = true
if (!isOperational && process.env.NODE_ENV === 'production') {
  logger.error('Non-operational error detected!');
  // TODO: Alert monitoring system
}
```

---

*See [LOGGING](LOGGING.md) for error logging, [SECURITY](SECURITY.md) for info disclosure*

# Logging

- We have a centralized logging with Winston, daily rotation, and request correlations on the server side. This is described in the chapters below.
- There is also a minimalistic logging approach on the web client which basically wraps the *console.log()* command to make sure it will be deactivated in production environment.

---

## Client-Side Logging

**File:** `public/common/ApiHelpers.js`

```javascript
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEBUG = isLocalhost && true;  // Set to false to disable even in dev
export const log = DEBUG ? console.log.bind(console) : () => {};
```

### Usage

Import and use `log()` instead of `console.log()`:

```javascript
import { log } from '../../common/ApiHelpers.js';

log('[Component] Initialized');           // Only logs in dev
console.error('[Component] Failed:', err); // Always logs (for real errors)
```

### Behavior

| Environment | `log()` Output | `console.error/warn` |
|-------------|----------------|----------------------|
| localhost:3000 | ✅ Shows in console | ✅ Always |
| production URL | ❌ Silent | ✅ Always |

### Exceptions

Files that load before `ApiHelpers.js` cannot import `log()`:
- `BasePath.js` - Determines base path first
- `LanguageHelper.js` - Detects language before other modules

These files keep `console.log` directly.

### When to Use What

| Situation | Use |
|-----------|-----|
| Debug info, state changes, flow tracing | `log()` |
| Errors that need attention | `console.error()` |
| Warnings (recoverable issues) | `console.warn()` |
| Test functions (intentional dev tools) | `console.log()` |

---

## Server-Side Logging

### Configuration

**File:** `server/utils/logger.js`

```javascript
const logLevel = process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
```

| Level | When to Use |
|-------|-------------|
| `error` | Errors needing attention |
| `warn` | Potential issues (4xx responses) |
| `info` | Normal operations |
| `debug` | Detailed debugging (dev only) |

### Log Files

**Location:** `server/logs/`

| File | Retention | Size | Content |
|------|-----------|------|---------|
| `combined-YYYY-MM-DD.log` | 7 days | 20MB | All logs |
| `error-YYYY-MM-DD.log` | 14 days | 20MB | Errors only |
| `exceptions-YYYY-MM-DD.log` | 30 days | 20MB | Uncaught exceptions |
| `rejections-YYYY-MM-DD.log` | 30 days | 20MB | Unhandled promise rejections |

All rotated logs are compressed (gzip).

### Log Formats

**Console (development):**
```
2024-12-25 10:30:45 [info]: Quiz created {"quizId":"abc","correlationId":"xyz"}
```

**File (JSON):**
```json
{"level":"info","message":"Quiz created","timestamp":"2024-12-25T10:30:45","metadata":{"quizId":"abc","correlationId":"xyz"}}
```

### Correlation IDs

Every request gets a unique ID for tracing.

**File:** `server/middleware/correlationId.js`

```javascript
const correlationId = req.headers['x-correlation-id'] || uuidv4();
req.correlationId = correlationId;
res.setHeader('X-Correlation-ID', correlationId);
```

**Usage in code:**
```javascript
logger.info('Quiz created', { quizId, correlationId: req.correlationId });
```

**Helper function:**
```javascript
logger.withCorrelation(req.correlationId).info('Message', { data });
```

### Request Logging

**File:** `server/middleware/requestLogger.js`

Logs API requests only (skips static files like .js, .css, .png).

```javascript
// Incoming
logger.info('Incoming request', {
  correlationId, method, path, query, ip
});

// Completed (log level based on status)
// 5xx → error, 4xx → warn, 2xx/3xx → info
logger.info('Request completed', {
  correlationId, method, path, statusCode, duration: '45ms'
});
```

### Environment Variables

```bash
LOG_LEVEL=debug      # error, warn, info, debug
CONSOLE_LOGS=true    # Enable console output in production
```

### Debugging

```bash
# Live monitoring
tail -f server/logs/combined-*.log

# Errors only
tail -f server/logs/error-*.log

# Find specific request
grep "correlation-id-here" server/logs/combined-*.log
```

---

*See [SECURITY](SECURITY.md) for audit logging details*

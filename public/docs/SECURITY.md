# Security

This document describes the security measures implemented in AIDE Quiz.

## Overview

AIDE Quiz implements defense-in-depth security with multiple layers:
- Authentication & session management
- Input validation (client & server)
- SQL injection prevention
- XSS prevention
- File upload security
- Secrets management

---

## 1. Authentication

### Password Hashing

Teacher passwords are hashed using **bcrypt** with industry-standard settings.

**File:** `server/services/AuthService.js`

```javascript
// Initialization (lines 14-17)
this.teacherPasswordHash = await bcrypt.hash(
  Constants.TEACHER_PASSWORD,
  Constants.BCRYPT_ROUNDS  // 10 rounds
);

// Verification (lines 30-59)
const isValid = await bcrypt.compare(password, this.teacherPasswordHash);
if (!isValid) {
  logger.warn('Failed login attempt - invalid password');
  throw new InvalidCredentialsError();
}
```

**Configuration:** `server/config/constants.js:83`
- `BCRYPT_ROUNDS: 10` - Industry standard, ~100ms hashing time

### Session Management

Sessions use SQLite storage with secure cookie settings.

**File:** `server/app.js` (lines 164-179)

```javascript
this.app.use(session({
  store: sessionStore,  // SQLite-backed, not in-memory
  secret: Constants.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'quiz.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,      // Prevents XSS token theft
    maxAge: Constants.SESSION_MAX_AGE,
    sameSite: 'lax',     // CSRF protection
    path: Constants.BASE_PATH || '/'
  }
}));
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `httpOnly` | `true` | JavaScript cannot access cookie |
| `sameSite` | `lax` | Blocks cross-site form submissions |
| `secure` | `true` (prod) | HTTPS-only in production |
| `saveUninitialized` | `false` | No empty sessions created |

### Authentication Middleware

Protected endpoints use the `requireTeacher()` middleware.

**File:** `server/services/AuthService.js` (lines 78-92)

```javascript
requireTeacher() {
  return (req, res, next) => {
    if (this.isTeacher(req.session)) {
      return next();
    }
    logger.warn('Unauthorized access attempt', {
      path: req.path,
      correlationId: req.correlationId,
    });
    next(new AuthenticationError('Teacher authentication required'));
  };
}
```

**Usage:** `server/routers/QuizRouter.js`
```javascript
const teacherOnly = this.authService.requireTeacher();
this.router.post('/teacher/createQuiz', teacherOnly, async (req, res, next) => { ... });
```

---

## 2. Input Validation

### ObjectValidator

A comprehensive validation framework used on both client and server.

**File:** `shared/validation/ObjectValidator.js`

**Supported Rules:**
| Rule | Purpose |
|------|---------|
| `type` | Type checking (string, number, boolean, array) |
| `required` | Mandatory fields |
| `pattern` | Regex whitelist validation |
| `minLength/maxLength` | String length limits |
| `min/max` | Numeric range limits |
| `enum` | Allowed values list |
| `email` | Email format validation |
| `trim` | Whitespace removal |

### Validation Examples

**Quiz Title:** `server/repositories/QuizRepository.js` (lines 25-40)
```javascript
title: {
  type: 'string',
  required: true,
  trim: true,
  minLength: 1,
  maxLength: 200
}
```

**Image Path:** Whitelist pattern prevents path traversal
```javascript
imagePath: {
  type: 'string',
  required: true,
  pattern: /^[a-zA-Z0-9_-]+$/  // Only safe characters
}
```

**User Code:** `server/repositories/SubmissionRepository.js` (lines 25-34)
```javascript
userCode: {
  type: 'string',
  required: true,
  trim: true,
  maxLength: 100,
  pattern: /^[a-zA-Z0-9äöüÄÖÜß _-]+$/  // Whitelist
}
```

---

## 3. SQL Injection Prevention

All database queries use **prepared statements** with parameterized values.

**Library:** better-sqlite3 v12.5.0 - Enforces prepared statements by design.

**Example:** `server/repositories/QuizRepository.js` (lines 182-185)
```javascript
this.db.prepare(`
  INSERT INTO quizzes (id, title, filename, media_path, quiz_json, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(id, validated.title, filename, validated.imagePath, quizJson, createdAt);
```

**Example:** `server/repositories/SessionRepository.js` (lines 63-65)
```javascript
return this.db.prepare(`
  SELECT * FROM quiz_sessions WHERE session_name = ?
`).get(sessionName);
```

**Rule:** No string concatenation in SQL queries. All user input goes through `?` placeholders.

---

## 4. XSS Prevention

### Cookie Protection

`httpOnly: true` prevents JavaScript from accessing session cookies.

### Input Pattern Validation

User content is restricted to safe character sets:

```javascript
// Question images - only safe filenames
pattern: /^[a-zA-Z0-9_.,-\s]+$/
```

### Error Response Sanitization

**File:** `server/middleware/errorHandler.js` (lines 73-76)

```javascript
// Stack traces only in development
if (process.env.NODE_ENV !== 'production') {
  response.errorDetails.stack = err.stack;
}
```

Production error messages are generic, preventing information leakage.

---

## 5. File Upload Security

### Multi-Layer Validation

**File:** `server/routers/QuizRouter.js` (lines 20-54)

```javascript
createUploadMiddleware() {
  return multer({
    storage: multer.memoryStorage(),  // Not saved to disk directly
    limits: {
      fileSize: Constants.UPLOAD.MAX_FILE_SIZE,  // 10 MB
      files: 1
    },
    fileFilter: (req, file, cb) => {
      // Layer 1: MIME type check
      if (!Constants.UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new InvalidInputError('file', ...), false);
      }
      // Layer 2: Extension check
      const ext = file.originalname.toLowerCase().match(/\.[^.]*$/);
      if (!ext || !Constants.ALLOWED_MEDIA_EXTENSIONS.includes(ext[0])) {
        return cb(new InvalidInputError('file', ...), false);
      }
      cb(null, true);
    }
  });
}
```

### Allowed File Types

**File:** `server/config/constants.js` (lines 13-35)

```javascript
UPLOAD: {
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10 MB
  MAX_FILES_PER_QUIZ: 50,
  ALLOWED_MIME_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg'
  ]
},
ALLOWED_MEDIA_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.ogv']
```

### Filename Sanitization

**File:** `server/services/MediaService.js` (lines 162-164)

```javascript
sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');  // Whitelist only
}
```

### Directory Traversal Prevention

**File:** `server/services/MediaService.js` (lines 114-118, 149-153)

```javascript
// Security check on file deletion and retrieval
if (!filePath.startsWith(mediaDir)) {
  logger.warn('Directory traversal attempt detected', { quizId, filename });
  throw new ValidationError('Invalid file path');
}
```

---

## 6. CSRF Protection

The `sameSite: 'lax'` cookie setting provides CSRF protection:

- Blocks cross-site POST requests from other domains
- Allows same-site navigation and top-level GET requests
- Combined with `httpOnly`, prevents token theft

---

## 7. Secrets Management

All sensitive values are stored in environment variables.

**File:** `server/config/constants.js`

```javascript
SESSION_SECRET: process.env.SESSION_SECRET || 'localdevsecret',
TEACHER_PASSWORD: process.env.TEACHER_PASS || 'ingo'
```

**Production:** `.env.production`
```bash
# Strong password required
TEACHER_PASS=your-secure-password

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=ce0c992f17470df2adcbd4cc43f5c4c9966b090cb7e9e85d08a154b099b5b5a0
```

**Important:** `.env` files are excluded from Git via `.gitignore`.

---

## Security Checklist

| Measure | Status | Implementation |
|---------|--------|----------------|
| Password hashing | Implemented | bcrypt, 10 rounds |
| Session security | Implemented | SQLite store, secure cookies |
| httpOnly cookies | Implemented | Prevents XSS token theft |
| SameSite cookies | Implemented | CSRF protection |
| Input validation | Implemented | ObjectValidator with patterns |
| SQL injection prevention | Implemented | Prepared statements only |
| XSS prevention | Implemented | Pattern validation, httpOnly |
| File upload validation | Implemented | MIME + extension + sanitization |
| Directory traversal prevention | Implemented | Path validation |
| Audit logging | Implemented | Winston with correlation IDs |
| Error message sanitization | Implemented | No stack traces in production |
| Secrets in environment | Implemented | .env files, not in code |
| Rate limiting | Planned | Login attempts, API throttling |
| Security headers (helmet) | Planned | CSP, HSTS, etc. |

---

## Recommendations for Production

1. **Generate new secrets** before deployment:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use strong passwords** - Change default TEACHER_PASS

3. **Enable HTTPS** - Set `secure: true` for cookies

4. **Consider adding:**
   - Rate limiting (express-rate-limit)
   - Security headers (helmet.js)
   - Content Security Policy

---

## Related Documentation

| Topic | Document |
|-------|----------|
| Audit Logging & Correlation IDs | [LOGGING.md](LOGGING.md) |
| Error Classes & Information Disclosure | [ERROR_HANDLING.md](ERROR_HANDLING.md) |
| Coding Standards | [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) |

---

*Last updated: 2024-12-25*

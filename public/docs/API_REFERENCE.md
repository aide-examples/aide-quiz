## Modules

<dl>
<dt><a href="#module_routers/AuthRouter">routers/AuthRouter</a></dt>
<dd><p>Authentication Router
Handles teacher login, logout, and status checks.</p>
</dd>
<dt><a href="#module_routers/QuizRouter">routers/QuizRouter</a></dt>
<dd><p>Quiz Router
Quiz CRUD and media management.</p>
</dd>
<dt><a href="#module_routers/ResultRouter">routers/ResultRouter</a></dt>
<dd><p>Result Router
Public access to quiz results via unique link.</p>
</dd>
<dt><a href="#module_routers/SessionRouter">routers/SessionRouter</a></dt>
<dd><p>Session Router
Quiz session management and submission handling.</p>
</dd>
<dt><a href="#module_routers/SyncRouter">routers/SyncRouter</a></dt>
<dd><p>Sync Router
Synchronization between filesystem and database.</p>
</dd>
<dt><a href="#module_routers/TranslationRouter">routers/TranslationRouter</a></dt>
<dd><p>Translation Router
Quiz translation via DeepL API.</p>
</dd>
<dt><a href="#module_routers/ValidationRouter">routers/ValidationRouter</a></dt>
<dd><p>Validation Router
API endpoints for client-side validation rule queries.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#express">express</a></dt>
<dd><p>Test Router - Endpoints for testing error handling and validation
Only available in development mode</p>
</dd>
</dl>

<a name="module_routers/AuthRouter"></a>

## routers/AuthRouter
Authentication Router
Handles teacher login, logout, and status checks.


* [routers/AuthRouter](#module_routers/AuthRouter)
    * [~LoginTeacher](#module_routers/AuthRouter..LoginTeacher)
    * [~LogoutTeacher](#module_routers/AuthRouter..LogoutTeacher)
    * [~GetAuthStatus](#module_routers/AuthRouter..GetAuthStatus)

<a name="module_routers/AuthRouter..LoginTeacher"></a>

### routers/AuthRouter~LoginTeacher
Authenticate as teacher with password. Sets session cookie on success.

**Kind**: inner property of [<code>routers/AuthRouter</code>](#module_routers/AuthRouter)  
**Route**: POST /api/teacher/login  
**Example**  
```js
// Request
POST /api/teacher/login
Content-Type: application/json

{
  "password": "your-teacher-password"
}
```
**Example**  
```js
// Response 200 OK
{
  "ok": true
}
```
**Example**  
```js
// Response 401 Unauthorized
{
  "error": "Invalid credentials",
  "errorDetails": { "type": "InvalidCredentialsError" }
}
```
<a name="module_routers/AuthRouter..LogoutTeacher"></a>

### routers/AuthRouter~LogoutTeacher
End teacher session. Clears session cookie.

**Kind**: inner property of [<code>routers/AuthRouter</code>](#module_routers/AuthRouter)  
**Route**: POST /api/teacher/logout  
**Example**  
```js
// Request
POST /api/teacher/logout
```
**Example**  
```js
// Response 200 OK
{
  "ok": true
}
```
<a name="module_routers/AuthRouter..GetAuthStatus"></a>

### routers/AuthRouter~GetAuthStatus
Check if current session is authenticated as teacher.

**Kind**: inner property of [<code>routers/AuthRouter</code>](#module_routers/AuthRouter)  
**Route**: GET /api/teacher/status  
**Example**  
```js
// Request
GET /api/teacher/status
```
**Example**  
```js
// Response 200 OK (authenticated)
{
  "authenticated": true
}
```
**Example**  
```js
// Response 200 OK (not authenticated)
{
  "authenticated": false
}
```
<a name="module_routers/QuizRouter"></a>

## routers/QuizRouter
Quiz Router
Quiz CRUD and media management.


* [routers/QuizRouter](#module_routers/QuizRouter)
    * [~CreateQuiz](#module_routers/QuizRouter..CreateQuiz)
    * [~SaveQuiz](#module_routers/QuizRouter..SaveQuiz)
    * [~UploadQuiz](#module_routers/QuizRouter..UploadQuiz)
    * [~GetAllQuizzes](#module_routers/QuizRouter..GetAllQuizzes)
    * [~GetQuiz](#module_routers/QuizRouter..GetQuiz)
    * [~ValidateQuiz](#module_routers/QuizRouter..ValidateQuiz)
    * [~DeleteQuiz](#module_routers/QuizRouter..DeleteQuiz)
    * [~UploadMedia](#module_routers/QuizRouter..UploadMedia)
    * [~GetMediaFiles](#module_routers/QuizRouter..GetMediaFiles)
    * [~DeleteMediaFile](#module_routers/QuizRouter..DeleteMediaFile)
    * [~ServeMediaFile](#module_routers/QuizRouter..ServeMediaFile)

<a name="module_routers/QuizRouter..CreateQuiz"></a>

### routers/QuizRouter~CreateQuiz
Create a new empty quiz.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: POST /api/teacher/createQuiz  
**Authentication**: Teacher  
**Example**  
```js
// Request
{ "title": "JavaScript Basics", "imagePath": "js-quiz", "language": "en" }
```
**Example**  
```js
// Response 200 OK
{ "ok": true, "quizId": "abc123", "title": "JavaScript Basics" }
```
<a name="module_routers/QuizRouter..SaveQuiz"></a>

### routers/QuizRouter~SaveQuiz
Save quiz content (questions, options).

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: POST /api/teacher/saveQuiz  
**Authentication**: Teacher  
**Example**  
```js
// Request
{ "quizId": "abc123", "quiz": { "title": "...", "questions": [...] } }
```
**Example**  
```js
// Response 200 OK
{ "ok": true, "quizId": "abc123" }
```
<a name="module_routers/QuizRouter..UploadQuiz"></a>

### routers/QuizRouter~UploadQuiz
Upload complete quiz as JSON.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: POST /api/teacher/uploadQuiz  
**Authentication**: Teacher  
**Example**  
```js
// Request: Full quiz JSON object
{ "title": "...", "questions": [...] }
```
<a name="module_routers/QuizRouter..GetAllQuizzes"></a>

### routers/QuizRouter~GetAllQuizzes
List all quizzes.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: GET /api/teacher/quizzes  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
[{ "id": "abc123", "title": "JavaScript Basics", "questionCount": 10 }]
```
<a name="module_routers/QuizRouter..GetQuiz"></a>

### routers/QuizRouter~GetQuiz
Get quiz with all questions and options.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: GET /api/teacher/quiz/:quizId  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{ "title": "JavaScript Basics", "questions": [...] }
```
<a name="module_routers/QuizRouter..ValidateQuiz"></a>

### routers/QuizRouter~ValidateQuiz
Validate quiz structure and content.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: POST /api/teacher/quiz/:quizId/validate  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{ "valid": true, "errors": [], "warnings": [] }
```
<a name="module_routers/QuizRouter..DeleteQuiz"></a>

### routers/QuizRouter~DeleteQuiz
Delete quiz and all related sessions/submissions.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: DELETE /api/teacher/quiz/:quizId  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{ "ok": true, "message": "Quiz and all related data deleted successfully" }
```
<a name="module_routers/QuizRouter..UploadMedia"></a>

### routers/QuizRouter~UploadMedia
Upload image/video file for quiz.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: POST /api/teacher/uploadMedia/:quizId  
**Authentication**: Teacher  
**Example**  
```js
// Request: multipart/form-data with 'file' field
```
**Example**  
```js
// Response 200 OK
{ "ok": true, "filename": "image.png", "path": "quizzes/abc123/media/image.png" }
```
<a name="module_routers/QuizRouter..GetMediaFiles"></a>

### routers/QuizRouter~GetMediaFiles
List all media files for a quiz.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: GET /api/teacher/media/:quizId  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{ "files": ["image1.png", "diagram.svg", "video.mp4"] }
```
<a name="module_routers/QuizRouter..DeleteMediaFile"></a>

### routers/QuizRouter~DeleteMediaFile
Delete a media file.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: DELETE /api/teacher/media/:quizId/:filename  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{ "ok": true, "deleted": "image.png" }
```
<a name="module_routers/QuizRouter..ServeMediaFile"></a>

### routers/QuizRouter~ServeMediaFile
Public endpoint to serve media files.

**Kind**: inner property of [<code>routers/QuizRouter</code>](#module_routers/QuizRouter)  
**Route**: GET /api/img?quizId=...&filename=...  
**Example**  
```js
// Request
GET /api/img?quizId=abc123&filename=diagram.png
```
**Example**  
```js
// Response: Binary file content
```
<a name="module_routers/ResultRouter"></a>

## routers/ResultRouter
Result Router
Public access to quiz results via unique link.

<a name="module_routers/ResultRouter..GetResult"></a>

### routers/ResultRouter~GetResult
Retrieve quiz result by unique result link ID. No authentication required.

**Kind**: inner property of [<code>routers/ResultRouter</code>](#module_routers/ResultRouter)  
**Route**: GET /api/result/:resultId  
**Example**  
```js
// Request
GET /api/result/abc123-unique-link-id
```
**Example**  
```js
// Response 200 OK
{
  "quizTitle": "JavaScript Basics",
  "userCode": "student1",
  "score": 8,
  "maxScore": 10,
  "answers": [...]
}
```
<a name="module_routers/SessionRouter"></a>

## routers/SessionRouter
Session Router
Quiz session management and submission handling.


* [routers/SessionRouter](#module_routers/SessionRouter)
    * [~CreateSession](#module_routers/SessionRouter..CreateSession)
    * [~GetCurrentlyOpenSessions](#module_routers/SessionRouter..GetCurrentlyOpenSessions)
    * [~GetAllSessions](#module_routers/SessionRouter..GetAllSessions)
    * [~GetSession](#module_routers/SessionRouter..GetSession)
    * [~GetSessionQuiz](#module_routers/SessionRouter..GetSessionQuiz)
    * [~SubmitAnswers](#module_routers/SessionRouter..SubmitAnswers)
    * [~GetSessionStats](#module_routers/SessionRouter..GetSessionStats)
    * [~GetSessionSubmissions](#module_routers/SessionRouter..GetSessionSubmissions)
    * [~ExportSessionCSV](#module_routers/SessionRouter..ExportSessionCSV)

<a name="module_routers/SessionRouter..CreateSession"></a>

### routers/SessionRouter~CreateSession
Create a new quiz session with optional time window.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: POST /api/teacher/createSession  
**Authentication**: Teacher  
**Example**  
```js
// Request
{ "quizId": "abc123", "open_from": "2024-01-01T09:00", "open_until": "2024-01-01T17:00" }
```
**Example**  
```js
// Response 200 OK
{ "ok": true, "sessionName": "quiz-2024-01-01", "sessionId": "xyz789" }
```
<a name="module_routers/SessionRouter..GetCurrentlyOpenSessions"></a>

### routers/SessionRouter~GetCurrentlyOpenSessions
Get all sessions that are currently open (open_from <= now <= open_until).
Public endpoint for students.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: GET /api/sessions/open  
**Example**  
```js
// Response 200 OK
[{ "session_name": "2024-01-01-09-00", "title": "JavaScript Basics", "open_until": "2024-01-03T17:00:00Z" }]
```
<a name="module_routers/SessionRouter..GetAllSessions"></a>

### routers/SessionRouter~GetAllSessions
Get all sessions with optional limit.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: GET /api/sessions/all?limit=100  
**Example**  
```js
// Response 200 OK
{ "sessions": [{ "sessionName": "...", "quizTitle": "...", "created_at": "..." }] }
```
<a name="module_routers/SessionRouter..GetSession"></a>

### routers/SessionRouter~GetSession
Get session details by name.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: GET /api/session/:sessionName  
**Example**  
```js
// Response 200 OK
{ "sessionName": "quiz-2024-01-01", "quizId": "abc123", "status": "open" }
```
<a name="module_routers/SessionRouter..GetSessionQuiz"></a>

### routers/SessionRouter~GetSessionQuiz
Get quiz for a session (for students taking the quiz).

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: GET /api/session/:sessionName/quiz  
**Example**  
```js
// Response 200 OK
{ "title": "JavaScript Basics", "questions": [...] }
```
<a name="module_routers/SessionRouter..SubmitAnswers"></a>

### routers/SessionRouter~SubmitAnswers
Submit student answers for grading.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: POST /api/session/:sessionName/submit  
**Example**  
```js
// Request
{ "userCode": "student1", "answers": [{ "questionId": "q1", "selected": ["a", "c"] }] }
```
**Example**  
```js
// Response 200 OK
{ "ok": true, "score": 8, "maxScore": 10, "resultLink": "result-abc123" }
```
<a name="module_routers/SessionRouter..GetSessionStats"></a>

### routers/SessionRouter~GetSessionStats
Get aggregated statistics for a session.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: GET /api/session/:sessionName/stats  
**Example**  
```js
// Response 200 OK
{ "submissionCount": 25, "averageScore": 7.5, "questionStats": [...] }
```
<a name="module_routers/SessionRouter..GetSessionSubmissions"></a>

### routers/SessionRouter~GetSessionSubmissions
Get all submissions for a session.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: GET /api/teacher/session/:sessionName/submissions  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{ "submissions": [{ "userCode": "student1", "score": 8, "maxScore": 10 }] }
```
<a name="module_routers/SessionRouter..ExportSessionCSV"></a>

### routers/SessionRouter~ExportSessionCSV
Download session results as CSV file.

**Kind**: inner property of [<code>routers/SessionRouter</code>](#module_routers/SessionRouter)  
**Route**: GET /api/teacher/session/:sessionName/export.csv  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK (Content-Type: text/csv)
// Downloads: session-name-2024-01-01.csv
```
<a name="module_routers/SyncRouter"></a>

## routers/SyncRouter
Sync Router
Synchronization between filesystem and database.


* [routers/SyncRouter](#module_routers/SyncRouter)
    * [~SyncFromFilesystem](#module_routers/SyncRouter..SyncFromFilesystem)
    * [~ExportQuiz](#module_routers/SyncRouter..ExportQuiz)

<a name="module_routers/SyncRouter..SyncFromFilesystem"></a>

### routers/SyncRouter~SyncFromFilesystem
Import quizzes from /quizzes/*.json files into database.

**Kind**: inner property of [<code>routers/SyncRouter</code>](#module_routers/SyncRouter)  
**Route**: POST /api/teacher/syncFS  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{
  "ok": true,
  "imported": 3,
  "skipped": 1
}
```
<a name="module_routers/SyncRouter..ExportQuiz"></a>

### routers/SyncRouter~ExportQuiz
Export quiz from database to /quizzes/{quizId}/quiz.json file.

**Kind**: inner property of [<code>routers/SyncRouter</code>](#module_routers/SyncRouter)  
**Route**: POST /api/teacher/exportQuiz/:quizId  
**Authentication**: Teacher  
**Example**  
```js
// Response 200 OK
{
  "ok": true,
  "path": "quizzes/my-quiz/quiz.json"
}
```
<a name="module_routers/TranslationRouter"></a>

## routers/TranslationRouter
Translation Router
Quiz translation via DeepL API.


* [routers/TranslationRouter](#module_routers/TranslationRouter)
    * [~TranslateQuiz](#module_routers/TranslationRouter..TranslateQuiz)
    * [~GetTranslationUsage](#module_routers/TranslationRouter..GetTranslationUsage)
    * [~ClearTranslationCache](#module_routers/TranslationRouter..ClearTranslationCache)

<a name="module_routers/TranslationRouter..TranslateQuiz"></a>

### routers/TranslationRouter~TranslateQuiz
Translate quiz content to target language using DeepL.

**Kind**: inner property of [<code>routers/TranslationRouter</code>](#module_routers/TranslationRouter)  
**Route**: GET /api/translate/quiz/:quizId?lang=de  
**Example**  
```js
// Request
GET /api/translate/quiz/abc123?lang=es
```
**Example**  
```js
// Response 200 OK
{
  "title": "Conceptos básicos de JavaScript",
  "questions": [...]
}
```
<a name="module_routers/TranslationRouter..GetTranslationUsage"></a>

### routers/TranslationRouter~GetTranslationUsage
Get DeepL API usage statistics.

**Kind**: inner property of [<code>routers/TranslationRouter</code>](#module_routers/TranslationRouter)  
**Route**: GET /api/translate/usage  
**Example**  
```js
// Response 200 OK
{
  "character_count": 12500,
  "character_limit": 500000
}
```
<a name="module_routers/TranslationRouter..ClearTranslationCache"></a>

### routers/TranslationRouter~ClearTranslationCache
Clear cached translations for a quiz.

**Kind**: inner property of [<code>routers/TranslationRouter</code>](#module_routers/TranslationRouter)  
**Route**: DELETE /api/translate/cache/:quizId  
**Example**  
```js
// Response 200 OK
{
  "success": true,
  "message": "Translation cache cleared for quiz abc123"
}
```
<a name="module_routers/ValidationRouter"></a>

## routers/ValidationRouter
Validation Router
API endpoints for client-side validation rule queries.


* [routers/ValidationRouter](#module_routers/ValidationRouter)
    * [~GetAllRules](#module_routers/ValidationRouter..GetAllRules)
    * [~GetEntityRules](#module_routers/ValidationRouter..GetEntityRules)
    * [~setValidatorInstance(validator)](#module_routers/ValidationRouter..setValidatorInstance)
    * [~serializeRules()](#module_routers/ValidationRouter..serializeRules)

<a name="module_routers/ValidationRouter..GetAllRules"></a>

### routers/ValidationRouter~GetAllRules
Returns all registered validation rules for client-side validation.

**Kind**: inner property of [<code>routers/ValidationRouter</code>](#module_routers/ValidationRouter)  
**Route**: GET /api/validation/rules  
**Example**  
```js
// Response 200 OK
{
  "Quiz": { "title": { "type": "string", "required": true, "maxLength": 200 } },
  "Submission": { "userCode": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" } }
}
```
<a name="module_routers/ValidationRouter..GetEntityRules"></a>

### routers/ValidationRouter~GetEntityRules
Returns validation rules for a specific entity type.

**Kind**: inner property of [<code>routers/ValidationRouter</code>](#module_routers/ValidationRouter)  
**Route**: GET /api/validation/rules/:entityType  
**Example**  
```js
// Request
GET /api/validation/rules/Quiz
```
**Example**  
```js
// Response 200 OK
{
  "title": { "type": "string", "required": true, "maxLength": 200 },
  "imagePath": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" }
}
```
**Example**  
```js
// Response 404 Not Found
{ "error": "No validation rules found for entity type: Unknown" }
```
<a name="module_routers/ValidationRouter..setValidatorInstance"></a>

### routers/ValidationRouter~setValidatorInstance(validator)
Sets the validator instance (called by app.js)

**Kind**: inner method of [<code>routers/ValidationRouter</code>](#module_routers/ValidationRouter)  

| Param | Type | Description |
| --- | --- | --- |
| validator | <code>ObjectValidator</code> | The validator instance |

<a name="module_routers/ValidationRouter..serializeRules"></a>

### routers/ValidationRouter~serializeRules()
Serialize rules by converting RegExp to strings

**Kind**: inner method of [<code>routers/ValidationRouter</code>](#module_routers/ValidationRouter)  
<a name="express"></a>

## express
Test Router - Endpoints for testing error handling and validation
Only available in development mode

**Kind**: global constant  

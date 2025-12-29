const express = require('express');

/**
 * Session Router
 * Quiz session management and submission handling.
 * @module routers/SessionRouter
 */
class SessionRouter {
  constructor(sessionService, gradingService, exportService, authService) {
    this.sessionService = sessionService;
    this.gradingService = gradingService;
    this.exportService = exportService;
    this.authService = authService;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    const teacherOnly = this.authService.requireTeacher();

    /**
     * Create Session
     * @name CreateSession
     * @route POST /api/teacher/createSession
     * @authentication Teacher
     * @description Create a new quiz session with optional time window.
     *
     * @example
     * // Request
     * { "quizId": "abc123", "open_from": "2024-01-01T09:00", "open_until": "2024-01-01T17:00" }
     *
     * @example
     * // Response 200 OK
     * { "ok": true, "sessionName": "quiz-2024-01-01", "sessionId": "xyz789" }
     */
    this.router.post('/teacher/createSession', teacherOnly, async (req, res, next) => {
      try {
        const { quizId, open_from, open_until } = req.body;
        const result = this.sessionService.createSession(quizId, open_from, open_until);
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get Currently Open Sessions
     * @name GetCurrentlyOpenSessions
     * @route GET /api/sessions/open
     * @description Get all sessions that are currently open (open_from <= now <= open_until).
     * Public endpoint for students.
     *
     * @example
     * // Response 200 OK
     * [{ "session_name": "2024-01-01-09-00", "title": "JavaScript Basics", "open_until": "2024-01-03T17:00:00Z" }]
     */
    this.router.get('/sessions/open', async (req, res, next) => {
      try {
        const sessions = this.sessionService.getCurrentlyOpenSessions();
        return res.json(sessions);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get All Sessions
     * @name GetAllSessions
     * @route GET /api/sessions/all?limit=100
     * @description Get all sessions with optional limit.
     *
     * @example
     * // Response 200 OK
     * { "sessions": [{ "sessionName": "...", "quizTitle": "...", "created_at": "..." }] }
     */
    this.router.get('/sessions/all', async (req, res, next) => {
      try {
        const limit = parseInt(req.query.limit) || 100;
        const sessions = this.sessionService.getAllSessions(limit);
        return res.json({ sessions });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get Session
     * @name GetSession
     * @route GET /api/session/:sessionName
     * @description Get session details by name.
     *
     * @example
     * // Response 200 OK
     * { "sessionName": "quiz-2024-01-01", "quizId": "abc123", "status": "open" }
     */
    this.router.get('/session/:sessionName', async (req, res, next) => {
      try {
        const { sessionName } = req.params;
        const session = this.sessionService.getSession(sessionName);
        return res.json(session);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get Session Quiz
     * @name GetSessionQuiz
     * @route GET /api/session/:sessionName/quiz
     * @description Get quiz for a session (for students taking the quiz).
     *
     * @example
     * // Response 200 OK
     * { "title": "JavaScript Basics", "questions": [...] }
     */
    this.router.get('/session/:sessionName/quiz', async (req, res, next) => {
      try {
        const { sessionName } = req.params;
        const forStat = req.query.forStat === 'true';
        const quiz = this.sessionService.getSessionQuiz(sessionName, forStat);
        return res.json(quiz);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Submit Quiz Answers
     * @name SubmitAnswers
     * @route POST /api/session/:sessionName/submit
     * @description Submit student answers for grading.
     *
     * @example
     * // Request
     * { "userCode": "student1", "answers": [{ "questionId": "q1", "selected": ["a", "c"] }] }
     *
     * @example
     * // Response 200 OK
     * { "ok": true, "score": 8, "maxScore": 10, "resultLink": "result-abc123" }
     */
    this.router.post('/session/:sessionName/submit', async (req, res, next) => {
      try {
        const { sessionName } = req.params;
        const { userCode, answers } = req.body;
        const result = this.gradingService.submitAnswers(sessionName, userCode, answers);
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get Session Statistics
     * @name GetSessionStats
     * @route GET /api/session/:sessionName/stats
     * @description Get aggregated statistics for a session.
     *
     * @example
     * // Response 200 OK
     * { "submissionCount": 25, "averageScore": 7.5, "questionStats": [...] }
     */
    this.router.get('/session/:sessionName/stats', async (req, res, next) => {
      try {
        const { sessionName } = req.params;
        const stats = this.exportService.exportSessionStats(sessionName);
        return res.json(stats);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get Session Submissions
     * @name GetSessionSubmissions
     * @route GET /api/teacher/session/:sessionName/submissions
     * @authentication Teacher
     * @description Get all submissions for a session.
     *
     * @example
     * // Response 200 OK
     * { "submissions": [{ "userCode": "student1", "score": 8, "maxScore": 10 }] }
     */
    this.router.get('/teacher/session/:sessionName/submissions', teacherOnly, async (req, res, next) => {
      try {
        const { sessionName } = req.params;
        const submissions = this.gradingService.getSessionSubmissions(sessionName);
        return res.json({ submissions });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Export Session CSV
     * @name ExportSessionCSV
     * @route GET /api/teacher/session/:sessionName/export.csv
     * @authentication Teacher
     * @description Download session results as CSV file.
     *
     * @example
     * // Response 200 OK (Content-Type: text/csv)
     * // Downloads: session-name-2024-01-01.csv
     */
    this.router.get('/teacher/session/:sessionName/export.csv', teacherOnly, async (req, res, next) => {
      try {
        const { sessionName } = req.params;
        const { content, filename, contentType } = this.exportService.exportSessionCSV(sessionName);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(content);
      } catch (err) {
        next(err);
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = SessionRouter;

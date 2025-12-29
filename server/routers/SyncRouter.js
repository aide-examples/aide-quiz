const express = require('express');

/**
 * Sync Router
 * Synchronization between filesystem and database.
 * @module routers/SyncRouter
 */
class SyncRouter {
  constructor(syncService, authService) {
    this.syncService = syncService;
    this.authService = authService;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    const teacherOnly = this.authService.requireTeacher();

    /**
     * Sync from Filesystem
     * @name SyncFromFilesystem
     * @route POST /api/teacher/syncFS
     * @authentication Teacher
     * @description Import quizzes from /quizzes/*.json files into database.
     *
     * @example
     * // Response 200 OK
     * {
     *   "ok": true,
     *   "imported": 3,
     *   "skipped": 1
     * }
     */
    this.router.post('/teacher/syncFS', teacherOnly, async (req, res, next) => {
      try {
        const result = this.syncService.syncFromFilesystem();
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Export Quiz to Filesystem
     * @name ExportQuiz
     * @route POST /api/teacher/exportQuiz/:quizId
     * @authentication Teacher
     * @description Export quiz from database to /quizzes/{quizId}/quiz.json file.
     *
     * @example
     * // Response 200 OK
     * {
     *   "ok": true,
     *   "path": "quizzes/my-quiz/quiz.json"
     * }
     */
    this.router.post('/teacher/exportQuiz/:quizId', teacherOnly, async (req, res, next) => {
      try {
        const { quizId } = req.params;
        const result = this.syncService.exportQuizToFile(quizId);
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = SyncRouter;

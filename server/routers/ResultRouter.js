const express = require('express');

/**
 * Result Router
 * Public access to quiz results via unique link.
 * @module routers/ResultRouter
 */
class ResultRouter {
  constructor(gradingService) {
    this.gradingService = gradingService;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * Get Quiz Result
     * @name GetResult
     * @route GET /api/result/:resultId
     * @description Retrieve quiz result by unique result link ID. No authentication required.
     *
     * @example
     * // Request
     * GET /api/result/abc123-unique-link-id
     *
     * @example
     * // Response 200 OK
     * {
     *   "quizTitle": "JavaScript Basics",
     *   "userCode": "student1",
     *   "score": 8,
     *   "maxScore": 10,
     *   "answers": [...]
     * }
     */
    this.router.get('/result/:resultId', async (req, res, next) => {
      try {
        const { resultId } = req.params;
        const result = this.gradingService.getResult(resultId);
        return res.json(result);
      } catch (err) {
        next(err);
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ResultRouter;

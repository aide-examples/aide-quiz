const express = require('express');
const router = express.Router();

/**
 * Translation Router
 * Quiz translation via DeepL API.
 * @module routers/TranslationRouter
 */
class TranslationRouter {
  constructor(translationService, quizService) {
    this.translationService = translationService;
    this.quizService = quizService;
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * Translate Quiz
     * @name TranslateQuiz
     * @route GET /api/translate/quiz/:quizId?lang=de
     * @description Translate quiz content to target language using DeepL.
     *
     * @example
     * // Request
     * GET /api/translate/quiz/abc123?lang=es
     *
     * @example
     * // Response 200 OK
     * {
     *   "title": "Conceptos básicos de JavaScript",
     *   "questions": [...]
     * }
     */
    router.get('/quiz/:quizId', async (req, res, next) => {
      try {
        const { quizId } = req.params;
        const { lang } = req.query;

        if (!lang) {
          return res.status(400).json({
            error: 'Missing language parameter',
            message: 'Please provide ?lang=de|en|es'
          });
        }

        const quizData = this.quizService.loadQuiz(quizId);
        quizData.id = quizId;
        const translatedQuiz = await this.translationService.translateQuiz(quizData, lang);
        res.json(translatedQuiz);
      } catch (error) {
        next(error);
      }
    });

    /**
     * Get DeepL Usage
     * @name GetTranslationUsage
     * @route GET /api/translate/usage
     * @description Get DeepL API usage statistics.
     *
     * @example
     * // Response 200 OK
     * {
     *   "character_count": 12500,
     *   "character_limit": 500000
     * }
     */
    router.get('/usage', async (req, res, next) => {
      try {
        const stats = await this.translationService.getUsageStats();
        res.json(stats);
      } catch (error) {
        next(error);
      }
    });

    /**
     * Clear Translation Cache
     * @name ClearTranslationCache
     * @route DELETE /api/translate/cache/:quizId
     * @description Clear cached translations for a quiz.
     *
     * @example
     * // Response 200 OK
     * {
     *   "success": true,
     *   "message": "Translation cache cleared for quiz abc123"
     * }
     */
    router.delete('/cache/:quizId', async (req, res, next) => {
      try {
        const { quizId } = req.params;
        this.translationService.clearCache(quizId);
        res.json({
          success: true,
          message: `Translation cache cleared for quiz ${quizId}`
        });
      } catch (error) {
        next(error);
      }
    });
  }

  getRouter() {
    return router;
  }
}

module.exports = TranslationRouter;

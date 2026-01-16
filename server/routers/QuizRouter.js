const express = require('express');
const multer = require('multer');
const Constants = require('../config/constants');
const { InvalidInputError, DemoModeRestrictionError } = require('../errors');

/**
 * Quiz Router
 * Quiz CRUD and media management.
 * @module routers/QuizRouter
 */
class QuizRouter {
  constructor(quizService, mediaService, authService, quizValidationService) {
    this.quizService = quizService;
    this.mediaService = mediaService;
    this.authService = authService;
    this.quizValidator = quizValidationService;
    this.router = express.Router();
    this.upload = this.createUploadMiddleware();
    this.setupRoutes();
  }

  createUploadMiddleware() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: Constants.UPLOAD.MAX_FILE_SIZE,
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (!Constants.UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(new InvalidInputError('file', `Invalid file type: ${file.mimetype}`), false);
        }
        const ext = file.originalname.toLowerCase().match(/\.[^.]*$/);
        if (!ext || !Constants.ALLOWED_MEDIA_EXTENSIONS.includes(ext[0])) {
          return cb(new InvalidInputError('file', `Invalid extension: ${ext ? ext[0] : 'none'}`), false);
        }
        cb(null, true);
      }
    });
  }

  setupRoutes() {
    const teacherOnly = this.authService.requireTeacher();

    /**
     * Create Quiz
     * @name CreateQuiz
     * @route POST /api/teacher/createQuiz
     * @authentication Teacher
     * @description Create a new empty quiz.
     *
     * @example
     * // Request
     * { "title": "JavaScript Basics", "imagePath": "js-quiz", "language": "en" }
     *
     * @example
     * // Response 200 OK
     * { "ok": true, "quizId": "abc123", "title": "JavaScript Basics" }
     */
    this.router.post('/teacher/createQuiz', teacherOnly, async (req, res, next) => {
      try {
        // Block in demo mode
        if (this.authService.isDemoMode(req.session)) {
          throw new DemoModeRestrictionError('Creating quizzes');
        }

        const { title, imagePath, language } = req.body;
        const result = this.quizService.createQuiz(title, imagePath, language);
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Save Quiz
     * @name SaveQuiz
     * @route POST /api/teacher/saveQuiz
     * @authentication Teacher
     * @description Save quiz content (questions, options).
     *
     * @example
     * // Request
     * { "quizId": "abc123", "quiz": { "title": "...", "questions": [...] } }
     *
     * @example
     * // Response 200 OK
     * { "ok": true, "quizId": "abc123" }
     */
    this.router.post('/teacher/saveQuiz', teacherOnly, async (req, res, next) => {
      try {
        const { quiz, quizId } = req.body;

        // In demo mode: validate but don't save, return success with demoMode flag
        if (this.authService.isDemoMode(req.session)) {
          this.quizValidator.validateQuiz(quiz);
          return res.json({ ok: true, quizId, demoMode: true });
        }

        this.quizValidator.validateQuiz(quiz);
        const result = this.quizService.saveQuiz(quiz, quizId);
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Upload Quiz JSON
     * @name UploadQuiz
     * @route POST /api/teacher/uploadQuiz
     * @authentication Teacher
     * @description Upload complete quiz as JSON.
     *
     * @example
     * // Request: Full quiz JSON object
     * { "title": "...", "questions": [...] }
     */
    this.router.post('/teacher/uploadQuiz', teacherOnly, async (req, res, next) => {
      try {
        const quiz = req.body;
        this.quizValidator.validateQuiz(quiz);
        const result = this.quizService.uploadQuiz(quiz);
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get All Quizzes
     * @name GetAllQuizzes
     * @route GET /api/teacher/quizzes
     * @authentication Teacher
     * @description List all quizzes.
     *
     * @example
     * // Response 200 OK
     * [{ "id": "abc123", "title": "JavaScript Basics", "questionCount": 10 }]
     */
    this.router.get('/teacher/quizzes', teacherOnly, async (req, res, next) => {
      try {
        let quizzes = this.quizService.getAllQuizzes();

        // In demo mode: filter to only show demo quiz
        if (this.authService.isDemoMode(req.session)) {
          const demoQuizPath = this.authService.getDemoQuizPath(req.session);
          quizzes = quizzes.filter(q => q.media_path === demoQuizPath || q.id === demoQuizPath);
        }

        return res.json(quizzes);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get Quiz
     * @name GetQuiz
     * @route GET /api/teacher/quiz/:quizId
     * @authentication Teacher
     * @description Get quiz with all questions and options.
     *
     * @example
     * // Response 200 OK
     * { "title": "JavaScript Basics", "questions": [...] }
     */
    this.router.get('/teacher/quiz/:quizId', teacherOnly, async (req, res, next) => {
      try {
        const { quizId } = req.params;
        const quiz = this.quizService.loadQuiz(quizId);
        return res.json(quiz);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Validate Quiz
     * @name ValidateQuiz
     * @route POST /api/teacher/quiz/:quizId/validate
     * @authentication Teacher
     * @description Validate quiz structure and content.
     *
     * @example
     * // Response 200 OK
     * { "valid": true, "errors": [], "warnings": [] }
     */
    this.router.post('/teacher/quiz/:quizId/validate', teacherOnly, async (req, res, next) => {
      try {
        const { quizId } = req.params;
        const quiz = this.quizService.loadQuiz(quizId);
        const result = this.quizService.validateQuiz(quiz);
        return res.json(result);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Delete Quiz
     * @name DeleteQuiz
     * @route DELETE /api/teacher/quiz/:quizId
     * @authentication Teacher
     * @description Delete quiz and all related sessions/submissions.
     *
     * @example
     * // Response 200 OK
     * { "ok": true, "message": "Quiz and all related data deleted successfully" }
     */
    this.router.delete('/teacher/quiz/:quizId', teacherOnly, async (req, res, next) => {
      try {
        // Block in demo mode
        if (this.authService.isDemoMode(req.session)) {
          throw new DemoModeRestrictionError('Deleting quizzes');
        }

        const { quizId } = req.params;
        const result = this.quizService.deleteQuiz(quizId);
        return res.json({ ok: true, ...result, message: 'Quiz and all related data deleted successfully' });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Upload Media
     * @name UploadMedia
     * @route POST /api/teacher/uploadMedia/:quizId
     * @authentication Teacher
     * @description Upload image/video file for quiz.
     *
     * @example
     * // Request: multipart/form-data with 'file' field
     *
     * @example
     * // Response 200 OK
     * { "ok": true, "filename": "image.png", "path": "quizzes/abc123/media/image.png" }
     */
    this.router.post('/teacher/uploadMedia/:quizId', teacherOnly, this.upload.single('file'), async (req, res, next) => {
      try {
        const { quizId } = req.params;
        const file = req.file;
        const result = this.mediaService.uploadMediaFile(quizId, file);
        return res.json({ ok: true, ...result });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Get Media Files
     * @name GetMediaFiles
     * @route GET /api/teacher/media/:quizId
     * @authentication Teacher
     * @description List all media files for a quiz.
     *
     * @example
     * // Response 200 OK
     * { "files": ["image1.png", "diagram.svg", "video.mp4"] }
     */
    this.router.get('/teacher/media/:quizId', teacherOnly, async (req, res, next) => {
      try {
        const { quizId } = req.params;
        const files = this.mediaService.getMediaFiles(quizId);
        return res.json({ files });
      } catch (err) {
        next(err);
      }
    });

    /**
     * Delete Media File
     * @name DeleteMediaFile
     * @route DELETE /api/teacher/media/:quizId/:filename
     * @authentication Teacher
     * @description Delete a media file.
     *
     * @example
     * // Response 200 OK
     * { "ok": true, "deleted": "image.png" }
     */
    this.router.delete('/teacher/media/:quizId/:filename', teacherOnly, async (req, res, next) => {
      try {
        const { quizId, filename } = req.params;
        const result = this.mediaService.deleteMediaFile(quizId, filename);
        return res.json(result);
      } catch (err) {
        next(err);
      }
    });

    /**
     * Serve Media File
     * @name ServeMediaFile
     * @route GET /api/img?quizId=...&filename=...
     * @description Public endpoint to serve media files.
     *
     * @example
     * // Request
     * GET /api/img?quizId=abc123&filename=diagram.png
     *
     * @example
     * // Response: Binary file content
     */
    this.router.get('/img', async (req, res, next) => {
      try {
        const { quizId, filename } = req.query;
        const filePath = this.mediaService.getMediaFile(quizId, filename);
        return res.sendFile(filePath);
      } catch (err) {
        next(err);
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = QuizRouter;

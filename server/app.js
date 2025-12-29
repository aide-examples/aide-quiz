/**
 * Quiz Application Server - Main Entry Point
 * OO-Refactored architecture with centralized error handling and logging
 */

// ==========================================
// EARLY STARTUP DIAGNOSTIC (before logger)
// ==========================================
console.log('='.repeat(60));
console.log('Quiz App Server - Starting...');
console.log('='.repeat(60));

// Load environment variables from .env file (must be first!)
require('dotenv').config();

// Show critical env vars (for debugging)
console.log('Environment Configuration:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  PORT: ${process.env.PORT || 'not set'}`);
console.log(`  HOST: ${process.env.HOST || 'not set'}`);
console.log(`  BASE_PATH: ${process.env.BASE_PATH || 'not set (root path)'}`);
console.log(`  LOG_LEVEL: ${process.env.LOG_LEVEL || 'not set (will use default)'}`);
console.log(`  CONSOLE_LOGS: ${process.env.CONSOLE_LOGS || 'not set (production: logs to files only)'}`);
console.log('');

// Load all dependencies (outside try-catch for proper scoping)
console.log('Loading dependencies...');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const BetterSqlite3Store = require('better-sqlite3-session-store')(session);
const path = require('path');
const fs = require('fs');

// Configuration
const DatabaseConfig = require('./config/database');
const Constants = require('./config/constants');

// Validation
const { ObjectValidator } = require('../shared/validation');

// Logging and Middleware
const logger = require('./utils/logger');
console.log('✓ Logger initialized');

const { correlationId, requestLogger, errorHandler } = require('./middleware');

// Utilities
const TransactionManager = require('./utils/TransactionManager');

// Repositories
const QuizRepository = require('./repositories/QuizRepository');
const SessionRepository = require('./repositories/SessionRepository');
const SubmissionRepository = require('./repositories/SubmissionRepository');

// Services
const AuthService = require('./services/AuthService');
const QuizService = require('./services/QuizService');
const SessionService = require('./services/SessionService');
const GradingService = require('./services/GradingService');
const MediaService = require('./services/MediaService');
const ExportService = require('./services/ExportService');
const SyncService = require('./services/SyncService');
const TranslationService = require('./services/TranslationService');

// Routers
const AuthRouter = require('./routers/AuthRouter');
const QuizRouter = require('./routers/QuizRouter');
const SessionRouter = require('./routers/SessionRouter');
const ResultRouter = require('./routers/ResultRouter');
const SyncRouter = require('./routers/SyncRouter');
const TestRouter = require('./routers/TestRouter');
const TranslationRouter = require('./routers/TranslationRouter');

console.log('✓ All dependencies loaded');
console.log('');
const ValidationRouter = require('./routers/ValidationRouter');

class QuizApplication {
  constructor() {
    this.app = express();
    this.db = null;
    this.setupApplication();
  }
  
  setupApplication() {
    logger.info('Starting Quiz Application initialization');
    
    // Ensure quiz directory exists
    if (!fs.existsSync(Constants.QUIZ_DIR)) {
      fs.mkdirSync(Constants.QUIZ_DIR, { recursive: true });
      logger.info('Quiz directory created', { path: Constants.QUIZ_DIR });
    }
    
    // Initialize database
    const dbConfig = new DatabaseConfig();
    this.db = dbConfig.initialize();
    logger.info('Database initialized', { path: Constants.DB_PATH });
    
    // Initialize transaction manager
    const txManager = new TransactionManager(this.db);
    logger.info('Transaction manager initialized');
    
    // Initialize validation system
    const validator = new ObjectValidator();
    logger.info('ObjectValidator initialized');
    
    // Initialize repositories
    const quizRepo = new QuizRepository(this.db, validator);
    const sessionRepo = new SessionRepository(this.db, validator);
    const submissionRepo = new SubmissionRepository(this.db, validator);
    logger.info('Repositories initialized with validation rules');
    
    // Initialize services
    const authService = new AuthService();
    const quizService = new QuizService(quizRepo, sessionRepo, submissionRepo, txManager);
    const sessionService = new SessionService(sessionRepo, quizService);
    const gradingService = new GradingService(submissionRepo, quizService, sessionService, txManager);
    const mediaService = new MediaService(quizService);
    const exportService = new ExportService(submissionRepo, sessionService, quizService);
    const syncService = new SyncService(quizRepo);
    const translationService = new TranslationService();

    // Initialize QuizValidationService (uses rules registered by QuizRepository)
    const QuizValidationService = require('./services/QuizValidationService');
    const quizValidationService = new QuizValidationService(validator);
    logger.info('QuizValidationService initialized');
    logger.info('TranslationService initialized', {
      apiKeyConfigured: !!process.env.DEEPL_API_KEY
    });
    
    // ============================================
    // MIDDLEWARE SETUP (ORDER IS IMPORTANT!)
    // ============================================
    
    // 1. Correlation ID (must be first to track all requests)
    this.app.use(correlationId);
    
    // 2. Request logging
    this.app.use(requestLogger);
    
    // 3. Body parsing
    this.app.use(bodyParser.json());
    
    // 4. Session management (with SQLite store for production)
    let sessionStore;
    try {
      // Let the library use its default table name 'sessions'
      // We renamed quiz sessions to 'quiz_sessions' to avoid conflict
      sessionStore = new BetterSqlite3Store({
        client: this.db,
        expired: {
          clear: true,
          intervalMs: 900000 // Cleanup every 15 minutes
        }
      });
      logger.info('SQLite session store initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SQLite session store, falling back to MemoryStore', { error: error.message });
      sessionStore = undefined; // Will use default MemoryStore
    }
    
    this.app.use(session({
      store: sessionStore,
      secret: Constants.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,  // Only save when modified
      name: 'quiz.sid',
      cookie: { 
        // secure: only use HTTPS cookies when actually on HTTPS
        // For local testing with NODE_ENV=production, this should be false
        secure: process.env.NODE_ENV === 'production' && process.env.USE_HTTPS !== 'false',
        httpOnly: true,           // Prevent XSS attacks
        maxAge: Constants.SESSION_MAX_AGE,
        sameSite: 'lax',          // CSRF protection
        path: Constants.BASE_PATH || '/'  // Cookie path matches BASE_PATH
      }
    }));
    
    logger.info('Session middleware configured', { 
      storeType: sessionStore ? 'SQLite' : 'MemoryStore (fallback)',
      cookieSecure: process.env.NODE_ENV === 'production' && process.env.USE_HTTPS !== 'false',
      cookiePath: Constants.BASE_PATH || '/',
      nodeEnv: process.env.NODE_ENV
    });
    
    // 5. Static file serving (with BASE_PATH support)
    const basePath = Constants.BASE_PATH;
    logger.info(`Configuring routes with BASE_PATH: "${basePath}"`);
    
    // Static files - mounted under BASE_PATH
    this.app.use(`${basePath}/quizmedia`, express.static(Constants.QUIZ_DIR));
    this.app.use(`${basePath}/shared`, express.static(path.join(__dirname, '..', 'shared')));
    this.app.use(basePath || '/', express.static(Constants.PUBLIC_DIR));
    
    // If BASE_PATH is set, redirect root to BASE_PATH
    if (basePath) {
      this.app.get('/', (req, res) => {
        res.redirect(basePath);
      });
    }
    
    // ============================================
    // ROUTERS
    // ============================================
    
    const authRouter = new AuthRouter(authService);
    const quizRouter = new QuizRouter(quizService, mediaService, authService, quizValidationService);
    const sessionRouter = new SessionRouter(sessionService, gradingService, exportService, authService);
    const resultRouter = new ResultRouter(gradingService);
    const syncRouter = new SyncRouter(syncService, authService);
    const testRouter = new TestRouter(validator);
    const translationRouter = new TranslationRouter(translationService, quizService);

    // Mount routers (with BASE_PATH)
    this.app.use(`${basePath}/api`, authRouter.getRouter());
    this.app.use(`${basePath}/api`, quizRouter.getRouter());
    this.app.use(`${basePath}/api`, sessionRouter.getRouter());
    this.app.use(`${basePath}/api`, resultRouter.getRouter());
    this.app.use(`${basePath}/api`, syncRouter.getRouter());
    this.app.use(`${basePath}/api`, testRouter.getRouter());
    this.app.use(`${basePath}/api/translate`, translationRouter.getRouter());
    
    // Validation API (for client-side rule queries)
    ValidationRouter.setValidatorInstance(validator);
    this.app.use(`${basePath}/api/validation`, ValidationRouter);
    logger.info('ValidationRouter registered');
    
    // ============================================
    // ERROR HANDLER (MUST BE LAST!)
    // ============================================
    this.app.use(errorHandler);
    
    // Sync quizzes from disk on startup
    syncService.syncOnStartup();
    
    // Store services for potential use
    this.services = {
      authService,
      quizService,
      sessionService,
      gradingService,
      mediaService,
      exportService,
      syncService
    };
    
    logger.info('Quiz Application initialization complete');
  }
  
  start() {
    const server = this.app.listen(Constants.PORT, Constants.HOST, () => {
      logger.info('═══════════════════════════════════════════════════');
      logger.info('  Quiz Application Server - READY');
      logger.info('═══════════════════════════════════════════════════');
      logger.info(`  Server:     http://${Constants.HOST}:${Constants.PORT}`);
      logger.info(`  Quizzes:    ${Constants.QUIZ_DIR}`);
      logger.info(`  Public:     ${Constants.PUBLIC_DIR}`);
      logger.info(`  Database:   ${Constants.DB_PATH}`);
      logger.info(`  Log Level:  ${process.env.LOG_LEVEL || 'debug'}`);
      logger.info(`  Node ENV:   ${process.env.NODE_ENV || 'development'}`);
      logger.info('═══════════════════════════════════════════════════');
    });
    
    // Graceful shutdown handler
    const shutdown = (signal) => {
      logger.info(`${signal} received - starting graceful shutdown`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connection
        if (this.db) {
          try {
            this.db.close();
            logger.info('Database connection closed');
          } catch (err) {
            logger.error('Error closing database', { error: err.message });
          }
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    return server;
  }
  
  getApp() { return this.app; }
  getDatabase() { return this.db; }
  getServices() { return this.services; }
}

// Create and start application
let app, server;
try {
  console.log('Creating QuizApplication instance...');
  app = new QuizApplication();
  console.log('✓ QuizApplication created');
  
  console.log('Starting server...');
  server = app.start();
  console.log('');
  console.log('='.repeat(60));
  console.log('✓ Server started successfully!');
  console.log('='.repeat(60));
} catch (err) {
  console.error('');
  console.error('='.repeat(60));
  console.error('❌ FATAL ERROR during server startup:');
  console.error('='.repeat(60));
  console.error('');
  console.error(err);
  console.error('');
  console.error('Stack trace:');
  console.error(err.stack);
  console.error('');
  
  // Try to log with logger if available
  if (logger) {
    logger.error('Server startup failed', { error: err.message, stack: err.stack });
  }
  
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception!', {
    error: err.message,
    stack: err.stack
  });
  
  // Trigger graceful shutdown
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection!', {
    reason: reason,
    promise: promise
  });
  
  // Trigger graceful shutdown
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Export for testing purposes
module.exports = app;
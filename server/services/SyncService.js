const fs = require('fs');
const path = require('path');
const Constants = require('../config/constants');
const logger = require('../utils/logger');
const { QuizNotFoundError, ValidationError } = require('../errors');

class SyncService {
  constructor(quizRepository) {
    this.quizRepo = quizRepository;
  }
  
  loadQuizFilesFromFS() {
    logger.debug('Loading quiz files from filesystem');
    
    if (!fs.existsSync(Constants.QUIZ_DIR)) {
      logger.warn('Quiz directory does not exist', { path: Constants.QUIZ_DIR });
      return [];
    }
    
    try {
      const files = fs.readdirSync(Constants.QUIZ_DIR).filter(f => f.endsWith('.json'));
      
      const quizzes = files.map(f => {
        const fullPath = path.join(Constants.QUIZ_DIR, f);
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          return {
            title: data.title || path.basename(f, '.json'),
            imagePath: data.imagePath || path.basename(f, '.json'),
            questions: Array.isArray(data.questions) ? data.questions : [],
            filename: f
          };
        } catch (err) {
          logger.error('Error loading quiz file', {
            filename: f,
            error: err.message
          });
          return null;
        }
      }).filter(q => q !== null);
      
      logger.debug('Quiz files loaded', { count: quizzes.length });
      return quizzes;
    } catch (err) {
      logger.error('Failed to read quiz directory', {
        path: Constants.QUIZ_DIR,
        error: err.message
      });
      return [];
    }
  }
  
  syncFromFilesystem() {
    logger.info('Starting filesystem sync');
    
    const quizzes = this.loadQuizFilesFromFS();
    let inserted = 0;
    let updated = 0;
    
    try {
      for (const quiz of quizzes) {
        const idFromFile = path.basename(quiz.filename, '.json');
        const mediaPath = quiz.imagePath || idFromFile;
        const exists = this.quizRepo.findByFilename(quiz.filename);
        
        if (!exists) {
          const id = idFromFile;
          this.quizRepo.create(
            id,
            quiz.title,
            quiz.filename,
            mediaPath,
            null,
            new Date().toISOString()
          );
          inserted++;
          logger.debug('Quiz inserted from FS', { id, title: quiz.title });
        } else {
          this.quizRepo.update(exists.id, quiz.title, mediaPath, exists.quiz_json);
          updated++;
          logger.debug('Quiz updated from FS', { id: exists.id, title: quiz.title });
        }
      }
      
      logger.info('Filesystem sync completed', { inserted, updated });
      
      return {
        message: `FS -> DB sync completed. ${inserted} new quizzes added, ${updated} updated.`,
        inserted,
        updated
      };
    } catch (err) {
      logger.error('Filesystem sync failed', { error: err.message });
      throw err;
    }
  }
  
  syncOnStartup() {
    logger.info('Starting startup sync', { quizDir: Constants.QUIZ_DIR });
    
    try {
      const files = fs.readdirSync(Constants.QUIZ_DIR).filter(f => f.endsWith('.json'));
      
      for (const filename of files) {
        const existing = this.quizRepo.findByFilename(filename);
        
        if (existing) {
          logger.debug('Quiz already in database', { filename });
          continue;
        }
        
        const filePath = path.join(Constants.QUIZ_DIR, filename);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const quiz = JSON.parse(content);
          const id = path.basename(filename, '.json');
          const title = quiz.title || 'Untitled';
          const mediaPath = quiz.imagePath || id;
          const createdAt = new Date().toISOString();
          
          this.quizRepo.create(id, title, filename, mediaPath, content, createdAt);
          logger.info('Quiz imported on startup', { id, title, filename });
        } catch (err) {
          logger.error('Failed to import quiz on startup', {
            filename,
            error: err.message
          });
        }
      }
      
      logger.info('Startup sync completed');
    } catch (err) {
      logger.error('Startup sync failed', { error: err.message });
      // Don't throw - app should continue even if sync fails
    }
  }
  
  exportQuizToFile(quizId) {
    logger.debug('Exporting quiz to file', { quizId });
    
    const quiz = this.quizRepo.findById(quizId);
    
    if (!quiz) {
      throw new QuizNotFoundError(quizId);
    }
    
    const quizData = quiz.quiz_json ? JSON.parse(quiz.quiz_json) : null;
    
    if (!quizData) {
      throw new ValidationError('Quiz data not available');
    }
    
    try {
      const filename = `${quiz.media_path || quizId}.json`;
      const filePath = path.join(Constants.QUIZ_DIR, filename);
      
      fs.writeFileSync(filePath, JSON.stringify(quizData, null, 2), 'utf8');
      
      logger.info('Quiz exported to file', { quizId, filename, path: filePath });
      
      return { filename, path: filePath };
    } catch (err) {
      logger.error('Quiz export to file failed', {
        quizId,
        error: err.message
      });
      throw new ValidationError('Failed to export quiz to file');
    }
  }
  
  validateQuizDirectory() {
    logger.debug('Validating quiz directory', { path: Constants.QUIZ_DIR });
    
    try {
      if (!fs.existsSync(Constants.QUIZ_DIR)) {
        fs.mkdirSync(Constants.QUIZ_DIR, { recursive: true });
        logger.info('Quiz directory created', { path: Constants.QUIZ_DIR });
      }
      
      return {
        exists: fs.existsSync(Constants.QUIZ_DIR),
        path: Constants.QUIZ_DIR
      };
    } catch (err) {
      logger.error('Failed to validate quiz directory', {
        path: Constants.QUIZ_DIR,
        error: err.message
      });
      throw err;
    }
  }
}

module.exports = SyncService;

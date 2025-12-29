const fs = require('fs');
const path = require('path');
const Constants = require('../config/constants');
const logger = require('../utils/logger');
const { ValidationError, InvalidInputError, MediaNotFoundError } = require('../errors');

class MediaService {
  constructor(quizService) {
    this.quizService = quizService;
  }
  
  uploadMediaFile(quizId, file) {
    logger.debug('Uploading media file', { quizId, filename: file?.originalname });
    
    if (!file) {
      throw new InvalidInputError('file', 'No file uploaded');
    }
    
    try {
      const mediaPath = this.quizService.getMediaPath(quizId);
      const mediaDir = path.join(Constants.QUIZ_DIR, mediaPath);
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      
      // Check current media file count
      const currentFiles = this.getMediaFiles(quizId);
      if (currentFiles.length >= Constants.UPLOAD.MAX_FILES_PER_QUIZ) {
        throw new InvalidInputError(
          'file',
          `Maximum number of media files reached (${Constants.UPLOAD.MAX_FILES_PER_QUIZ}). Please delete old files first.`
        );
      }
      
      const safeName = this.sanitizeFilename(file.originalname);
      const dst = path.join(mediaDir, safeName);
      
      // Check if file already exists
      if (fs.existsSync(dst)) {
        throw new InvalidInputError(
          'file',
          `File "${safeName}" already exists. Please choose a different name.`
        );
      }
      
      fs.writeFileSync(dst, file.buffer);
      
      logger.info('Media file uploaded', { 
        quizId, 
        filename: safeName,
        totalFiles: currentFiles.length + 1
      });
      
      return {
        path: `/quizmedia/${mediaPath}/${safeName}`,
        filename: safeName
      };
    } catch (err) {
      logger.error('Media upload failed', {
        quizId,
        filename: file?.originalname,
        error: err.message
      });
      throw err;
    }
  }
  
  getMediaFiles(quizId) {
    logger.debug('Getting media files', { quizId });
    
    const mediaPath = this.quizService.getMediaPath(quizId);
    const mediaDir = path.join(Constants.QUIZ_DIR, mediaPath);
    
    if (!fs.existsSync(mediaDir)) {
      logger.debug('Media directory does not exist', { quizId, mediaPath });
      return [];
    }
    
    try {
      const files = fs.readdirSync(mediaDir)
        .filter(f => this.isMediaFile(f))
        .map(f => {
          const filePath = path.join(mediaDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            size: stats.size,
            modified: stats.mtime,
            url: `/quizmedia/${mediaPath}/${f}`
          };
        })
        .sort((a, b) => b.modified - a.modified);
      
      logger.debug('Media files retrieved', { quizId, count: files.length });
      return files;
    } catch (err) {
      logger.error('Error reading media directory', {
        quizId,
        mediaPath,
        error: err.message
      });
      return [];
    }
  }
  
  deleteMediaFile(quizId, filename) {
    logger.debug('Deleting media file', { quizId, filename });
    
    const mediaPath = this.quizService.getMediaPath(quizId);
    const mediaDir = path.join(Constants.QUIZ_DIR, mediaPath);
    const filePath = path.join(mediaDir, filename);
    
    // Security check: prevent directory traversal
    if (!filePath.startsWith(mediaDir)) {
      logger.warn('Directory traversal attempt detected', { quizId, filename });
      throw new ValidationError('Invalid file path');
    }
    
    if (!fs.existsSync(filePath)) {
      throw new MediaNotFoundError(filename);
    }
    
    try {
      fs.unlinkSync(filePath);
      logger.info('Media file deleted', { quizId, filename });
      return { success: true };
    } catch (err) {
      logger.error('Failed to delete media file', {
        quizId,
        filename,
        error: err.message
      });
      throw new ValidationError('Failed to delete file');
    }
  }
  
  getMediaFile(quizId, filename) {
    logger.debug('Getting media file', { quizId, filename });
    
    if (!this.isImageFile(filename)) {
      throw new ValidationError('Invalid file type or extension');
    }
    
    const mediaPath = this.quizService.getMediaPath(quizId);
    const mediaDir = path.join(Constants.QUIZ_DIR, mediaPath);
    const filePath = path.join(mediaDir, filename);
    
    // Security check: prevent directory traversal
    if (!filePath.startsWith(mediaDir)) {
      logger.warn('Directory traversal attempt detected', { quizId, filename });
      throw new ValidationError('Invalid file path (Directory Traversal attempt detected)');
    }
    
    if (!fs.existsSync(filePath)) {
      throw new MediaNotFoundError(filename);
    }
    
    return filePath;
  }
  
  sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }
  
  isMediaFile(filename) {
    return Constants.ALLOWED_MEDIA_EXTENSIONS.includes(
      path.extname(filename).toLowerCase()
    );
  }
  
  isImageFile(filename) {
    return Constants.ALLOWED_IMAGE_EXTENSIONS.includes(
      path.extname(filename).toLowerCase()
    );
  }
  
  getMediaDirectory(quizId) {
    const mediaPath = this.quizService.getMediaPath(quizId);
    return mediaPath ? path.join(Constants.QUIZ_DIR, mediaPath) : null;
  }
}

module.exports = MediaService;
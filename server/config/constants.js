/**
 * Application Configuration Constants
 * Central place for all configurable values
 */

const path = require('path');

const Constants = {
  // ======================
  // FILE UPLOAD SETTINGS
  // ======================
  
  UPLOAD: {
    // Maximum file size: 10 MB
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    
    // Maximum number of media files per quiz
    MAX_FILES_PER_QUIZ: 50,
    
    // Allowed MIME types (checked first - most secure)
    ALLOWED_MIME_TYPES: [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg'
    ]
  },
  
  // ======================
  // PATHS
  // ======================
  
  QUIZ_DIR: path.join(__dirname, '../../quizzes'),
  PUBLIC_DIR: path.join(__dirname, '../../public'),
  LOGS_DIR: path.join(__dirname, '../../logs'),
  DB_PATH: path.join(__dirname, '../data.sqlite'),
  
  // ======================
  // MEDIA EXTENSIONS (Backward compatibility)
  // ======================
  
  ALLOWED_MEDIA_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.mp4',
    '.webm',
    '.ogv'
  ],
  
  ALLOWED_IMAGE_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg'
  ],
  
  // ======================
  // SESSION SETTINGS
  // ======================
  
  SESSION_SECRET: process.env.SESSION_SECRET || 'localdevsecret',
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  
  // ======================
  // AUTHENTICATION
  // ======================

  TEACHER_PASSWORD: process.env.TEACHER_PASS || 'ingo',
  BCRYPT_ROUNDS: 10,

  // Demo mode: read-only access to a specific quiz
  DEMO_PASSWORD: 'demo',
  DEMO_QUIZ_PATH: 'Unser_Erdball',
  
  // ======================
  // SERVER
  // ======================
  
  PORT: process.env.PORT || 37373,
  HOST: process.env.HOST || '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // Base path for reverse proxy setup (e.g., '/quiz-app' or '')
  // Set via environment variable BASE_PATH
  // Examples:
  //   Development: BASE_PATH='' (empty, root path)
  //   Production:  BASE_PATH='/quiz-app'
  BASE_PATH: process.env.BASE_PATH || ''
};

module.exports = Constants;
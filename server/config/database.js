/**
 * Database Configuration
 * Manages SQLite database connection and schema initialization
 */

const Database = require('better-sqlite3');
const Constants = require('./constants');

class DatabaseConfig {
  constructor(dbPath) {
    this.dbPath = dbPath || Constants.DB_PATH;
    this.db = null;
  }

  /**
   * Initialize database connection and create tables
   */
  initialize() {
    this.db = new Database(this.dbPath);
    this.createTables();
    return this.db;
  }

  /**
   * Create all required tables
   * Note: Renamed quiz sessions to 'quiz_sessions' to avoid conflict with express-session's 'sessions' table
   */
  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        title TEXT,
        filename TEXT,
        media_path TEXT,
        quiz_json TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id TEXT PRIMARY KEY,
        session_name TEXT UNIQUE,
        quiz_id TEXT,
        teacher_id TEXT,
        open_from TEXT,
        open_until TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        session_name TEXT,
        user_code TEXT,
        result_link TEXT,
        answers_json TEXT,
        score INTEGER,
        max_score INTEGER,
        created_at TEXT
      );
    `);
  }

  /**
   * Get database instance
   */
  getDB() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = DatabaseConfig;
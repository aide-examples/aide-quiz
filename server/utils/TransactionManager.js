/**
 * Transaction Manager for Better-SQLite3
 * Provides transaction support for database operations
 */

const logger = require('./logger');

class TransactionManager {
  constructor(db) {
    this.db = db;
  }

  /**
   * Execute a function within a transaction
   * Automatically commits on success, rolls back on error
   * 
   * @param {Function} fn - Function to execute (receives db as parameter)
   * @param {string} name - Transaction name for logging
   * @returns {*} Result from fn
   * 
   * @example
   * const result = txManager.transaction((db) => {
   *   repo1.create(db, ...);
   *   repo2.update(db, ...);
   *   return someValue;
   * }, 'CreateAndUpdate');
   */
  transaction(fn, name = 'Anonymous') {
    // Better-sqlite3's transaction method wraps the function
    // and handles BEGIN/COMMIT/ROLLBACK automatically
    const wrappedFn = this.db.transaction((db) => {
      logger.debug('Transaction started', { name });
      
      try {
        const result = fn(db);
        logger.debug('Transaction completed', { name });
        return result;
      } catch (error) {
        logger.error('Transaction failed - will rollback', { 
          name, 
          error: error.message 
        });
        throw error; // Re-throw to trigger rollback
      }
    });

    // Execute the wrapped transaction
    return wrappedFn(this.db);
  }

  /**
   * Execute multiple operations in a single transaction
   * Each operation is a function that receives the db instance
   * 
   * @param {Array<Function>} operations - Array of functions to execute
   * @param {string} name - Transaction name for logging
   * @returns {Array} Results from all operations
   * 
   * @example
   * const [result1, result2] = txManager.batch([
   *   (db) => repo1.create(db, ...),
   *   (db) => repo2.update(db, ...)
   * ], 'BatchOperation');
   */
  batch(operations, name = 'Batch') {
    return this.transaction((db) => {
      const results = [];
      for (let i = 0; i < operations.length; i++) {
        try {
          results.push(operations[i](db));
        } catch (error) {
          logger.error('Batch operation failed', {
            name,
            operationIndex: i,
            error: error.message
          });
          throw error;
        }
      }
      return results;
    }, name);
  }

  /**
   * Execute a read-only transaction
   * Provides the same guarantees but documents intent
   * 
   * @param {Function} fn - Function to execute
   * @param {string} name - Transaction name for logging
   * @returns {*} Result from fn
   */
  readTransaction(fn, name = 'ReadOnly') {
    logger.debug('Read-only transaction', { name });
    return this.transaction(fn, name);
  }

  /**
   * Create a transaction wrapper for a service method
   * Returns a new function that wraps the original in a transaction
   * 
   * @param {Function} method - Original method
   * @param {string} name - Transaction name
   * @returns {Function} Wrapped method
   * 
   * @example
   * class MyService {
   *   constructor(repo, txManager) {
   *     this.repo = repo;
   *     // Wrap method with transaction
   *     this.createWithValidation = txManager.wrap(
   *       this._createWithValidation.bind(this),
   *       'CreateWithValidation'
   *     );
   *   }
   *   
   *   _createWithValidation(param1, param2) {
   *     // Multiple DB operations here
   *     this.repo.create(...);
   *     this.repo.update(...);
   *   }
   * }
   */
  wrap(method, name) {
    return (...args) => {
      return this.transaction(() => {
        return method(...args);
      }, name);
    };
  }
}

module.exports = TransactionManager;
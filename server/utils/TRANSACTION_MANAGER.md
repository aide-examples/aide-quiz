# Transaction Manager

## Overview
TransactionManager provides atomic database transactions with automatic rollback on errors.

## Initialization

```javascript
const TransactionManager = require('./utils/TransactionManager');
const txManager = new TransactionManager(db);
```

## Usage

### 1. Simple Transaction

```javascript
const result = txManager.transaction((db) => {
  // All DB operations here are atomic
  repo.create(...);
  repo.update(...);
  return someValue;
}, 'TransactionName');
```

### 2. Batch Operations

```javascript
const [result1, result2] = txManager.batch([
  (db) => repo.findById(id),
  (db) => repo.update(id, data)
], 'BatchUpdate');
```

### 3. Read-Only Transactions

```javascript
const data = txManager.readTransaction((db) => {
  // Multiple reads with consistent snapshot
  const items = repo.findAll();
  const count = repo.count();
  return { items, count };
}, 'ReadData');
```

### 4. Wrapping Service Methods

```javascript
class MyService {
  constructor(repo, txManager) {
    this.repo = repo;

    // Automatically wrap method with transaction
    this.createUser = txManager.wrap(
      this._createUser.bind(this),
      'CreateUser'
    );
  }

  _createUser(userData) {
    // Multiple DB operations
    this.repo.create(userData);
    this.repo.logAction('user_created');
    return userData.id;
  }
}
```

## Advantages

- **Atomicity**: All operations or none
- **Consistency**: DB always remains in valid state
- **Performance**: Better performance through bundled commits
- **Automatic Rollback**: On any error
- **Logging**: Automatic transaction logging

## Example: GradingService

### Before (without transaction)
```javascript
submitAnswers(sessionName, userCode, answers) {
  const existing = this.submissionRepo.findBySessionAndUser(sessionName, userCode);
  if (existing) throw new DuplicateSubmissionError();

  // If another submit comes between check and create -> Race Condition!
  this.submissionRepo.create(...);
}
```

### After (with transaction)
```javascript
submitAnswers(sessionName, userCode, answers) {
  return this.txManager.transaction(() => {
    const existing = this.submissionRepo.findBySessionAndUser(sessionName, userCode);
    if (existing) throw new DuplicateSubmissionError();

    // Atomic: Check + Create in one transaction
    this.submissionRepo.create(...);
  }, 'SubmitAnswers');
}
```

## Best Practices

1. **Short Transactions**: Only DB operations in transaction
2. **No I/O**: No HTTP calls, file I/O in transactions
3. **Assign Names**: For better logging
4. **Use Read-only**: When only reading
5. **Use Batch**: For multiple independent operations

## Performance

Better-sqlite3 transactions are:
- **Very Fast**: Synchronous API without overhead
- **More Efficient**: 1 commit instead of N commits
- **Safe**: Automatic locking

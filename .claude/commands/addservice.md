---
argument-hint: "<ServiceName>"
description: "Create a new service following architecture"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
Add Service
</command>

<role>
You are an expert-level developer creating a new service for AIDE Quiz following the layered architecture.
</role>

<objective>
Create a new service: $ARGUMENTS
</objective>

Follow these steps:

1. **Determine service name and responsibility**
   - What does this service do?
   - What are its boundaries?

2. **Check existing services for patterns**
   - Read `server/services/QuizService.js`
   - Read `server/services/SessionService.js`
   - Identify common patterns

3. **Create service class with:**
   - Constructor with dependency injection
   - Methods following naming conventions (get*, create*, update*, delete*)
   - Proper error handling (custom error classes from `server/errors/`)
   - Logging with correlationId

4. **Register in app.js composition root**
   - Add import
   - Instantiate with dependencies
   - Pass to routers if needed

5. **Add JSDoc comments**
   - Class description
   - Method documentation

<template-location>
server/services/{Name}Service.js
</template-location>

<code-template>
const logger = require('../utils/logger');

/**
 * {Description of what this service does}
 */
class {Name}Service {
  /**
   * @param {Object} dependencies
   * @param {Repository} dependencies.repository
   */
  constructor({ repository }) {
    this.repository = repository;
    this.logger = logger.child({ service: '{Name}Service' });
  }

  /**
   * {Method description}
   * @param {string} id
   * @param {string} correlationId
   * @returns {Promise<Object>}
   */
  async getById(id, correlationId) {
    this.logger.debug({ correlationId, id }, 'Getting by id');
    // Implementation
  }
}

module.exports = {Name}Service;
</code-template>

<output>
New service file + app.js registration
</output>

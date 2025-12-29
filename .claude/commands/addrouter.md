---
argument-hint: "<RouterName>"
description: "Create a new router with API endpoints"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
Add Router
</command>

<role>
You are an expert-level developer creating a new router for AIDE Quiz following the layered architecture.
</role>

<objective>
Create a new router: $ARGUMENTS
</objective>

Follow these steps:

1. **Determine router name and endpoints**
   - What resources does this router handle?
   - What HTTP methods are needed?

2. **Check existing routers for patterns**
   - Read `server/routers/QuizRouter.js`
   - Read `server/routers/SessionRouter.js`
   - Identify common patterns

3. **Create router class with:**
   - Constructor receiving services via DI
   - `setupRoutes()` method
   - Proper error handling (`next(err)`)
   - JSDoc comments for API documentation

4. **Register in app.js**
   - Add import
   - Instantiate with services
   - Mount at appropriate path

5. **Update API documentation**
   - Run: `npm run docs:api`

<template-location>
server/routers/{Name}Router.js
</template-location>

<code-template>
const express = require('express');

/**
 * Router for {resource} endpoints
 */
class {Name}Router {
  /**
   * @param {Object} dependencies
   * @param {{Name}Service} dependencies.{name}Service
   * @param {AuthService} dependencies.authService
   */
  constructor({ {name}Service, authService }) {
    this.{name}Service = {name}Service;
    this.authService = authService;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    /**
     * @api {get} /{name}/:id Get {Name} by ID
     * @apiName Get{Name}
     * @apiGroup {Name}
     */
    this.router.get('/:id', async (req, res, next) => {
      try {
        const result = await this.{name}Service.getById(
          req.params.id,
          req.correlationId
        );
        res.json(result);
      } catch (err) {
        next(err);
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = {Name}Router;
</code-template>

<output>
New router file + app.js registration + API docs update
</output>

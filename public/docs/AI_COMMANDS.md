# AI Commands (Makros)

Custom slash commands for Claude Code. Each command is a shortcut for a specific workflow.

> **Usage:** Type `/commandname` in the chat to execute

---

## Available Commands

### Session Management

| Command | Purpose |
|---------|---------|
| `/start` | Begin session - check changes, read docs, establish context |
| `/focus <topic>` | Set the focus for this session |

### Development

| Command | Purpose |
|---------|---------|
| `/newfeature` | Plan a new feature with full workflow |
| `/addservice` | Create a new service following architecture |
| `/addrouter` | Create a new router with endpoints |
| `/document` | Update documentation after changes |
| `/review` | Review code for architecture compliance |

### Analysis

| Command | Purpose |
|---------|---------|
| `/explain <code>` | Explain source code (WHAT, WHY, CRUX) |
| `/five-whys <problem>` | Root-cause analysis for bugs/issues |

### Meta

| Command | Purpose |
|---------|---------|
| `/sync-commands` | Regenerate `.claude/commands/` from this file |

After editing this file, run `/sync-commands` to update the technical command files.

---

## Command Definitions

### /start

```
Begin a new working session - establish context.

Steps:
1. Check git status and recent commits
2. Identify uncommitted changes
3. Ask: "Hast du zwischen den Sessions Änderungen gemacht?"
4. Re-read key documentation:
   - INDEX.md (structure)
   - ARCHITECTURE_REVIEW.md (TODOs)
   - AI_WORKFLOW.md (rules)
5. Summarize current state
6. Ask for session focus

Output: Project status summary + prompt for focus
```

### /focus

```
Set the focus for this working session.

Usage: /focus <topic description>

Examples:
- /focus i18n - Polyglot.js Integration
- /focus Security - Rate Limiting
- /focus Bug - Session-Cookie Problem

Steps:
1. Parse the focus topic
2. Search codebase for related code
3. Read relevant documentation
4. Summarize current state of this area
5. Propose approach and tasks
6. Ask clarifying questions

Output: Context summary + proposed tasks + questions
```

### /newfeature

```
Plan and implement a new feature.

Steps:
1. Understand the requirement - ask clarifying questions
2. Search for similar existing code (Grep, Read)
3. Identify affected files and architectural impact
4. Present a plan with:
   - New files to create
   - Existing files to modify
   - Dependencies needed
   - Potential risks
5. WAIT for explicit approval before coding
6. Implement following the approved plan
7. Update documentation if needed

Output: Implementation plan for user approval
```

### /addservice

```
Create a new service following the layered architecture.

Steps:
1. Determine service name and responsibility
2. Check existing services for patterns (QuizService, SessionService)
3. Create service class with:
   - Constructor with dependency injection
   - Methods following naming conventions
   - Proper error handling (custom error classes)
   - Logging with correlationId
4. Register in app.js composition root
5. Add JSDoc comments

Template:
- Location: server/services/{Name}Service.js
- Dependencies: Inject via constructor
- Errors: Use classes from server/errors/
- Logging: Use logger from server/utils/logger.js

Output: New service file + app.js registration
```

### /addrouter

```
Create a new router with API endpoints.

Steps:
1. Determine router name and endpoints
2. Check existing routers for patterns (QuizRouter, SessionRouter)
3. Create router class with:
   - Constructor receiving services via DI
   - setupRoutes() method
   - Proper error handling (next(err))
   - JSDoc comments for API documentation
4. Register in app.js
5. Run: npm run docs:api to update API_REFERENCE.md

Template:
- Location: server/routers/{Name}Router.js
- Pattern: Class with getRouter() method
- Auth: Use authService.requireTeacher() for protected routes
- Errors: Let errors bubble up via next(err)

Output: New router file + app.js registration + API docs update
```

### /document

```
Update documentation after code changes.

Steps:
1. Identify what changed (new features, modified behavior)
2. Update relevant docs:
   - API_REFERENCE.md: Run npm run docs:api
   - DEVELOPMENT_GUIDELINES.md: If new patterns added
   - Specialized docs: ERROR_HANDLING, LOGGING, SECURITY, etc.
3. Check INDEX.md for completeness
4. Update Document Status table if needed

Output: Updated documentation files
```

### /review

```
Review code for architecture compliance.

Checklist:
- [ ] Layered architecture respected (Router → Service → Repository)
- [ ] No SQL in Services
- [ ] No business logic in Routers
- [ ] Dependencies injected via constructor
- [ ] Custom error classes used
- [ ] Logging includes correlationId
- [ ] Input validation present
- [ ] Naming conventions followed
- [ ] No commented-out code
- [ ] JSDoc comments for public methods

Output: Review report with findings and suggestions
```

### /explain

```
Explain source code using WHAT, WHY, CRUX structure.

Usage: /explain <file:line, function name, or code reference>

Examples:
- /explain server/services/GradingService.js:calculateScore()
- /explain QuizRouter.getRouter
- /explain the auth middleware

Steps:
1. Locate the referenced code
2. Analyze functionality and context
3. Produce structured explanation

Output Template:
Explanation of: **[reference]**

⚪ **WHAT**: [Functionality - what the code does]

🔵 **WHY**: [Rationale - why it exists, what problem it solves]

🟠 **CRUX**: [Optional - domain-specific gotcha or important detail]
```

### /five-whys

```
Root-cause analysis using the Five-Whys technique.

Usage: /five-whys <problem or bug description>

Examples:
- /five-whys Session cookie not persisting after login
- /five-whys Quiz submission fails intermittently
- /five-whys Translations not loading in production

Steps:
1. Start with the problem statement
2. Check sources for initial hints
3. Perform analysis iterations:
   a. Ask "Why did this happen?" and document answer
   b. For each answer, ask "Why?" again
   c. Continue for 5+ iterations or until root-cause found
4. Validate by working backwards through causality chain
5. Propose solutions with concrete code changes

Notes:
- Don't stop at symptoms, dig for systemic issues
- Multiple root-causes may exist - explore branches
- The magic is NOT in exactly 5 "Why" - stop at root-cause
- Consider technical, process, and organizational causes

Output: WHY chain → Root Cause → Validation → Proposed Solution
```

---

## Adding New Commands

To add a new command:

1. Add a section below with `### /commandname`
2. Define the workflow in a code block
3. Include: Steps, Template (if applicable), Expected Output
4. Claude will generate the technical file in `.claude/commands/`

---

## For Students

These commands demonstrate **prompt engineering** - the art of giving AI clear, structured instructions:

- **Explicit steps** reduce ambiguity
- **Templates** ensure consistency
- **Checklists** prevent oversights
- **Expected outputs** set clear goals

You can create your own commands for repetitive tasks in any AI-assisted workflow.

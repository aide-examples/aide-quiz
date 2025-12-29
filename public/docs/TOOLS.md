# Development Tools

Tools for documentation generation, validation, and quality assurance.

> **AI Integration:** Tools that generate files must be registered in `.claude/RULES.md` so Claude Code knows not to edit generated files directly.

## jsdoc-to-markdown

Generates API documentation from JSDoc comments in router files.

### Installation

```bash
cd server
npm install --save-dev jsdoc-to-markdown
```

### Package.json Script

```json
{
  "scripts": {
    "docs:api": "jsdoc2md routers/*.js > ../public/docs/API_REFERENCE.md"
  }
}
```

### Usage

```bash
cd server
npm run docs:api
```
or

```bash
cd server
npx jsdoc2md router/*
```

This regenerates `public/docs/API_REFERENCE.md` from JSDoc comments.

### JSDoc Comment Format

Add these comments above route handlers in `server/routers/*.js`:

```javascript
/**
 * @api {post} /api/teacher/login Teacher Login
 * @apiDescription Authenticate as teacher
 * @apiGroup Authentication
 *
 * @apiBody {String} password Teacher password
 *
 * @apiSuccess {Boolean} ok=true Login successful
 * @apiError {401} InvalidCredentials Wrong password
 *
 * @example
 * // Request
 * POST /api/teacher/login
 * { "password": "secret" }
 *
 * // Response 200
 * { "ok": true }
 */
router.post('/teacher/login', async (req, res, next) => { ... });
```

### Common Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@api` | Method and endpoint | `@api {get} /api/quizzes` |
| `@apiDescription` | What it does | `@apiDescription List all quizzes` |
| `@apiGroup` | Category | `@apiGroup Quiz` |
| `@apiBody` | Request body param | `@apiBody {String} title Quiz title` |
| `@apiParam` | URL parameter | `@apiParam {String} id Quiz ID` |
| `@apiQuery` | Query parameter | `@apiQuery {Number} limit Max results` |
| `@apiSuccess` | Success response | `@apiSuccess {Object[]} quizzes List` |
| `@apiError` | Error response | `@apiError {404} NotFound Quiz not found` |
| `@example` | Code example | Request/response examples |

### Workflow

1. Add/update JSDoc comments in router files
2. Run `npm run docs:api`
3. Commit both router changes and regenerated API_REFERENCE.md

---

## Validation Scripts

Quality checks that run automatically or on demand.

### validate-docs-list.js

Ensures all documentation files are indexed for search.

**Location:** `server/scripts/validate-docs-list.js`

**What it checks:**
- All `.md` files in `/public/docs/` are listed in `DOCS_FILE_LIST`
- No orphaned entries in the list (files that don't exist)

**Usage:**
```bash
cd server
npm run validate
```

**Output on error:**
```
❌ Files in /public/docs/ but NOT in DOCS_FILE_LIST:
   - NEW_FILE.md

   → Add to: public/help/TechDocsModal.js
```

---

## Git Hooks

Pre-commit hooks prevent commits that break quality standards.

**Location:** `.githooks/`

### Setup

```bash
git config core.hooksPath .githooks
```

### Active Hooks

| Hook | Runs | Blocks commit if |
|------|------|------------------|
| `pre-commit` | `validate-docs-list.js` | Docs not in search index |
| `pre-commit` | `npm run docs:api` | Router changed but API_REFERENCE.md not staged |

**Router Change Detection:**

When committing changes to `server/routers/*.js`, the hook automatically:
1. Regenerates `API_REFERENCE.md` from JSDoc comments
2. Checks if the regenerated file differs from staged version
3. Blocks commit if API docs need updating but aren't staged

### Adding New Hooks

1. Create script in `.githooks/` (e.g., `pre-push`)
2. Make executable: `chmod +x .githooks/pre-push`
3. Document in this file

---

## Metrics & Reporting

### generate-metrics.js

Generates [PROJECT_METRICS.md](PROJECT_METRICS.md) with codebase statistics.

**Location:** `server/scripts/generate-metrics.js`

**What it generates:**
- LOC breakdown by layer (server) and area (public)
- Top 10 largest files
- File size distribution

**Usage:**
```bash
cd server
npm run metrics
```

**When to run:**
- After major refactorings
- Before architecture reviews
- When onboarding new developers

### Quick Counts (Shell)

For quick ad-hoc checks:

```bash
# Total JS lines (excluding vendor/node_modules)
find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/vendor/*" | xargs wc -l | tail -1

# Count by area
echo "Server:" && find server -name "*.js" -not -path "*/node_modules/*" | xargs wc -l | tail -1
echo "Public:" && find public -name "*.js" -not -path "*/vendor/*" | xargs wc -l | tail -1

# File counts
find public -name "*.js" -not -path "*/vendor/*" | wc -l
find server -name "*.js" -not -path "*/node_modules/*" | wc -l
```

### Documentation Coverage

Check which docs exist vs. are indexed for search:
```bash
cd server && npm run validate
```

---

## Future Tools

Planned additions:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Test Coverage** - Jest coverage reporting

---

*See [TESTING](TESTING.md) for test setup, [DEVELOPMENT_GUIDELINES](DEVELOPMENT_GUIDELINES.md) for code standards*

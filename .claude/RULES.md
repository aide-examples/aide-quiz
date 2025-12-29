# Rules for Claude Code

Critical rules that must be followed in every session.

## Generated Files - DO NOT EDIT

These files are auto-generated. Edit the source, then regenerate.

| File | Generator | Command |
|------|-----------|---------|
| `public/docs/API_REFERENCE.md` | jsdoc-to-markdown | `cd server && npm run docs:api` |
| `public/docs/PROJECT_METRICS.md` | generate-metrics.js | `cd server && npm run metrics` |

**Workflow for generated files:**
1. Edit the source (e.g., JSDoc comments in `server/routers/*.js`)
2. Run the generator command
3. Commit both source and generated file together

**See:** [TOOLS.md](../public/docs/TOOLS.md) for full documentation of generators.

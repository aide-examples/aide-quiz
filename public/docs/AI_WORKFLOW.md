# AI-Assisted Development Workflow

This document describes how we work with Claude Code on AIDE Quiz. It serves both as:
- **Instructions for Claude** - The AI reads and follows these guidelines
- **Learning material for students** - Understanding AI-assisted software development

> **Coding standards:** [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md)
> **Custom commands:** [AI_COMMANDS.md](AI_COMMANDS.md)

---

## 1. Planning Over Speed

**The user prioritizes careful planning and consensus over fast code generation.**

### Workflow for Code Changes

1. **Understand** - Ask clarifying questions if anything is unclear
2. **Explore** - Find existing similar code, understand patterns
3. **Propose** - Present a plan with options, list affected files
4. **Wait for approval** - NEVER start coding without explicit GO
5. **Implement** - Follow approved plan, ask if issues arise

### When to Use EnterPlanMode

- Complex features touching multiple files
- Architectural decisions needed
- Multiple valid approaches exist
- Anything beyond trivial bug fixes

### Example

```
User: "Add translation feature"

❌ DON'T: Immediately start writing TranslationService.js

✅ DO: "Let me explore how translations could work. I'll check:
1. Existing API integrations
2. Where quiz data is loaded
3. Language handling patterns
Then I'll propose an approach for your approval."
```

---

## 2. Language Policy

| Context | Language |
|---------|----------|
| **Communication with user** | German |
| **Code** (variables, functions) | English |
| **Comments** | English |
| **Documentation** (*.md) | English |
| **Commit messages** | English |
| **Log messages** | English |

```javascript
// ❌ WRONG
// Lade das Quiz und validiere die Eingabe
function ladeQuiz(quizId) { ... }

// ✅ CORRECT
// Load quiz and validate input
function loadQuiz(quizId) { ... }
```

When discussing with user (in German):
> "Ich werde jetzt eine `loadQuiz()` Funktion erstellen..."

---

## 3. Code Exploration First

**Always explore existing patterns before implementing new features.**

1. **Search for similar code** - Use `Grep` to find similar services/components
2. **Study existing implementations** - Use `Read` to understand patterns
3. **Match existing style** - Variable naming, function structure, imports

```javascript
// DON'T: Just use console.log
console.log('Translation done');

// DO: First check how other services log, then match
const logger = require('../utils/logger');
logger.info('Translation completed', { quizId, targetLang });
```

---

## 4. Reference Documentation

All coding standards are defined in the documentation:

| Topic | Document |
|-------|----------|
| Architecture, Conventions, Best Practices | [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) |
| Error Classes & Handler | [ERROR_HANDLING.md](ERROR_HANDLING.md) |
| Logging & Correlation IDs | [LOGGING.md](LOGGING.md) |
| Security Measures | [SECURITY.md](SECURITY.md) |
| UI Design Patterns | [UI_GUIDELINES.md](UI_GUIDELINES.md) |
| External Libraries | [EXTERNAL_LIBS.md](EXTERNAL_LIBS.md) |
| Data Model & Storage | [DATA.md](DATA.md) |

---

## 5. Working Notes for Large Refactorings

Before starting a multi-step refactoring, decide: **Document or One-Shot?**

| Type | When | Where |
|------|------|-------|
| **Permanent** | Historical interest, reusable engineering knowledge | `public/docs/` |
| **Temporary** | One-shot cleanup, no future value | `.claude/notes/` |

### Temporary Working Notes

For large refactorings that span multiple sessions but don't need permanent documentation:

1. **Create** a note in `.claude/notes/` (e.g., `REFACTORING_ES_MODULES.md`)
2. **Content**: Plan, current status, next steps - minimal, not polished
3. **Read** at session start via `/start` command
4. **Delete** when refactoring is complete

```markdown
# Refactoring: ES Modules Migration

## Plan
1. common/ → ES Modules with legacy support
2. stats/ → Pilot (full conversion)
3. result/, quiz/, editor/ → One by one
4. Remove legacy support from common/

## Current Status
✅ common/ done
🔄 stats/ in progress - StatsPage class created
⬚ result/, quiz/, editor/

## Next Steps
- Finish stats/js/StatsPage.js
- Update stats/index.html
```

### Why This Matters

- **Session independence**: AI context can be lost (token limits, crashes)
- **Resumability**: New session can pick up where we left off
- **No pollution**: Temporary notes don't clutter final documentation

---

## For Students: Why This Document?

This project is part of the **AIDE Series** (AI for Development Engineers). The goal is to teach software development through AI collaboration.

**Key insight:** Working with AI requires explicit, structured communication:
- Clear workflow agreements (Section 1)
- Language conventions (Section 2)
- Pattern recognition habits (Section 3)

The AI reads this document at the start of each session. By making these "instructions" transparent, students can:
1. Understand how to effectively communicate with AI assistants
2. See what conventions lead to consistent results
3. Adapt these patterns for their own projects

---

**Remember: Code consistency > Quick implementation**

Taking 5 minutes to study existing patterns saves hours of refactoring later.

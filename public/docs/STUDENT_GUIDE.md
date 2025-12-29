# Getting Started with AIDE Quiz

This guide helps you start working with AIDE Quiz and Claude Code, tailored to your experience level.

---

## Before You Start

| Option | Description |
|--------|-------------|
| **Try it online** | [Live Demo](https://followthescore.org/aide-quiz) — no installation needed |
| **Run locally** | [Local Setup Guide](LOCAL_SETUP.md) — full development environment |

---

## Choose Your Path

| Level | Description | Start Here |
|-------|-------------|------------|
| **A** | Programming beginner | [Path A](#path-a-beginners) |
| **B** | CS student (4th semester) | [Path B](#path-b-cs-students) |
| **C** | Developer, new to AI coding tools | [Path C](#path-c-practitioners) |
| **D** | Experienced dev, skeptical of AI | [Path D](#path-d-skeptics) |

---

## Path A: Beginners

**Your situation:** You can read code but struggle to write 20 lines without errors.

**Key insight:** Claude Code is your *pair programmer*, not a magic wand. You guide, it types.

**To Do:** play with the system online, read the technical doc - which is also part of the system. Then move on to make a local installation on your laptop so that you can tinker with it.

### Setup

Follow the [Local Setup Guide](LOCAL_SETUP.md) — it walks you through every step.

### First Session
```bash
claude
/start
```

Then ask in plain language:
> "Explain what server/app.js does, step by step"

### Your Learning Loop
1. **Read** existing code with `/explain`
2. **Ask** "why" questions ("Why is there a separate service layer?")
3. **Watch** Claude make small changes
4. **Understand** before moving on

### Don't
- Ask Claude to "build feature X" without understanding the codebase
- Accept code you don't understand
- Skip the documentation

---

## Path B: CS Students

**Your situation:** You know OOP, databases, HTTP. You've built small projects.

**Key insight:** This project demonstrates *professional patterns* you'll see in industry.

### Focus Areas
| Pattern | Where to Find |
|---------|---------------|
| Layered Architecture | `Router → Service → Repository` |
| Dependency Injection | Constructor injection everywhere |
| Error Handling | `server/errors/`, `errorHandler.js` |
| Validation | `shared/validation/` (isomorphic!) |

### Recommended Reading Order
1. `DEVELOPMENT_GUIDELINES.md` - Architecture principles
2. `FUNCTIONS.md` - Request flow explained
3. `ERROR_HANDLING.md` - Exception patterns

### Exercise Progression
1. Add Health-Check endpoint (15 min)
2. Add a new validator to `ObjectValidator.js`
3. Create new router with `/addrouter`
4. Plan a feature with `/newfeature`

### Commands to Master
```bash
/start          # Begin session with context
/focus <topic>  # Deep-dive into area
/explain <file> # Understand existing code
/review         # Check architecture compliance
```

---

## Path C: Practitioners

**Your situation:** 3+ years experience, used ChatGPT for code snippets, never integrated AI into workflow.

**Key insight:** Claude Code ≠ ChatGPT. It sees your files, runs commands, and follows project conventions.

### What's Different
| ChatGPT | Claude Code |
|---------|-------------|
| Copy-paste snippets | Edits files directly |
| Generic answers | Reads YOUR codebase |
| No context | Maintains session context |
| You adapt code | Code follows YOUR patterns |

### Quick Start
```bash
claude
/start                    # Loads project context
/focus Rate-Limiting      # Sets topic with relevant files
```

Then work iteratively:
> "Show me how authentication works in this project"
> "What patterns should I follow for a new endpoint?"
> "Implement rate limiting following existing patterns"

### The Workflow (AI_WORKFLOW.md)
1. **Understand** - Ask before coding
2. **Explore** - Find similar existing code
3. **Propose** - Claude suggests, you approve
4. **Implement** - Only after explicit GO

### Pro Tips
- Use `/review` after changes
- Use `/document` to update docs
- Check `git diff` before committing

---

## Path D: Skeptics

**Your situation:** You've tried AI coding and got verbose, redundant, unstructured garbage.

**Key insight:** "Vibe coding" fails. *Constrained AI* with architecture rules succeeds.

### Why AIDE Quiz is Different

This project was built *with* Claude, not *by* Claude blindly. The difference:

| Vibe Coding | AIDE Approach |
|-------------|---------------|
| "Build me a quiz app" | "Follow DEVELOPMENT_GUIDELINES.md" |
| AI decides architecture | Architecture is documented, AI follows |
| No code review | `/review` checks compliance |
| Generic patterns | Project-specific conventions |
| One-shot generation | Iterative, approved changes |

### Evidence in This Codebase
- **Consistent naming** - Check any 3 services, same patterns
- **DI everywhere** - No hidden singletons
- **Thin routers** - Business logic in services
- **Shared validation** - Same code client/server

### Try This Experiment
```bash
claude
/focus Validation
```

Then:
> "Show me how validation works across client and server"

Note: Claude will reference *existing* `ObjectValidator.js`, not generate a new one.

### Commands That Enforce Quality
```bash
/review         # Architecture compliance check
/explain <file> # Forces reading before writing
/newfeature     # Planning before implementation
```

### The Contract
Read `AI_WORKFLOW.md` - it tells Claude:
- Never code without approval
- Match existing patterns
- Explore before implementing

You control the quality. Claude amplifies your standards.

---

## Universal Principles

Regardless of your level:

1. **Planning > Speed** - Understanding first, code second
2. **Read existing code** - Use `/explain` liberally
3. **Small iterations** - One change, verify, next change
4. **Documentation is code** - Keep it updated with `/document`

---

## Next Steps

| Action | Command |
|--------|---------|
| Start session | `/start` |
| Set focus | `/focus <topic>` |
| Understand code | `/explain <file>` |
| Check quality | `/review` |
| Update docs | `/document` |

Finally go through the [EXERCICES](EXERCICES.md).
If you are brave, implement some of the [CHANGE REQUESTS](REQUESTS.md)

---

*Questions? Start Claude Code and ask.*

# Quiz App - Technical Documentation

Welcome to the technical documentation of AIDE Quiz!

AIDE Quiz is part of the **[AIDE Series (Artificial Intelligence for Development Engineers)](aide/AIDE.md)**. This means:

- AIDE Quiz and the documentation were developed almost entirely with *Anthropic Claude*, not through manual coding, but through dialog sessions with AI.
- Based on our experience we recommend to work on eyes level partnership with AI agents. There is no reason for us humans to be hubris or afraid, not least because we can also laugh about this new world of AI co-working!
![](/docs/Umtausch.jpg)
*The exchange wave is rolling in*
---

## 1. Introduction

**[RATIONALE](RATIONALE.md)** - Platform selection
- Potential Platforms for a Quiz App (WordPress, MediaWiki, Moodle)
- Architectural Freedom vs. Plugin Constraints
- Educational Goals of AIDE Quiz (see also [Practice Exercises](EXERCISES.md))

---

## 2. Getting Started

**[DEVELOPMENT GUIDELINES](DEVELOPMENT_GUIDELINES.md)** - Start here!
- Architecture Principles (Layered Architecture, DI)
- Code Conventions (Naming, File Organization)
- Best Practices (KISS, DRY, YAGNI)

**[LOCAL SETUP](LOCAL_SETUP.md)** - Development Environment
- Windows + WSL installation
- Node.js and Claude Code setup
- Quick start for experienced developers

**[QUICK REFERENCE](QUICK_REFERENCE.md)** - Cheat Sheet
- Repository Structure
- Important Files & Commands
- Quick Fixes for Common Problems

---

## 3. Architecture

### 3.1 System Architecture

**[DATA ARCHITECTURE](DATA.md)** - Data Model & Storage
- **Logical View:** Entity-Relationship model (Quiz, Question, Option, Session, Submission)
- **User View:** How data appears in UI
- **Physical View:** Hybrid storage (SQLite tables + JSON BLOBs + Filesystem)

**[FUNCTIONAL ARCHITECTURE](FUNCTIONS.md)** - System Functions
- Layered Architecture (Router → Service → Repository)
- Component Responsibilities
- Request/Response Flow

**[INTERNATIONALIZATION](INTERNATIONALIZATION.md)** - Multi-Language Support
- Runtime Translation (Google)
- Special service (DeepL) for translation of quizzes
- i18n Architecture for our own UI elements (Polyglot.js)

### 3.2 Dependencies

**[EXTERNAL DEPENDENCIES](EXTERNAL_LIBS.md)** - Third-Party Libraries
- Client vs Server: Two different approaches
- Client: Vendored libraries (`/public/vendor/`)
- Server: npm packages (`server/package.json`)

---

## 4. Development

### 4.1 Code Quality

**[TESTING](TESTING.md)** - Test Strategy
- Unit Tests, Integration Tests
- Test Coverage Goals
- Running Tests

**[ERROR HANDLING](ERROR_HANDLING.md)** - Exception Management
- Client: Toast Notifications, Fetch Wrapper, Retry Mechanism
- Server: Custom Error Classes, Central Error Handler

**[LOGGING](LOGGING.md)** - Observability
- Logging on the Client
- Logging on the Server (Winston, Correlation IDs, Log Levels & Rotation)

**[TOOLS](TOOLS.md)** - Development Tools
- jsdoc-to-markdown for API docs
- Documentation generation workflow

### 4.2 Security

**[SECURITY](SECURITY.md)** - Security Measures
- Authentication & Authorization
- Input Validation & Sanitization
- SQL Injection & XSS Prevention
- Rate Limiting (planned)

---

## 5. User Interface

**[UI GUIDELINES](UI_GUIDELINES.md)** - Design Principles
- CSS Architecture (Modular CSS)
- Component Patterns
- Responsive Design

**[ACCESSIBILITY](ACCESSIBILITY.md)** - Inclusive Design
- WCAG Compliance Goals
- Keyboard Navigation
- Screen Reader Support

---

## 6. API & Integration

**[API REFERENCE](API_REFERENCE.md)** - REST Endpoints *(generated)*
- Generated from JSDoc comments via `jsdoc-to-markdown`
- Run `npm run docs:api` to regenerate
- Authentication, Quiz, Session, Media APIs

---

## 7. Deployment & Operations

**[DEPLOYMENT](DEPLOYMENT.md)** - Production Setup
- Server Configuration
- nginx Reverse Proxy
- systemd Service Management
- SSL with Let's Encrypt

---

## 8. Project Management

**[ARCHITECTURE REVIEW](ARCHITECTURE_REVIEW.md)** - Status & Roadmap
- Current Architecture Score
- Prioritized TODO List
- Planning for Next Sessions

**[REQUESTS](REQUESTS.md)** - Feature Backlog
- Planned Functional Extensions
- UI/UX Improvements

---

## 9. Reports

**[PROJECT METRICS](PROJECT_METRICS.md)** - Statistics
- Code Statistics & File Counts
- Quality Indicators

---

## 10. AI-Assisted Development

This project is developed using **Claude Code** as an AI pair programmer.

**[STUDENT GUIDE](STUDENT_GUIDE.md)** - Getting Started (by experience level)
- Path A: Programming beginners
- Path B: CS students (4th semester)
- Path C: Practitioners new to AI tools
- Path D: Experienced devs, skeptical of AI

**[AI WORKFLOW](AI_WORKFLOW.md)** - Human-AI Collaboration
- Planning Over Speed philosophy
- Language Policy (German/English)
- Code Exploration patterns

**[AI COMMANDS](AI_COMMANDS.md)** - Custom Slash Commands
- `/newfeature`, `/addservice`, `/addrouter`
- Prompt engineering examples
- Creating your own commands

**[EXERCISES](EXERCISES.md)** - Practice Tasks
- Hands-on exercises for learning with AI
- Code exploration, tracing, small extensions

---

## Tech Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Node.js + Express | Web Framework |
| | SQLite (better-sqlite3) | Embedded Database |
| | Winston | Logging |
| | bcrypt | Password Hashing |
| **Frontend** | Vanilla JavaScript | No Framework Overhead |
| | Marked.js | Markdown Rendering |
| | Mermaid.js | UML Diagrams |
| | Polyglot.js | Internationalization |
| **Infrastructure** | nginx | Reverse Proxy |
| | systemd | Service Management |
| | Let's Encrypt | SSL Certificates |

---

## For Students

This project demonstrates professional software architecture patterns:

| Pattern | Implementation |
|---------|---------------|
| **Layered Architecture** | Router → Service → Repository |
| **Dependency Injection** | Constructor injection for testability |
| **Repository Pattern** | Data access abstraction |
| **Service Pattern** | Business logic orchestration |
| **Error Handling** | Custom errors + central handler |
| **Validation** | Shared validation (client & server) |

**Details:** [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) (principles & conventions)

---

## Document Status

| Document | Status |
|----------|--------|
| RATIONALE | Complete |
| DEVELOPMENT_GUIDELINES | Complete |
| LOCAL_SETUP | Complete |
| QUICK_REFERENCE | Complete |
| DATA | Complete |
| FUNCTIONS | Complete |
| INTERNATIONALIZATION | Complete |
| EXTERNAL_LIBS | Complete |
| DEPLOYMENT | Complete |
| ARCHITECTURE_REVIEW | Complete |
| PROJECT_METRICS | Complete |
| REQUESTS | Complete |
| TESTING | Complete |
| ERROR_HANDLING | Complete |
| LOGGING | Complete |
| TOOLS | Complete |
| SECURITY | Complete |
| UI_GUIDELINES | Complete |
| AI_WORKFLOW | Complete |
| AI_COMMANDS | Complete |
| STUDENT_GUIDE | Complete |
| EXERCISES | Complete |
| ACCESSIBILITY | *Planned* |
| API_REFERENCE | *Generated* |

---

*Last updated: 2024-12-25*

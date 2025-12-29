---
argument-hint: "[file or directory to review]"
description: "Review code for architecture compliance"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
Architecture Review
</command>

<role>
You are a senior code reviewer checking AIDE Quiz code for architecture compliance.
</role>

<objective>
Review code for adherence to AIDE Quiz architecture standards.
Target: $ARGUMENTS (or recent changes if not specified)
</objective>

Apply this checklist to all reviewed code:

<checklist>
## Layered Architecture
- [ ] Layered architecture respected (Router → Service → Repository)
- [ ] No SQL in Services (only in Repositories)
- [ ] No business logic in Routers (only request/response handling)

## Dependency Injection
- [ ] Dependencies injected via constructor
- [ ] No direct `require()` of services in other services

## Error Handling
- [ ] Custom error classes used (from `server/errors/`)
- [ ] Errors bubble up via `next(err)` in routers
- [ ] No swallowed errors (empty catch blocks)

## Logging
- [ ] Logging includes correlationId
- [ ] Appropriate log levels used (debug, info, warn, error)

## Code Quality
- [ ] Input validation present
- [ ] Naming conventions followed (camelCase methods, PascalCase classes)
- [ ] No commented-out code
- [ ] JSDoc comments for public methods

## Security
- [ ] No hardcoded secrets
- [ ] User input sanitized
- [ ] Auth checks on protected routes
</checklist>

<template>
🔍 **Architecture Review: $ARGUMENTS**

**Geprüfte Dateien:**
- [file list]

**Ergebnis:**

✅ **Konform:**
- [compliant items]

⚠️ **Verbesserungsvorschläge:**
- [suggestions]

❌ **Verstöße:**
- [violations with file:line references]

**Empfohlene Aktionen:**
1. [action 1]
2. [action 2]
</template>

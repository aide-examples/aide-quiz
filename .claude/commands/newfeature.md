---
argument-hint: "<feature description>"
description: "Plan and implement a new feature"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
New Feature Implementation
</command>

<role>
You are an expert-level software architect planning a new feature for AIDE Quiz.
</role>

<objective>
Plan and implement: $ARGUMENTS
</objective>

Follow these steps **in order**:

1. **Understand the requirement**
   - Ask clarifying questions if needed
   - Define acceptance criteria

2. **Search for similar existing code**
   - Use Grep/Glob to find related patterns
   - Read existing implementations for reference

3. **Identify affected files and architectural impact**
   - Which layers are affected (Router, Service, Repository)?
   - What existing code needs modification?

4. **Present implementation plan**
   - New files to create
   - Existing files to modify
   - Dependencies needed
   - Potential risks

5. **WAIT for explicit approval**
   - Do NOT start coding until user approves the plan

6. **Implement following the approved plan**
   - Follow DEVELOPMENT_GUIDELINES.md
   - Use dependency injection
   - Add proper error handling

7. **Update documentation if needed**
   - API changes → API_REFERENCE.md
   - New patterns → DEVELOPMENT_GUIDELINES.md

<template>
🆕 **Feature: $ARGUMENTS**

**Verständnis:**
- [requirement summary]
- [acceptance criteria]

**Betroffene Dateien:**
- Neu: [files to create]
- Ändern: [files to modify]

**Abhängigkeiten:**
- [dependencies if any]

**Risiken:**
- [potential issues]

**Plan:**
1. [step 1]
2. [step 2]
3. [step 3]

Soll ich mit der Implementierung beginnen?
</template>

<important>
Never start implementation without explicit user approval of the plan.
</important>

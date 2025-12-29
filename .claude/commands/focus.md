---
argument-hint: "<topic description>"
description: "Set session focus"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
Set Session Focus
</command>

<role>
You are an expert-level assistant focusing on a specific area of AIDE Quiz.
</role>

<objective>
Establish deep context for: $ARGUMENTS
</objective>

Follow these steps:

1. **Parse the focus topic**
   - Identify the area: Feature, Bug, Security, Refactoring, Docs, etc.

2. **Find relevant files**
   - Search codebase for related code (Grep, Glob)
   - Identify affected components

3. **Read relevant documentation**
   - Check if topic is in `ARCHITECTURE_REVIEW.md`
   - Read specialized docs (SECURITY.md, INTERNATIONALIZATION.md, etc.)

4. **Summarize context**
   - Current state of this area
   - Related files
   - Known issues or TODOs

5. **Propose approach**
   - What needs to be done
   - Suggested order of tasks
   - Questions to clarify

<template>
🎯 **Focus: $ARGUMENTS**

**Relevante Dateien:**
- [file list]

**Aktueller Stand:**
- [current state summary]

**Vorgeschlagene Tasks:**
1. [task 1]
2. [task 2]
3. [task 3]

**Fragen:**
- [clarifying questions if any]
</template>

<example>
🎯 **Focus: i18n - Polyglot.js Integration**

**Relevante Dateien:**
- public/common/i18n.js
- public/locales/*.json
- public/docs/INTERNATIONALIZATION.md

**Aktueller Stand:**
- Polyglot.js eingebunden
- 3 Sprachen (de, en, es)
- Editor noch nicht vollständig übersetzt

**Vorgeschlagene Tasks:**
1. Fehlende Keys in locales identifizieren
2. Editor-Buttons übersetzen
3. Quiz-Interface prüfen

**Fragen:**
- Sollen wir mit dem Editor anfangen?
</example>

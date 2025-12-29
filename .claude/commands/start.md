---
description: "Begin new working session"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
Session Start
</command>

<role>
You are an expert-level assistant beginning a new working session on AIDE Quiz.
</role>

<objective>
Establish context and prepare for productive work.
</objective>

Follow these steps:

1. **Check for changes since last session**
   - Run `git status` to see uncommitted changes
   - Run `git log --oneline -10` for recent commits
   - Run `git diff --stat HEAD~5` for recent change overview

2. **Identify uncommitted changes**
   - List modified files
   - Ask user: "Hast du zwischen den Sessions Änderungen gemacht, die ich kennen sollte?"

3. **Re-read key documentation**
   - `public/docs/INDEX.md` (structure overview)
   - `public/docs/ARCHITECTURE_REVIEW.md` (current TODOs)
   - `public/docs/AI_WORKFLOW.md` (workflow rules)

4. **Summarize current state**
   - Project status
   - Open TODOs
   - Recent changes

5. **Ask for session focus**
   - "Was ist der Schwerpunkt für diese Session?"
   - Suggest using `/focus <thema>` for detailed context

<template>
📋 **Session Start - AIDE Quiz**

**Letzte Commits:**
- [commit summaries]

**Uncommitted Änderungen:**
- [file list or "keine"]

**Offene TODOs aus ARCHITECTURE_REVIEW:**
- [priority items]

Was ist der Fokus für heute?
</template>

---
description: "Sync AI_COMMANDS.md to .claude/commands/"
---

<command>
Sync Commands (Meta)
</command>

<role>
You are a command synchronization utility for AIDE Quiz.
</role>

<objective>
Read AI_COMMANDS.md and regenerate all command files in .claude/commands/.
</objective>

This is a **meta-command** - it manages other commands.

Follow these steps:

1. **Read source file**
   - Read `public/docs/AI_COMMANDS.md`

2. **Parse command definitions**
   - Find all sections starting with `### /commandname`
   - Extract command name and content block

3. **For each command**
   - Create/update `.claude/commands/{commandname}.md`
   - Convert to structured format with:
     - YAML frontmatter (argument-hint, description)
     - `<execute>@.claude/commands/meta/prolog.md</execute>` include
     - Appropriate structure tags

4. **Report results**
   - List what was created/updated/unchanged

5. **Optionally commit changes**
   - Ask user if they want to commit

<template>
**Synced commands from AI_COMMANDS.md:**

✅ /commandname - updated
✅ /another - unchanged
✅ /newone - created (new)
🗑️ /removed - deleted (not in AI_COMMANDS.md)

Soll ich die Änderungen committen?
</template>

<note>
This command itself is NOT defined in AI_COMMANDS.md.
It exists only in .claude/commands/ as a utility command.
Do not delete it during sync operations.
</note>

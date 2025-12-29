---
description: "Update documentation after code changes"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

<command>
Update Documentation
</command>

<role>
You are a technical writer updating AIDE Quiz documentation after code changes.
</role>

<objective>
Identify and update all documentation affected by recent changes.
</objective>

Follow these steps:

1. **Identify what changed**
   - Check recent commits: `git log --oneline -10`
   - Check uncommitted changes: `git status`
   - Categorize: new feature, modified behavior, bug fix, refactoring

2. **Update relevant documentation**

   | Change Type | Documentation |
   |-------------|---------------|
   | API changes | Run `npm run docs:api` → API_REFERENCE.md |
   | New patterns | DEVELOPMENT_GUIDELINES.md |
   | Error handling | ERROR_HANDLING.md |
   | Logging changes | LOGGING.md |
   | Security features | SECURITY.md |
   | i18n changes | INTERNATIONALIZATION.md |
   | New tools/scripts | TOOLS.md |

3. **Check INDEX.md**
   - Is the new feature/doc listed?
   - Are cross-references correct?

4. **Update Document Status table in INDEX.md**
   - Set "Aktualisiert" date
   - Adjust "Status" if needed

<template>
📝 **Documentation Update**

**Änderungen erkannt:**
- [list of changes]

**Aktualisierte Dokumente:**
- [doc1]: [what was updated]
- [doc2]: [what was updated]

**INDEX.md:**
- [changes if any]
</template>

<checklist>
- [ ] API_REFERENCE.md reflects current endpoints
- [ ] New patterns documented in DEVELOPMENT_GUIDELINES.md
- [ ] Specialized docs updated (ERROR_HANDLING, LOGGING, etc.)
- [ ] INDEX.md links and status table current
- [ ] No outdated information in existing docs
</checklist>

# 🌍 Internationalization (i18n)

## Overview

- IDE Quiz integrates Google Translator for convenient presentation of textual documentation like the document you are looking at right now.
- A very special case for our quiz is the treatment of questions, answers and reasons. The teacher shall be allowed to enter such texts in his/her mother tongue. Teachers are typically not able to provide translations to other languages. The quiz text is loaded dynamically from the database and shall be presented in a language chosen by the user. Therefore we integrate a high qaility translation sevice (DeepL) on the server. The server caches those translations to minimize traffic and usage of trabslation tokens.
- Both approaches are not suitable for elements of our own UI like button texts, hints or messages coming from the quiz system itself. This is where hand-crafted pre-defined **internationalization** comes in.

The remainder of this documents describes the *internationalization* (last item of the above list). 

AIDE Quiz uses **Polyglot.js** (3KB) for internationalization with centralized translation management.

**Supported Languages**: German (de), English (en), Spanish (es)

**Design Goals**:
- Minimal code overhead per module
- Non-developer friendly translation editing (plain JSON)
- Named parameters (not positional)
- Language-agnostic word order support

---

## Architecture

### File Structure

```
/public/
  /locales/
    de.json  (German - via DeepL)
    en.json  (English - source language)
    es.json  (Spanish - via DeepL)
  /common/
    i18n.js  (Central initialization)
```

### Initialization Pattern

**Centralized** - One global instance for entire application:

```javascript
// public/common/i18n.js
class I18nManager {
  async init(lang) {
    const response = await fetch(`/locales/${lang}.json`);
    const phrases = await response.json();
    this.polyglot = new Polyglot({ phrases, locale: lang });
  }

  t(key, params) {
    return this.polyglot.t(key, params);
  }
}

window.i18n = new I18nManager();
```

**All modules use the same global instance** → No per-module initialization needed.

---

## Initialization Pattern

### The `window.appReady` Promise

**CRITICAL: All application initialization must wait for `window.appReady`.**

The i18n system provides a global `window.appReady` Promise that combines:
1. **DOM ready** - Document loaded and parsed
2. **i18n ready** - Translations loaded and available

This ensures translations are available **before** any UI code runs.

**Why?**
- Without this, race conditions occur: UI code runs before translations load
- Result: Translation keys shown as literal strings (e.g., `"quiz_select_placeholder"`)
- Solution: **One centralized waiting point** - defined once in `i18n.js`

### Usage Pattern

**Every page initialization must use `window.appReady`:**

```javascript
// ✅ CORRECT - Wait for app to be ready
window.appReady.then(() => {
  // Initialize your app here
  const editor = new QuizEditor();
  editor.init();

  // All translations work now
  toast.success(window.i18n.t('app_loaded'));
});
```

**❌ WRONG - Don't use DOMContentLoaded directly:**
```javascript
// This creates race conditions with i18n loading
document.addEventListener('DOMContentLoaded', () => {
  const editor = new QuizEditor(); // May run before i18n ready!
});
```

### Example: QuizEditor.js

```javascript
// Initialize editor when app is ready (DOM + i18n)
window.appReady.then(async () => {
  const editor = new QuizEditor();
  await editor.init();
  // ... rest of initialization
});
```

**Benefits:**
- ✅ Time dependency defined **once** (in `i18n.js`)
- ✅ All pages use same pattern
- ✅ No individual timing checks needed
- ✅ Extensible (can add more prerequisites later)

---

## Usage

### Basic Translation

```javascript
// Simple text
toast.success(window.i18n.t('quiz_deleted_success'));
```

### Named Parameters

```javascript
// With parameters (named, not positional)
toast.success(
  window.i18n.t('quiz_delete_confirm', {
    title: quizData.title,
    count: quizData.questions.length
  })
);
```

### Translation File Format

**locales/de.json:**
```json
{
  "quiz_deleted_success": "Quiz erfolgreich gelöscht",
  "quiz_delete_confirm": "Wirklich '%{title}' löschen? (%{count} Fragen)",
  "session_created": "Session erstellt! Gültig bis %{endTime}"
}
```

**Key Features**:
- `%{paramName}` syntax for interpolation
- Supports different word order per language
- Plain JSON → editable by non-developers

---

## Adding New Translations

### 1. Add Translation Key to JSON Files

**de.json** (German source):
```json
{
  "existing_key": "...",
  "new_feature_title": "Neue Funktion"
}
```

### 2. Translate to Other Languages

**Option A**: Use DeepL API (server-side)
```bash
# Translate via existing /api/translate endpoint
curl -X POST /api/translate -d '{"text": "Neue Funktion", "targetLang": "en"}'
```

**Option B**: Manual editing of en.json, es.json

### 3. Use in Code

```javascript
// Any module
document.title = window.i18n.t('new_feature_title');
```

**No code changes in i18n.js needed!**

### 4. Adding i18n to a New Page

When adding internationalization to a page that doesn't have it yet:

**Step 1:** Include i18n.js in the HTML:
```html
<script src="../common/i18n.js"></script>
```

**Step 2:** Wrap initialization in `window.appReady`:
```javascript
// ✅ Wait for app to be ready
window.appReady.then(() => {
  // Initialize your page
  loadQuizData();
  renderUI();
});
```

**Step 3:** Use translations:
```javascript
document.title = window.i18n.t('page_title');
toast.success(window.i18n.t('data_loaded'));
```

**Important:** Always use `window.appReady` - never use `DOMContentLoaded` directly when i18n is involved.

---

## Technology Choice

### Why Polyglot.js?

| Criterion | Polyglot.js | i18next |
|-----------|-------------|---------|
| Bundle Size | 3KB | 56KB |
| Named Parameters | ✅ `%{name}` | ✅ `{{name}}` |
| Pluralization | Basic | Advanced |
| Namespaces | ❌ | ✅ |
| Setup Complexity | Low | Medium |
| Non-Dev Editing | ✅ JSON | ✅ JSON |

**Decision**: Polyglot.js chosen for simplicity and minimal bundle size. Advanced features (pluralization, namespaces) not required for this project.

---

## Best Practices

### Translation Keys Naming

Use descriptive, hierarchical keys:

```json
{
  "quiz_create_success": "...",
  "quiz_delete_confirm": "...",
  "error_invalid_title": "...",
  "session_created_until": "..."
}
```

**Pattern**: `<scope>_<action>_<type>`

### Avoid Hardcoded Strings

**❌ Bad:**
```javascript
toast.success('Quiz erfolgreich gelöscht');
```

**✅ Good:**
```javascript
toast.success(window.i18n.t('quiz_deleted_success'));
```

### Keep Translations in Sync

When adding new keys:
1. Add to de.json (source language)
2. Translate to en.json, es.json immediately
3. Missing translations → fallback to key name

---

## Language Detection

User's language preference determined by:

1. **Google Translate cookie** (`googtrans=/de/en`)
2. **Browser language** (`navigator.language`)
3. **Default fallback** (`de`)

See `LanguageHelper.js` for implementation.

---

## Current Status

**Phase 1** (Completed):
- ✅ SessionManager.js fully internationalized (10 translation keys)
- ✅ Central i18n.js setup with Polyglot.js
- ✅ `window.appReady` Promise pattern implemented
- ✅ Automatic language detection (GT cookie → browser → default)
- ✅ Three languages supported: German (de), English (en), Spanish (es)

**Implementation Details:**
- **Centralized timing** - All pages wait for `window.appReady` (defined once in `i18n.js`)
- **No race conditions** - Translations guaranteed available before UI initialization
- **Minimal overhead** - ~3KB bundle size, 1 line of code per translation

**Phase 2** (Planned):
- Other UI modules (QuizRenderer, StatsPage, ResultPage, etc.)
- ~100-200 total translation keys expected
- Same pattern: Include i18n.js, use window.appReady, call window.i18n.t()

---

*Last updated: 2024-12-25*

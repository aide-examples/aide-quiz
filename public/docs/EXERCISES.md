# Practice Exercises

Hands-on tasks for learning AI-assisted development with AIDE Quiz.

These exercises are designed to be solved **together with Claude Code**. Use the AI as your pair programmer - ask questions, request explanations, and let it guide you through the codebase.

---

## Exercise 1: Understand the Toast System

**Goal:** Learn how user notifications work in the client.

**Skills:** Code exploration, `/explain` command

### Task

1. Open Claude Code in the project directory
2. Ask Claude to explain the toast notification system:
   ```
   /explain public/common/ApiHelpers.js - focus on the ToastManager class
   ```
3. Answer these questions (with Claude's help):
   - Where is the toast container created in the DOM?
   - What are the 4 toast types and their default durations?
   - Why does `error` have duration `0`?

### Bonus Challenge

Add a 5th toast type called `debug` with:
- Purple background color (`#6f42c1`)
- Default duration: 10 seconds
- Icon: 🔧

**Hint:** You'll need to modify both the JavaScript (ToastManager) and CSS (toast styles).

---

## Exercise 2: Trace a Request Flow

**Goal:** Understand how data flows from client to server and back.

**Skills:** Full-stack tracing, reading multiple files

### Task

Follow the "Join Quiz" flow step by step:

1. **Start in the client:** Ask Claude to explain `QuizPage.js` method `joinQuiz()`
   ```
   /explain public/quiz/js/QuizPage.js - focus on joinQuiz method
   ```

2. **Find the API endpoint:** What URL does `fetchWithErrorHandling` call?

3. **Trace to the server:** Ask Claude to find and explain the corresponding router:
   ```
   Where is the /api/session/:name/quiz endpoint defined?
   ```

4. **Follow to the service:** Which service method does the router call?

5. **Document your findings:** Draw a simple flow diagram (or ask Claude to create one in Mermaid syntax).

### Expected Flow

```
QuizPage.joinQuiz()
    → fetchWithErrorHandling('/api/session/{name}/quiz')
    → SessionRouter.getSessionQuiz()
    → SessionService.getSessionQuiz()
    → QuizService.getStrippedQuiz()
    → Response: { id, title, questions: [...] }
```

---

## Exercise 3: Add an i18n Translation

**Goal:** Learn the internationalization system by adding a new translated string.

**Skills:** Multi-file changes, understanding i18n patterns

### Task

Add a "Back to Home" button text that works in all languages:

1. **Understand the system first:**
   ```
   /explain public/common/i18n.js - how does translation work?
   ```

2. **Find the translation files:**
   ```
   Where are the translation JSON files located?
   ```

3. **Add the new key** to each language file:
   - English: `"back_to_home": "Back to Home"`
   - German: `"back_to_home": "Zurück zur Startseite"`

4. **Use the translation** somewhere in the code:
   ```javascript
   const buttonText = i18n.t('back_to_home');
   ```

### Verification

- Check that the key exists in all language files
- Test by switching languages in the app (Google Translate widget)

---

## More Small Exercises

*Coming soon:*
- Add a new validation rule
- Create a custom error type
- Implement a simple API endpoint
- Write a unit test

---

## Larger Exercises

The current application has several short-comings and flaws which might also be called bugs. 

There is a document containing **[CHANGE REQUESTS](REQUESTS.md)** to improve the system.

You can try to understand these requirements and implement one or more of them.

You will see, how hard you will habe to work to understand the necessary changes. Always start to read relevant parts of the code yourself and make your own plan. Then use the AI in planning mode and make several iterations. Only after you have a perfectly clear picture give the AI permission to change the source code. Then your job is testing. Finally use the /explain feature of the AI to cross-check if evrything that was done is perfectly clear to you,

---

## Tips for Working with Claude

### Effective Prompts

| Instead of... | Try... |
|---------------|--------|
| "How does this work?" | "Explain the data flow in SessionService.getSessionQuiz()" |
| "Fix this bug" | "I see error X when doing Y. Help me find where this happens" |
| "Add a feature" | "I want to add X. Which files would need changes?" |

### Useful Commands

| Command | When to Use |
|---------|-------------|
| `/explain <file>` | Understand a specific file or function |
| `/review` | Check your changes for issues |
| `git diff` | See what you've changed before committing |

### Learning Strategy

1. **Explore first** - Use `/explain` before making changes
2. **Small steps** - Make one change at a time
3. **Test often** - Refresh the browser after each change
4. **Ask why** - Don't just copy code, understand it

---

*See [AI_WORKFLOW](AI_WORKFLOW.md) for collaboration patterns, [STUDENT_GUIDE](STUDENT_GUIDE.md) for learning paths*

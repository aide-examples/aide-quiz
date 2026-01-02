# Rules for Claude Code

Critical rules that must be followed in every session.

## Generated Files - DO NOT EDIT

These files are auto-generated. Edit the source, then regenerate.

| File | Generator | Command |
|------|-----------|---------|
| `public/docs/API_REFERENCE.md` | jsdoc-to-markdown | `cd server && npm run docs:api` |
| `public/docs/PROJECT_METRICS.md` | generate-metrics.js | `cd server && npm run metrics` |

**Workflow for generated files:**
1. Edit the source (e.g., JSDoc comments in `server/routers/*.js`)
2. Run the generator command
3. Commit both source and generated file together

**See:** [TOOLS.md](../public/docs/TOOLS.md) for full documentation of generators.

## CSS Rules

### Vor dem Hinzufügen neuer CSS-Regeln

1. **Existierende Regeln prüfen:** `grep -rn "\.klassenname" public/**/*.css`
2. **Spezifität beachten:** Wenn eine Klasse in verschiedenen Kontexten unterschiedlich aussehen soll, sofort Kontext-Selektor verwenden

### Shorthand vs. Longhand Properties

`background` ist eine Shorthand-Property. Wenn eine existierende Regel `background: linear-gradient(...)` verwendet, kann `background-color` diese **nicht** überschreiben.

```css
/* FALSCH - überschreibt Gradient nicht */
.foo { background-color: #fff; }

/* RICHTIG - überschreibt alles */
.foo { background: #fff; }
```

Gleiches gilt für: `font`, `margin`, `padding`, `border`, `animation`, `transition`

### Klassennamen

Generische Namen wie `.keyword`, `.header`, `.item` vermeiden. Stattdessen kontextbezogene Namen:

```css
/* Schlecht */
.keyword { ... }

/* Besser */
.question-card__keyword { ... }
.question-counter__keyword { ... }
```

# UI Guidelines

Design system and CSS architecture for AIDE Quiz.

## CSS Architecture

**Location:** `public/common/`

| File | Purpose |
|------|---------|
| `base.css` | Reset, typography, container, headings |
| `forms.css` | Buttons, inputs, cards, badges |
| `utilities.css` | Responsive, toasts, validation states |
| `header.css` | App header component |
| `image-layout.css` | Image grid layouts |
| `image-rendering.css` | Image display modes |

## Colors

```css
/* Primary gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Semantic colors */
--success: #28a745;   /* Green - correct, save */
--danger: #dc3545;    /* Red - errors, delete */
--warning: #ffc107;   /* Yellow - caution */
--info: #17a2b8;      /* Blue - information */
--secondary: #6c757d; /* Gray - secondary actions */

/* Text */
--text-primary: #495057;
--text-muted: #666;
--heading: #667eea;

/* Borders */
--border: #e9ecef;
```

## Buttons

```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Save / Confirm</button>
```

```css
.btn {
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);  /* Lift effect */
}
```

## Form Elements

```html
<label for="title">Quiz Title</label>
<input type="text" id="title" placeholder="Enter title...">
```

```css
input, select {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
}

input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

## Cards

```html
<div class="card">
  <div class="card-header">
    <h4>Title</h4>
    <span class="badge badge-success">Active</span>
  </div>
  Content here
</div>
```

## Badges

```html
<span class="badge badge-success">Correct</span>
<span class="badge badge-danger">Wrong</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-info">Info</span>
```

## Toast Notifications

```javascript
toast.success('Quiz saved successfully');
toast.error('Failed to save');
toast.warning('Unsaved changes');
toast.info('Loading...');
```

```css
.toast {
  border-left: 4px solid #667eea;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Validation States

```css
.validation-error {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.validation-success {
  border-color: #28a745;
  background-color: #f5fff5;
}

label.required:after {
  content: " *";
  color: #dc3545;
}
```

## Responsive Breakpoints

| Breakpoint | Target |
|------------|--------|
| `768px` | Tablets - reduced padding, full-width buttons |
| `480px` | Phones - smaller fonts, adjusted badges |

```css
@media (max-width: 768px) {
  .container { padding: 16px; }
  .btn { width: 100%; }
}

@media (max-width: 480px) {
  h1 { font-size: 24px; }
  .badge { font-size: 12px; }
}
```

## Container

```css
body {
  max-width: 1000px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
```

## Typography

| Element | Size | Color |
|---------|------|-------|
| `h1` | 32px (28px mobile) | #667eea |
| `h2` | 28px (24px mobile) | #667eea |
| `h3` | 16px | #666 |
| `h4` | 20px | #495057 |
| body | System fonts | #333 |

## Icons

Emoji used for visual indicators - no icon library needed:

| Emoji | Usage |
|-------|-------|
| 🎯 | Quiz/target |
| 📝 | Editor |
| 📊 | Statistics |
| 🔒 | Login/security |
| 💾 | Save |
| 🗑️ | Delete |
| ✅ | Correct/success |
| ❌ | Wrong/error |

## Translation-Friendly Text

Button labels and UI text should be written to work well with machine translation (Google Translate).

### Lowercase Verbs for Buttons

**Problem:** Machine translation misinterprets capitalized verbs as nouns.

```html
<!-- Bad: "Load" interpreted as noun -->
<button>Load Session</button>
<!-- Google Translate → "Lastsitzung" (cargo session!) -->

<!-- Good: Lowercase verb -->
<button>load session</button>
<!-- Google Translate → "Sitzung laden" (correct!) -->
```

### Problematic Words

| Avoid | Use Instead | Reason |
|-------|-------------|--------|
| Load | open | "load" causes translation issues even lowercase |
| Save | save | Works fine |
| Submit | submit | Works fine |

### Examples

```html
<!-- Buttons with verb actions: lowercase -->
<button>save quiz</button>
<button>open statistics</button>
<button>start session</button>

<!-- Pure nouns: can be capitalized -->
<button>Settings</button>
<button>Media</button>
```

### Applies To

- All `<button>` elements
- Dynamically generated buttons in JavaScript
- Link text that acts as buttons
- Translation keys in `locales/*.json`

---

*See [ACCESSIBILITY](ACCESSIBILITY.md) for inclusive design considerations*

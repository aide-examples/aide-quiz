# Polyglot.js

**Version:** 2.5.0
**License:** BSD (see LICENSE file)
**Source:** https://github.com/airbnb/polyglot.js
**NPM:** https://www.npmjs.com/package/node-polyglot

## Description

Polyglot.js is a tiny I18n helper library written in JavaScript, made to work both in the browser and in Node. It provides a simple solution for interpolation and pluralization, based off of Airbnb's experience with I18n.

## Why Locally Hosted?

- **Reliability**: No dependency on external CDN availability
- **Performance**: Faster load times (local file)
- **Reproducibility**: Exact version control, works offline
- **Security**: No external JavaScript execution

## File

- `polyglot.min.js` (14KB) - Minified production build

## Installation Date

2024-12-25

## Update Instructions

To update to a newer version:

```bash
# Download latest version from NPM/unpkg
curl -o polyglot.min.js https://unpkg.com/node-polyglot@VERSION/index.js

# Or from GitHub releases
# Visit: https://github.com/airbnb/polyglot.js/releases
```

**Important:** Test thoroughly after updating!

## Usage in Project

Loaded in `public/editor/index.html`:
```html
<script src="../vendor/polyglot/polyglot.min.js"></script>
```

Used by: `public/common/i18n.js`

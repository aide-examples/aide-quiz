# External Dependencies

This document explains how AIDE Quiz manages external libraries and why client-side and server-side dependencies are handled differently.

---

## Two Worlds: Client vs Server

| Aspect | Client (Browser) | Server (Node.js) |
|--------|------------------|------------------|
| **Location** | `/public/vendor/` | `/server/node_modules/` |
| **Management** | Manual (vendored, committed to Git) | npm (`package.json`) |
| **Installed via** | Download + commit | `npm install` |
| **Why different?** | No build step, works offline, CDN concerns | Standard Node.js practice |

**Key insight:** The browser has no package manager at runtime. Every library must be available as a file. The server runs Node.js, which has npm built-in.

---

# Part 1: Client-Side Libraries

## Decision: Local Hosting Over CDN

**We host client-side JavaScript libraries locally in `/public/vendor/` instead of using CDNs.**

### Why Local Hosting?

| Benefit | Explanation |
|---------|-------------|
| **Reliability** | No dependency on external CDN availability. Works offline. |
| **Performance** | No DNS lookup for CDN. Same-origin requests (no CORS). |
| **Reproducibility** | Exact version control via Git. No "CDN changed the file" surprises. |
| **Security** | No risk of CDN compromise or malicious injection. |
| **Simplicity** | No build step. Just clone and run. |

### Trade-offs Accepted

| Trade-off | Mitigation |
|-----------|------------|
| Larger repository (~3.8MB) | Modern Git handles this easily |
| Manual updates | Libraries are stable, rarely need updates |
| No automatic security updates | Regular dependency reviews |

---

## Current Client Libraries

**→ See [/public/vendor/README.md](../vendor/README.md) for the complete list with versions, sizes, and licenses.**

Summary: Polyglot.js, Marked.js, Mermaid.js, Chart.js, CodeMirror, Fuse.js, qrcode-generator (~3.9MB total)

### Size Considerations

Large libraries should only be loaded when they are actually used (lazy loading).
In our case this affects:

| Library | Size | Why Included |
|---------|------|--------------|
| **Mermaid** | 3.2MB | Essential for UML diagrams in documentation. No lightweight alternative. |
| **Chart.js** | 208KB | Required for statistics visualization. |
| **CodeMirror** | 244KB | Syntax highlighting for JSON quiz editing. |


---

## Client Library Rules

### Rule 1: When to Vendor

**Include in `/public/vendor/` if:**
- ✅ Stable API (rarely breaking changes)
- ✅ Open source license (MIT, BSD, Apache 2.0)
- ✅ Core functionality needed

**Consider alternatives if:**
- ❌ Large framework (React, Vue, Angular)
- ❌ Frequently updated (security-critical)
- ❌ Many transitive dependencies

### Rule 2: Directory Structure

```
/public/vendor/
  /library-name/
    library.min.js     # Minified production build
    LICENSE            # Original license file
    README.md          # Version, source, update info
```

### Rule 3: Always Commit

All vendor files are committed to Git. No exceptions. This ensures the repository is self-contained.

### Rule 4: Documentation Required

Every library MUST have a README.md with version, source URL, and update instructions.

---

## Client Anti-Patterns

### ❌ DON'T: Use CDN for Core Dependencies

```html
<!-- BAD: External dependency -->
<script src="https://cdn.jsdelivr.net/.../library.min.js"></script>
```

App breaks if CDN is down. No version control.

### ❌ DON'T: Mix Vendor Code with Our Code

```
/public/common/
  i18n.js          # Our code
  polyglot.min.js  # ❌ External library mixed in
```

Keep `/vendor/` separate from `/common/`.

---

# Part 2: Server-Side Libraries

## Why npm for Server?

| Reason | Explanation |
|--------|-------------|
| **Standard practice** | Node.js ecosystem uses npm universally |
| **No page load impact** | Server libraries don't affect browser performance |
| **Transitive dependencies** | npm handles dependency trees automatically |
| **Security updates** | `npm audit` and `npm update` available |
| **Not committed** | `node_modules/` is in `.gitignore` (reproduced via `npm install`) |

---

## Current Server Libraries

Defined in `server/package.json`:

### Core Framework

| Library | Version | Purpose | Why This One? |
|---------|---------|---------|---------------|
| **express** | 4.x | Web framework | Industry standard, minimal, well-documented |
| **body-parser** | 1.x | Parse JSON/form requests | Express companion, handles content types |
| **express-session** | 1.x | Session management | Standard session handling for Express |

### Database

| Library | Version | Purpose | Why This One? |
|---------|---------|---------|---------------|
| **better-sqlite3** | 12.x | SQLite database driver | Synchronous API, faster than sqlite3, no native compile issues |
| **better-sqlite3-session-store** | 0.1.x | Session storage in SQLite | Persistent sessions, works with better-sqlite3 |

### Security

| Library | Version | Purpose | Why This One? |
|---------|---------|---------|---------------|
| **bcrypt** | 5.x | Password hashing | Industry standard, resistant to brute-force |

### File Handling

| Library | Version | Purpose | Why This One? |
|---------|---------|---------|---------------|
| **multer** | 2.x | File upload handling | Standard Express middleware for multipart/form-data |
| **uuid** | 9.x | Generate unique IDs | RFC-compliant UUIDs, no collisions |

### Configuration

| Library | Version | Purpose | Why This One? |
|---------|---------|---------|---------------|
| **dotenv** | 16.x | Load .env files | Standard for environment configuration |

### Logging

| Library | Version | Purpose | Why This One? |
|---------|---------|---------|---------------|
| **winston** | 3.x | Structured logging | Flexible transports, log levels, formatting |
| **winston-daily-rotate-file** | 5.x | Log rotation | Automatic daily log files, size limits |

### Development Only

| Library | Version | Purpose |
|---------|---------|---------|
| **jsdoc-to-markdown** | 9.x | Generate API documentation from JSDoc comments |

---

## Server Dependency Rules

### Rule 1: Minimal Dependencies

Only add dependencies that provide significant value. Avoid "convenience" packages.

### Rule 2: Check Before Adding

Before `npm install new-package`:
1. Is it actively maintained?
2. What's the bundle size?
3. How many transitive dependencies?
4. Any known security issues? (`npm audit`)

### Rule 3: Lock Versions

Use `package-lock.json` to lock exact versions. Commit it to Git.

### Rule 4: Production vs Development

```bash
npm install package-name           # Runtime dependency
npm install --save-dev package-name  # Development only
```

### Rule 5: Regular Audits

```bash
npm audit           # Check for vulnerabilities
npm outdated        # Check for updates
npm update          # Update within semver ranges
```

---

## Related Documentation

- [/public/vendor/README.md](../vendor/README.md) - Client library index
- [SECURITY.md](SECURITY.md) - Security considerations
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production setup (includes `npm install --production`)
- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Development environment setup

---

**Established:** 2024-12-25
**Last Updated:** 2024-12-26

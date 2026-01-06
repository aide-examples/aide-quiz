# Vendor Libraries

This directory contains all external JavaScript libraries used in the frontend.

## Philosophy: Local Hosting Over CDN

**We host external libraries locally instead of using CDNs.**

### Why?

1. **Reliability** - No dependency on external server availability
2. **Performance** - Faster load times, no DNS lookup for CDN
3. **Reproducibility** - Exact version control, works offline
4. **Security** - No risk of CDN compromise or injection
5. **Simplicity** - No build step, no package manager for frontend

### What We Include

**Essential libraries for core features:**
- I18n helpers (Polyglot)
- Markdown rendering (Marked)
- UML diagrams for docs (Mermaid)
- Charts for statistics (Chart.js)
- Code editing (CodeMirror)
- Fuzzy search for docs (Fuse)
- QR codes for sharing (qrcode-generator)

**Size guideline:** Prefer < 100KB, but accept larger libraries when no alternative exists and feature is essential.

**What We Don't Include:**
- Large frameworks (React, Vue, Angular)
- Heavy dependencies (entire icon sets, font libraries)
- Libraries with frequent security updates

## Current Libraries

| Library | Version | Size | Purpose | License |
|---------|---------|------|---------|---------|
| **[Polyglot.js](polyglot/)** | 2.5.0 | 68KB | Internationalization (i18n) | BSD-2 |
| **[Marked.js](marked/)** | 15.x | 44KB | Markdown rendering | MIT |
| **[Mermaid.js](mermaid/)** | 11.x | 3.2MB | UML diagrams | MIT |
| **[Chart.js](chartjs/)** | 4.x | 208KB | Statistics charts | MIT |
| **[CodeMirror](codemirror/)** | 5.x | 244KB | Code editor (JSON) | MIT |
| **[Fuse.js](fuse/)** | 7.0.0 | 24KB | Fuzzy search | Apache-2.0 |
| **[qrcode-generator](qrcode/)** | 1.4.4 | 55KB | QR code generation | MIT |

## Directory Structure

Each library has its own directory:

```
/vendor/
  /polyglot/
    polyglot.min.js    # The minified library
    LICENSE            # Original license file
    README.md          # Version, source, update instructions
  /library-name/
    library.min.js
    LICENSE
    README.md
  README.md            # This file
```

## Git Strategy: COMMIT VENDOR FILES

**All vendor files are committed to the repository.**

### Why Commit?

✅ **Pros:**
- Works without internet
- Reproducible builds
- Version locked
- No separate dependency management

❌ **Cons:**
- Larger repository (~3.8MB for vendor/)
- Manual updates required

**Size Impact:** ~3.8MB total (dominated by Mermaid.js for UML diagrams)

## Adding a New Library

1. **Create directory:**
   ```bash
   mkdir -p /public/vendor/library-name
   ```

2. **Download minified version:**
   ```bash
   curl -o library.min.js https://...
   ```

3. **Add LICENSE:**
   ```bash
   curl -o LICENSE https://raw.githubusercontent.com/.../LICENSE
   ```

4. **Create README.md:**
   - Version number
   - Source URL
   - Installation date
   - Update instructions
   - Why we use it

5. **Update this file** (add to table above)

6. **Update `/public/docs/EXTERNAL_LIBS.md`**

7. **Commit everything:**
   ```bash
   git add public/vendor/library-name
   git commit -m "Add library-name v1.2.3 to vendor"
   ```

## Updating a Library

1. **Test current version** in development
2. **Download new version** to library directory
3. **Test thoroughly** - check for breaking changes
4. **Update library README.md** with new version/date
5. **Update this file** if needed
6. **Commit:**
   ```bash
   git add public/vendor/library-name
   git commit -m "Update library-name: v1.2.3 → v1.3.0"
   ```

## License Compliance

All libraries are:
- ✅ Open source (MIT, BSD, Apache 2.0, etc.)
- ✅ Redistribution allowed
- ✅ Original LICENSE included

**Important:** Always include the original LICENSE file!

---

**Last updated:** 2024-12-25

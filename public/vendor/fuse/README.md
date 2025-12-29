# Fuse.js

Lightweight fuzzy-search library with zero dependencies.

## Version

- **Version:** 7.0.0
- **Downloaded:** 2024-12-26
- **Source:** https://github.com/krisk/Fuse
- **CDN:** https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js

## Size

- `fuse.min.js`: 24KB

## License

Apache-2.0 (see LICENSE file)

## Purpose

Used for client-side documentation search in:
- TechDocsModal (searches all `/docs/*.md` files)
- HelpModal (searches app-specific README files)

## Features Used

- Fuzzy matching (tolerates typos)
- Weighted search (title > headings > content)
- Result highlighting

## Update Instructions

```bash
# Download new version
curl -o fuse.min.js https://cdn.jsdelivr.net/npm/fuse.js@latest/dist/fuse.min.js

# Download LICENSE
curl -o LICENSE https://raw.githubusercontent.com/krisk/Fuse/master/LICENSE

# Update version in this README
```

## API Reference

```javascript
const fuse = new Fuse(documents, {
  keys: ['title', 'headings', 'content'],
  threshold: 0.3,        // 0 = exact, 1 = match anything
  includeMatches: true,  // Return match positions
  minMatchCharLength: 2
});

const results = fuse.search('architcture');  // Fuzzy match!
```

See: https://www.fusejs.io/

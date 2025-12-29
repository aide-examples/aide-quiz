# Accessibility

> **Status:** Planned - This document outlines accessibility goals.

## Overview

Accessibility considerations for AIDE Quiz to ensure the application is usable by people with disabilities.

## WCAG Compliance Goals

Target: WCAG 2.1 Level AA

### Perceivable

- Text alternatives for images
- Sufficient color contrast
- Content readable without CSS
- Resizable text support

### Operable

- Keyboard navigation for all functions
- No keyboard traps
- Sufficient time for interactions
- Skip navigation links

### Understandable

- Consistent navigation
- Clear error messages
- Predictable behavior
- Input assistance

### Robust

- Valid HTML markup
- ARIA attributes where needed
- Compatible with assistive technologies

## Current Implementation

### Semantic HTML

- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs
- Button elements for actions
- Lists for list content

### Keyboard Support

| Action | Key |
|--------|-----|
| Navigate | Tab / Shift+Tab |
| Activate | Enter / Space |
| Close modal | Escape |
| Select option | Arrow keys |

### Focus Management

- Visible focus indicators
- Logical tab order
- Focus trapped in modals

## Areas for Improvement

| Area | Status | Priority |
|------|--------|----------|
| Color contrast audit | Planned | High |
| Screen reader testing | Planned | High |
| ARIA landmarks | Partial | Medium |
| Skip links | Planned | Medium |
| Alt text audit | Planned | Medium |

## Testing Approach

### Manual Testing

- Keyboard-only navigation
- Screen reader testing (NVDA, VoiceOver)
- High contrast mode
- Zoom to 200%

### Automated Testing

- aXe browser extension
- Lighthouse accessibility audit

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

*Document status: Planned*

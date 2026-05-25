---
name: coding-style
description: Coding conventions for Triad Admin SPA
---

## General

- Vanilla JS, no transpilation, no build step
- ES modules style (IIFEs for encapsulation since no bundler)
- Strict mode implied by module pattern
- All text via `i18n.t("key")` — never hardcoded

## Naming

- camelCase for variables and functions
- PascalCase for constructors (if any)
- UPPER_CASE for constants
- Descriptive names, no abbreviations

## HTML

- Tailwind utility classes only, no custom CSS
- Dark theme: bg-gray-900, bg-gray-800 for cards
- Responsive: mobile-first, use md: and lg: breakpoints
- Semantic HTML where possible

## JS

- No jQuery, no lodash, no utility libraries
- Use native fetch, addEventListener, querySelector
- Template literals for HTML generation
- Async/await for all async operations
- Keep functions small and focused

## Files

- One concern per file (router, api, pages, i18n)
- No circular dependencies between modules

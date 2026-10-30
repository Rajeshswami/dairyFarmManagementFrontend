# Modern Organic Palette update

Applied the requested Palette 1 across the existing React frontend.

- Sidebar: Deep Forest Green `#0B4632`
- Active navigation and key warm accents: Soft Butter / Warm Cream `#FFF1C5`
- Main application background: Fresh Off-White `#F7F9F6`
- Supporting icon surfaces: pale green `#EAF2EE`
- White cards, subtle borders and soft forest-tinted shadows

The shared `src/agrocontrol-theme.css` is loaded by `src/App.jsx`, so the same sidebar and theme are used on every protected route. Existing pages, route definitions, API modules, and application logic were not intentionally modified.

Responsive layout rules remain in place for tablet and mobile widths.

## Run

```bash
npm ci
npm run dev
```

A production build should be run locally before deployment.

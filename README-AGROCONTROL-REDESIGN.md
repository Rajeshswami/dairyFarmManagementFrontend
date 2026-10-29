# AgroControl-inspired Dairy Farm Management UI

This update applies a cohesive, responsive visual system across the existing React application, inspired by the supplied AgroControl agriculture dashboard reference.

## Design updates
- Forest-green navigation with a lime active state and clearer navigation hierarchy.
- Warm ivory application canvas, white cards, soft borders and restrained shadows.
- Updated visual treatment for page headings, dashboard hero, statistics, forms, tables, buttons, alerts and modals.
- Mobile-responsive spacing, sidebar overlay and touch-friendly controls.
- Existing Hindi/English language toggle and routes are retained.

## Scope and compatibility
- Existing React pages and API modules are retained.
- No NestJS endpoints, DTOs, API request shapes, billing formulas, payment logic, authentication flow or data models were intentionally changed.
- This is a styling and light shell-branding update, not a rewrite of the application logic.

## Run locally
1. Extract the ZIP.
2. Run `npm ci` (or `npm install` if you intentionally don't use the lockfile).
3. Copy `.env.example` to `.env` and set `VITE_API_URL` to your existing backend API base URL.
4. Run `npm run dev`.
5. Run `npm run build` before deployment.

The build was not verified in the generation environment because dependency installation timed out. Please run the build locally before deploying.

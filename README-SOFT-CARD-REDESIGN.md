# Dairy Farm Frontend — Soft Card Redesign

This package is based on the frontend uploaded as `dairyFarmManagementFrontend(4).zip`.

## What changed
- Rebuilt the dashboard presentation using the existing dashboard API response only; no sample KPI values or fake chart history were introduced.
- Added a five-card KPI row for customers, animals, milk production, delivery, and pending balance.
- Added quick navigation cards for customer, animal, production, delivery, bills, and voice assistant workflows.
- Added a billing/collection summary using the existing dashboard response fields.
- Restyled the shared sidebar, active navigation, header, forms, tables, buttons, badges, and cards to match the approved solid pastel-card reference.
- Kept the existing routes, API modules, authentication context, and voice assistant source files.
- Added responsive layout rules for tablet and mobile widths.

## Run locally

```bash
npm install
npm run dev
```

For production:

```bash
npm run build
```

The `.env` file is intentionally not included. Copy `.env.example` to `.env` and set your own API URL and other environment values.

## Verification
- Source ZIP integrity checked.
- Dependency installation was attempted but timed out in the build environment. Therefore a Vite production build has not been verified here.
- Dashboard cards use fields already read from `getDashboardApi(year, month)`. No backend API contract was changed.

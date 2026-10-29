# Apni Dairy — Frontend

A Hindi-first, responsive React + Vite frontend for dairy farm management.

## Requirements
- Node.js 20.19+ or a compatible supported Node LTS version
- The NestJS backend running separately

## Local setup
1. Install dependencies: `npm ci`
2. Copy `.env.example` to `.env`
3. Set `VITE_API_URL=http://localhost:5000/api` in `.env`
4. Start the frontend: `npm run dev`

## Production build
1. Configure `VITE_API_URL` to the deployed backend API base URL before building.
2. Run `npm ci`
3. Run `npm run build`
4. Publish the generated `dist/` directory on your static hosting provider.
5. Configure SPA fallback to `/index.html` (Netlify: `_redirects` is included).

## Important production checks
- Do not commit or share `.env` files.
- Set `VITE_API_URL` to the HTTPS API URL in the hosting environment.
- Configure the backend CORS allowlist for the exact frontend origin and credentials.
- Verify login cookies, CSRF protection, role permissions, billing, payments, exports, and backups against the deployed backend before accepting real farm data.

This archive contains the frontend only. The backend source that was mixed into the supplied frontend archive has been excluded so that the Vite frontend can be installed and built independently. Backend source and its deployment dependencies should be maintained/deployed as a separate NestJS project.

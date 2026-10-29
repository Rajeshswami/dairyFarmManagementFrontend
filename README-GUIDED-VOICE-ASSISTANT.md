# Guided Hindi Voice Assistant - Customer-by-Customer Delivery

## What changed
- Added a searchable customer list directly inside the Voice Assistant page.
- Added a "डिलीवरी राउंड शुरू करें" action that starts with the first active customer.
- The assistant asks for each customer's milk quantity, then asks morning or evening.
- The app shows a confirmation before creating the delivery record through the existing `POST /milk-delivery` API.
- After a successful save, it automatically moves to the next customer.
- A customer can be skipped, or the entire round can be stopped. Previously saved records remain saved.
- A customer can also be selected individually from the list outside a round.
- Existing backend endpoints and billing logic were not changed.

## Run locally
1. Extract the ZIP.
2. Run `npm ci` (if it fails because no lockfile is available, run `npm install`).
3. Configure `VITE_API_URL` in `.env` to point to the backend API, for example `http://localhost:5000/api`.
4. Run `npm run dev`.
5. Sign in, open **आवाज़ सहायक**, and use **डिलीवरी राउंड शुरू करें**.

Microphone support depends on the browser and secure context. You can type answers in the command field if speech recognition does not work. Please test with a non-critical test customer before recording real deliveries.

## Verification note
The ZIP archive is integrity-checked. A Vite production build could not be completed in this environment because dependency installation timed out and the Vite executable was unavailable. Treat this as a candidate build to test locally, not as a production-verified release.

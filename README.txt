DAIRY FARMER-FRIENDLY PHASE 4 — PAYMENTS

Files in this patch:
- src/pages/Payments/Payments.jsx
- src/pages/Payments/PaymentFormModal.jsx
- src/pages/Payments/payment-phase4.css

Apply to the frontend repository you are currently using:
1. Back up the current project first.
2. Replace the two JSX files at the matching paths.
3. Append the contents of payment-phase4.css to src/index.css (do not overwrite index.css).
4. Run npm run build and test locally before deployment.

This keeps the existing payment APIs and bill-generation rules. Payment collection is only enabled when the selected customer has a generated bill for the selected month. It does not auto-generate bills or change historical billing logic.

Important: The current backend GET /bills/monthly endpoint must return rows containing customer, billId, generated, totalAmount, paidAmount, pendingAmount, and status for this month. If the selected customer has no generated bill, the UI explains that the bill must first be generated from the Bills page.

Build status: source syntax checked; full production build not run in this environment. Test collection, edit payment, month switching, and history refresh locally before deployment.

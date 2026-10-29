# Dairy Farm Management — Voice Assistant module

This ZIP is a cumulative frontend project with the Voice Assistant page integrated into the existing React/Vite app.

## What works
- Hindi browser speech recognition when supported, plus a typed-command fallback.
- Spoken replies using browser speech synthesis.
- Voice navigation to Dashboard, Customers, Animals, Milk Production, Milk Delivery, Bills, Payments, and Reports.
- Read today's milk production and delivery totals using the existing backend APIs.
- Query a customer's current-month pending balance.
- Stage and confirm milk delivery, per-animal milk production, and payment records before calling existing API endpoints.
- Multi-turn Hindi delivery entry: the assistant asks for missing customer, quantity, or morning/evening information and keeps the partial command while you answer.
- Cancel an incomplete conversation by saying/typing “रद्द करो”.
- Responsive voice-assistant UI with suggested commands and recent command history.

## Setup
1. Extract the ZIP.
2. Copy `.env.example` to `.env`.
3. Set `VITE_API_URL=http://localhost:5000/api` locally or your deployed HTTPS backend URL.
4. Run `npm ci`, then `npm run dev`.
5. Sign in through the existing app and open **आवाज़ सहायक** in the sidebar.

## Browser requirements
- Use HTTPS in production (or localhost during development) for microphone access.
- Speech recognition availability and Hindi quality vary by browser. Chrome/Edge generally have better support. If unavailable, use the text command box.
- Browser speech recognition may send audio to the browser vendor's speech service depending on browser implementation.

## Supported examples
- `ग्राहक खोलो`
- `आज की डिलीवरी दिखाओ`
- `आज का दूध उत्पादन दिखाओ`
- `रामलाल का कितना पैसा बाकी है?`
- `रामलाल को दूध देना है` → answer the follow-up questions for quantity and timing.
- `रामलाल को आधा लीटर दूध सुबह देना है`
- `गाय 101 का सुबह 5 और शाम 4 लीटर उत्पादन दर्ज करो`
- `मोहन ने 500 रुपये नकद दिए`

## Important limitations and safe use
- Commands are interpreted with a built-in Hindi/Hinglish rule-based parser, not a general-purpose AI model. Use clear commands and verify the confirmation card before saving.
- Milk production is recorded per animal. The command must include an animal name/tag and at least one morning/evening quantity.
- Voice payment entry requires an existing generated bill for that customer in the current month. The payment method defaults to CASH unless UPI/bank is mentioned.
- This feature uses the existing authenticated NestJS APIs and their validation/permissions; no new backend route is required.
- Test every workflow against a staging database before live use. The ZIP has been checked for archive integrity and relative imports, but a full dependency install/build and live backend test were not completed here.


### Voice conversation and confirmation improvements
- After staging a delivery, production, or payment, the farmer can say/type “हाँ सेव करो” to confirm or “रद्द करो” to cancel. The on-screen buttons remain available.
- For incomplete delivery commands, the assistant asks for missing details in sequence and only shows the save confirmation once customer, quantity (0–10 litres), and morning/evening are known. This multi-turn flow is currently implemented for milk delivery; production and payment still expect their key details in the initial command.
- Speech recognition accuracy depends on the browser, microphone permission, and background noise. Review the displayed summary before saving.

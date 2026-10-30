# Hindi + Marwari voice assistant update

This update keeps the existing guided customer delivery round and existing API payloads.

## Conversation style
- Opening greeting: “राम राम सा!”
- Uses Hindi with Marwari-influenced wording in prompts and spoken responses.
- Asks the configured delivery periods for each customer one at a time.
- Accepts common quantity phrases including आधा/आधो, पाव, तीन पाव, डेढ़, सवा, numeric quantities, and zero/no-milk phrases including कोनी/नीं.
- Reads back the morning/evening totals and waits for explicit confirmation before calling the existing milk-delivery API.
- Continues to the next customer only after a successful save (or when the user skips/cancels that customer).

## Speech recognition note
The Web Speech API is configured for `hi-IN` because browsers do not provide a broadly supported Marwari locale. Marwari vocabulary is handled in the app's phrase/quantity matching after speech-to-text. Recognition quality still depends on the browser and its speech service; test with the target device and local dialect.

## Backend compatibility
No NestJS API endpoints, request shapes, customer schema fields, or delivery calculations were changed. The existing `morning` and `evening` customer schedule fields continue to decide which periods are asked.

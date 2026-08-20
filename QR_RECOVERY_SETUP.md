# Duplicate-registration QR recovery

The public `POST /api/bookings` endpoint now returns HTTP 409 for an existing participant together with:

- `alreadyRegistered: true`
- a safe `booking` object (no `qrToken`)
- `qrDataUrl` rendered by the same QR renderer used elsewhere

The existing QR token is never replaced. If the participant has no token yet, `ensureQrToken()` creates it once and persists it.

The participant page can therefore show Download / Share QR immediately from the duplicate-registration dialog. No admin authentication is required for this duplicate response because the user has just submitted the same registration identity that matched the existing record.

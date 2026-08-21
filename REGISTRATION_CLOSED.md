# Registration closed

New participant registration is closed by default.

The server checks for an existing participant **before** enforcing the closure. Therefore:

- Existing participant -> HTTP 409 + original QR (`qrDataUrl`) -> current QR recovery popup.
- New participant -> HTTP 403 + `registrationClosed: true` -> participation-ended popup.

## Environment

`REGISTRATION_CLOSED=true` closes new registrations.

To temporarily reopen new registrations, set:

`REGISTRATION_CLOSED=false`

Restart/redeploy the server after changing the environment variable.

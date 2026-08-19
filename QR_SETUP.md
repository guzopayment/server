# QR Code Setup

## What this implementation does

- Existing participants can be assigned permanent QR codes in bulk from the Admin Participants page.
- New participants automatically receive a permanent QR token when they register.
- The registration success page displays the new participant's QR code and provides Download/Share actions.
- Admin can download all participant QR codes as one ZIP.
- Admin can download or share an individual participant QR from the participant list.
- No participant email field or other delivery-specific participant attribute is required.

## Admin workflow

1. Open Admin Participants.
2. In QR Code Center, click `Generate Missing / All QR` once. This generates tokens for all existing records that do not have one.
3. Click `Download All QR (ZIP)` if you need all QR images at once.
4. Use the `QR` button beside a participant to download an individual code.
5. Use `Share` on a supported mobile browser to share that participant's QR through the device's normal share sheet.

## New registrations

Every new `/bookings` registration creates its QR token automatically. The API response includes a temporary QR data URL for the registration success page. No database field other than `qrToken` is added for QR generation.

## Attendance

The participant document also contains the attendance fields used by the scanner:

- `attendance.checkedIn`
- `attendance.checkedInAt`

## Deployment

The server requires the existing `qrcode` and `archiver` packages. Run `npm install` in the server project after replacing the source files.

## Attendance list export

The scanner can download the complete attendance list after/during the event using the protected endpoint:

`GET /api/bookings/attendance/list`

The response includes every registered participant, their Present/Absent status, and `checkedInAt` when present. The scanner converts this to a UTF-8 CSV that opens in Excel and preserves Amharic text.

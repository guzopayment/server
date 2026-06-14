# Shared Updated Server

This backend serves both the questionnaire frontend and the booking/payment frontend.

## Main fixes included
- added second frontend origin to CORS
- fixed `/api/options` mount path
- improved `GET /api/bookings` with optional search and summary totals

## Local run
```bash
npm install
cp .env.example .env
npm run dev
```

## Production
```bash
npm install
npm start
```

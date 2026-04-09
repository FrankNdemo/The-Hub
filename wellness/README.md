# The Wellness Hub Frontend

This frontend is a Vite + React application for The Wellness Hub.

## Local Development

1. Install dependencies:

```powershell
npm install
```

2. Copy `.env.example` to `.env` and point `VITE_API_BASE_URL` to the Django backend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

3. Start the frontend:

```powershell
npm run dev
```

## Main Features

- Public therapist profile from the Django API
- Public blog pages from the Django API
- Booking creation and manage-token updates stored through Django/Supabase
- Therapist dashboard for bookings, notifications, profile updates, and blog publishing

## Build

```powershell
npm run build
```

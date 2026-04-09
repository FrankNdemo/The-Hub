# The Wellness Hub Django Backend

This backend is designed around the current frontend flows already present in `wellness`:

- Public therapist profile
- Blog list/detail pages
- Booking creation with manage-token access
- Transactional booking emails with calendar invite attachments
- Booking reschedule/cancel flows from a private link
- Therapist portal login and password reset
- Therapist dashboard for bookings, notifications, profile updates, and blog publishing

## Stack

- Django
- Django REST Framework
- Simple JWT for therapist authentication
- SQLite by default for local development
- PostgreSQL/Supabase-ready model design using standard Django fields and `JSONField`

## Apps

- `apps.therapists`: therapist profile, therapist auth, passphrase reset/change flows, dashboard overview
- `apps.bookings`: bookings, booking history, stored email records, manage-token actions
- `apps.blog`: blog posts and therapist publishing endpoints
- `apps.notifications`: therapist notifications
- `apps.common`: shared model helpers and health endpoint

## Main API Areas

- `GET /api/v1/health/`
- `GET /api/v1/public/therapist/`
- `GET /api/v1/blog/posts/`
- `GET /api/v1/blog/posts/<slug>/`
- `POST /api/v1/bookings/`
- `GET /api/v1/bookings/manage/<token>/`
- `POST /api/v1/bookings/manage/<token>/reschedule/`
- `POST /api/v1/bookings/manage/<token>/cancel/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/refresh/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/verify-passphrase/`
- `POST /api/v1/auth/reset-password/`
- `GET /api/v1/auth/me/`
- `GET /api/v1/dashboard/`
- `PATCH /api/v1/dashboard/profile/`
- `POST /api/v1/dashboard/change-password/`
- `POST /api/v1/dashboard/change-secret-passphrase/`
- `GET /api/v1/dashboard/bookings/`
- `POST /api/v1/dashboard/bookings/<uuid>/complete/`
- `GET /api/v1/dashboard/notifications/`
- `POST /api/v1/dashboard/notifications/mark-read/`
- `DELETE /api/v1/dashboard/notifications/<uuid>/`
- `GET /api/v1/dashboard/blog-posts/`
- `POST /api/v1/dashboard/blog-posts/`
- `PATCH /api/v1/dashboard/blog-posts/<uuid>/`
- `DELETE /api/v1/dashboard/blog-posts/<uuid>/`

## Quick Start

1. Create a virtual environment and install requirements:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and adjust values if needed.

3. Run migrations:

```powershell
python manage.py migrate
```

4. Start the API:

```powershell
python manage.py runserver
```

## Supabase Migration Later

The project is ready for a PostgreSQL migration later. When you share the Supabase details, the next step will be:

1. Add either `DATABASE_URL` or the individual `DB_*` variables in `.env`.
2. If you use the individual fields, set `DB_ENGINE=postgres` and `DB_SSLMODE=require`.
3. Run `python manage.py migrate` against Supabase/Postgres.
4. Optionally move media/image URLs to Supabase Storage.

Example `.env` values for Supabase:

```env
DB_ENGINE=postgres
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
DB_HOST=db.YOUR_PROJECT_REF.supabase.co
DB_PORT=5432
DB_SSLMODE=require
```

You can also use:

```env
DATABASE_URL=postgresql://postgres:YOUR_SUPABASE_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

The backend also accepts raw special characters in the password segment of `DATABASE_URL`, which helps with provider-generated secrets on platforms like Vercel. If you prefer, you can avoid connection-string parsing entirely by setting the individual `DB_*` variables instead.

For this Django backend, `python manage.py migrate` is the correct schema push command. `supabase db push` is only needed if you are maintaining Supabase SQL migrations separately.

## Notes

- `manageUrl` is generated dynamically from `FRONTEND_BASE_URL` and the booking token.
- The default local frontend URL in the backend settings is `http://localhost:8080`.
- Therapist passwords use Django's built-in password hashing.
- Secret passphrases are stored separately as hashed values.
- Blog tags, specialties, locations, and email recipients use `JSONField` for easier Postgres portability.
- Booking confirmation, reschedule, and cancellation emails are sent through Django's configured email backend. With Brevo SMTP configured, the client and therapist each receive a calendar invite (`.ics`) that can be added to their calendars and updated on reschedule/cancel.

# MediTrack

MediTrack is a production-ready patient appointment and medical records system for clinics that now operates as a clean admin-only console. It pairs a FastAPI backend with a modern React + TypeScript frontend, supports JWT authentication for clinic staff, schedules appointment reminder jobs, and ships with Docker assets plus AWS deployment guidance. Patients exist only as records that receive confirmation/reminder emails—there is no patient portal or login.

Clinic staff can now self-serve onboarding: sign up from the web app to create your admin/doctor account, then log in immediately. A seeded default admin still exists for local/dev but is no longer required for first-run access.

```
              +-----------------------------+
              |         React / Vite        |
              |  Tailwind + React Query     |
              +--------------+--------------+
                             |
                     HTTPS / REST
                             |
        +--------------------v--------------------+
        |               FastAPI API               |
        | Auth • Patients • Appointments • Users  |
        +----------+---------------+--------------+
                   |               |
            APScheduler      SQLAlchemy ORM
                   |               |
             Reminder Jobs     PostgreSQL
```

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, Alembic, PyJWT, APScheduler, PostgreSQL
- **Frontend:** React 18, TypeScript, Vite, React Router, React Query, TailwindCSS
- **Auth:** Admin-only JWT access tokens stored client-side, bcrypt hashing via Passlib, strict middleware that blocks non-staff access
- **DevOps:** Dockerfiles for frontend/backed, docker-compose (backend + frontend + Postgres + pgAdmin), AWS deployment guide with Nginx reverse proxy

## Project Structure

```
meditrack/
├── backend/
│   ├── app/
│   │   ├── api/v1/...
│   │   ├── core/ (config & security)
│   │   ├── db/ (engine + base)
│   │   ├── models/ (User, Patient, Appointment)
│   │   ├── schemas/
│   │   ├── services/reminder_service.py
│   │   └── tests/
│   ├── alembic/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/ (components, pages, hooks, services, context)
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Environment Variables

**Backend (`backend/.env` based on `.env.example`):**

```
SECRET_KEY=super-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=postgresql+psycopg2://meditrack:meditrack@localhost:5432/meditrack
ADMIN_DEFAULT_EMAIL=admin@meditrack.com
ADMIN_DEFAULT_PASSWORD=ChangeMe123!
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-smtp-key
REMINDER_HOURS_BEFORE=24
```

**Frontend (`frontend/.env`):**

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Dev Setup

Backend (clean install):

```bash
cd backend
rm -rf .venv
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Frontend (clean install):

```bash
cd frontend
rm -rf node_modules dist
npm install
cp .env.example .env
```

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # adjust values
uvicorn app.main:app --reload --port 8000
```

Database migrations (optional when not relying on `Base.metadata.create_all`):

```bash
alembic upgrade head
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:8000`.

Once both services are running, visit `http://localhost:5173/signup` to create your clinic admin/doctor account, then log in. The seeded admin (`ADMIN_DEFAULT_EMAIL` / `ADMIN_DEFAULT_PASSWORD`) remains available for fallback/local testing.

### Automated Tests

Backend `pytest` suite covers authentication, CRUD flows, ORM behavior, and security helpers:

```bash
cd backend
pytest
```

Frontend tests are not bundled (React Query heavy), but TypeScript plus ESLint ensure baseline safety:

```bash
cd frontend
npm run lint
```

## Dockerized Setup

```bash
docker compose up --build
```

Services:

- `backend`: FastAPI on `http://localhost:8000`
- `frontend`: nginx-served React build on `http://localhost:5173`
- `db`: PostgreSQL (user/pass/db = `meditrack`)
- `pgadmin`: available at `http://localhost:5050`

Stop with `docker compose down` (add `-v` to wipe Postgres volume).

Dev reset workflow:

```bash
docker compose down -v && docker compose up --build
```

### Dev Hot-Reload (Docker)

For live reload of both backend (uvicorn --reload) and frontend (Vite dev server) without rebuilding on every change:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Backend: mounts `backend/app` and runs on `http://localhost:8000`.
- Frontend: mounts `frontend`, runs Vite dev server on `http://localhost:5173`.
- Node modules are stored in a container volume (`frontend_node_modules`) to avoid clobbering host files.
- Database/pgAdmin run the same as production compose for local dev convenience.

## API Summary

| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/v1/auth/signup` | POST | Public signup for clinic admins/doctors (returns JWT) | Public |
| `/api/v1/auth/login` | POST | Issue JWT token for clinic admin | Public |
| `/api/v1/auth/register` | POST | Admin creates additional staff accounts | Admin |
| `/api/v1/users/me` | GET/PUT | View/update logged-in admin | Admin |
| `/api/v1/users/change-password` | POST | Change current user password (requires old password) | Admin |
| `/api/v1/patients/` | GET/POST | List or create patient records | Admin |
| `/api/v1/patients/{id}` | GET/PUT/DELETE | Manage a patient record | Admin |
| `/api/v1/appointments/` | GET/POST | Admin lists or creates appointments | Admin |
| `/api/v1/appointments/{id}` | PUT/DELETE | Update or delete an appointment | Admin |

All endpoints honor JWT bearer tokens (`Authorization: Bearer <token>`). Passwords use bcrypt hashing and tokens encode `sub` + `role`.

## Reminder Service

`APScheduler` runs hourly to find appointments within `REMINDER_HOURS_BEFORE` (24h by default). When SMTP creds are configured, reminder emails are sent. Without SMTP, reminders are logged so you can test behavior safely.

## Frontend Highlights

- **State & Data:** React Query hooks wrap `/patients`, `/appointments`, `/users` endpoints with caching + invalidation.
- **Auth:** Context stores token + user metadata in `localStorage`, with hydration state to avoid flicker.
- **Routing:** `ProtectedRoute` enforces authentication and ensures only signed-in admins can reach app routes.
- **UI:** Tailwind CSS provides responsive cards, forms, and dashboards. Loading + error components centralize UX states.
- **Pages:** Login, Admin Dashboard, Appointment List, Create Appointment, Patient Record Details, Edit Profile, Not Found.

## Default Data / Seeds

On startup the backend auto-creates an admin using `ADMIN_DEFAULT_EMAIL` and `ADMIN_DEFAULT_PASSWORD` for local/dev. In production or normal flows, create a new admin/doctor from the `/signup` page, which issues a JWT and logs you in immediately.

## Deployment

Required environment variables:

- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `ADMIN_DEFAULT_EMAIL`
- `ADMIN_DEFAULT_PASSWORD`
- `EMAIL_ENABLED`

Optional email variables (only needed when `EMAIL_ENABLED=true`):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME` (or `SMTP_USER`)
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_USE_TLS`

Recommended production settings:

- Use a strong `SECRET_KEY` and rotate default admin credentials after first login.
- Point `DATABASE_URL` at a managed Postgres instance.
- Restrict CORS origins in `backend/app/main.py`.
- Keep `EMAIL_ENABLED=false` until SMTP is configured.

Ports and URLs:

- Backend: `http://<host>:8000` (`/api/v1` for API routes)
- Frontend: `http://<host>:5173` (Dockerized production build via nginx)

## AWS Deployment Guide

1. **Provision EC2:** Launch Ubuntu 22.04 LTS, open ports 22, 80, 443 in the security group.
2. **Install Docker & Compose:**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   sudo usermod -aG docker ubuntu
   ```
   Reconnect to activate group membership.
3. **Fetch Code:** Clone this repo or `scp` it to `/opt/meditrack`.
4. **Environment:** Populate `backend/.env` and `frontend/.env` with production values (strong `SECRET_KEY`, RDS URL if external Postgres, SMTP creds, etc.).
5. **Reverse Proxy:** Install Nginx to terminate SSL and forward traffic to frontend/backend containers.
   - Configure upstreams pointing at `frontend:80` and `backend:8000`.
   - Example snippet:
     ```
     server {
       listen 80;
       server_name meditrack.example.com;
       location /api/ {
         proxy_pass http://127.0.0.1:8000/api/;
         proxy_set_header Host $host;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
       location / {
         proxy_pass http://127.0.0.1:5173/;
       }
     }
     ```
6. **SSL:** Use Certbot (`sudo snap install --classic certbot`) to issue certificates, then update the Nginx server block to listen on 443 with `ssl_certificate` paths.
7. **Run Containers:** `docker compose up -d --build`. Use `systemd` service or a simple cron to ensure containers restart on reboot (`docker compose restart`).
8. **Database Considerations:** Lock down Postgres to the private subnet, enforce strong passwords, enable regular backups or use AWS RDS for managed storage.

## Screenshots

Add real screenshots to `docs/screenshots/` and reference them below:

- ![Admin Dashboard](docs/screenshots/admin-dashboard.png "Admin dashboard placeholder")
- ![Patient Record](docs/screenshots/patient-record.png "Patient record placeholder")

## Troubleshooting

- **401 errors:** Ensure the client includes `Authorization: Bearer <token>` header. Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Scheduler not running:** Confirm the backend logs show `APScheduler` started; in Docker ensure container clocks are correct.
- **CORS issues:** `app/main.py` enables permissive CORS; tighten in production by setting `allow_origins`.
- **pgAdmin can't connect:** Use service name `db`, user/pass `meditrack`, port `5432`.

## Next Steps

- Add React component tests with Vitest + React Testing Library.
- Hook up transactional email provider (SES, SendGrid) for production reminders.
- Layer in a calendar or kanban view for appointment triage.

---

MediTrack delivers the full-stack scaffolding—from secure admin authentication to scheduling automation—to get a clinic operations app into production quickly. Customize modules, extend the schema, or plug in third-party services as needed. Happy shipping!

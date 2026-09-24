# Shopping Monorepo

Start with the [complete project documentation](docs/README.md), including separate [backend](docs/backend/README.md) and [frontend](docs/frontend/README.md) guides. Run `npm run docs:watch` while developing and `npm run docs:check` before committing.

This repository contains a starter monorepo for a shopping platform with:

- NestJS backend API
- Angular-admin application for superadmin / admin / vendor operations
- Angular storefront application for end users
- PostgreSQL via Docker
- Signal-store based state management skeletons

## Structure

- `apps/backend` — NestJS API
- `apps/admin` — internal administration shell
- `apps/shop` — customer storefront shell
- `docker-compose.yml` — Postgres + pgAdmin

## Quick start

1. Start the database:
   ```bash
   docker compose up -d
   ```

2. Create the backend environment file if it does not already exist:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

3. Install backend dependencies:
   ```bash
   cd apps/backend
   npm install
   npm run start:dev
   ```

4. Install admin dependencies:
   ```bash
   cd apps/admin
   npm install
   npm run start -- --host 0.0.0.0 --port 4200
   ```

5. Install shop dependencies:
   ```bash
   cd apps/shop
   npm install
   npm run start -- --host 0.0.0.0 --port 4300
   ```

> Note: the project uses Postgres on port 5433 and pgAdmin on port 5051 to avoid collisions with any local PostgreSQL instance already running on your machine.

If the database connection fails, check the running container, database name, and DB_PORT=5433. See [troubleshooting](docs/testing.md). Avoid deleting the database volume to fix a connection setting.

## Default URLs

- Backend API: http://localhost:3000/api
- Swagger docs: http://localhost:3000/docs
- Admin app: http://localhost:4200
- Shop app: http://localhost:4300
- PGAdmin: http://localhost:5051
- Postgres: localhost:5433

## Database config

Configure the backend with environment values in `apps/backend/.env` using the sample file `apps/backend/.env.example`.

## Notes

Authentication and database-backed user listing are implemented. Most commerce and administration pages remain demonstrations. See [feature status](docs/feature-status.md) for the exact working scope and known limitations.

## Authentication

Customers can register and sign in at http://localhost:4300/account. Passwords must contain 12�128 characters. Admin sign-in is at http://localhost:4200/login. Public registration always creates a customer.

The API provides `POST /api/auth/register` (`name`, `email`, `password`), `POST /api/auth/login` (`email`, `password`), `GET /api/auth/me`, and `POST /api/auth/logout`. POST requests require `X-Shopping-Client: web`; browser clients must send credentials. Sessions expire after eight hours and logout revokes the current session. Passwords use salted scrypt hashes; the database stores only SHA-256 hashes of random session tokens. Cookies are HttpOnly, SameSite=Lax, and Secure in production. Admin users and vendors endpoints enforce admin/superadmin roles on the server.

For local development, `DB_SYNCHRONIZE=true` creates the `users` and `auth_sessions` tables when the backend starts. Keep it disabled in production and apply a reviewed database migration. Use HTTPS and set `AUTH_ORIGINS` to the exact deployed frontend origins. The frontend API URL currently points to localhost:3000; update both apps' `core/auth/auth.service.ts` for deployment. Cookie authentication assumes same-site frontend and API hosts.

To create the first administrator, register your own customer account, then run the following using your actual email through a trusted database connection:

```sql
UPDATE public.users SET role = 'superadmin' WHERE email = 'your-email@example.com';
```

An explicit development superadmin seed is available: set SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD in the ignored backend .env, then run npm --prefix apps/backend run seed:superadmin. See [superadmin setup](docs/backend/features/superadmin-setup.md). Normal startup does not seed accounts. Sign in to the admin app after assigning the role. Vendor-specific access, email verification, and password recovery are not implemented in this first pass. Login/registration throttling is per IP and per server process (20 attempts per 15 minutes); deployments with multiple instances need a shared rate-limit store and trusted proxy configuration. Expired session records should be removed by a scheduled database cleanup.

Run authentication integration tests with `cd apps/backend` then `npm run test:e2e -- --runInBand auth.e2e-spec.ts`. Tests use `.env` database connection settings, create an isolated randomly named schema, and remove it afterward; existing application data is not modified.

## Material sign-in pages

Admin login and storefront account forms use Angular Material with persistent light/dark toggles. See [theming](docs/frontend/theming.md). The admin login layout fills the signed-out viewport, and administrator sign-in redirects to /dashboard.

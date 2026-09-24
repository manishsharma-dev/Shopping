# Shopping Monorepo

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

2. Install backend dependencies:
   ```bash
   cd apps/backend
   npm install
   npm run start:dev
   ```

3. Install admin dependencies:
   ```bash
   cd apps/admin
   npm install
   npm run start -- --host 0.0.0.0 --port 4200
   ```

4. Install shop dependencies:
   ```bash
   cd apps/shop
   npm install
   npm run start -- --host 0.0.0.0 --port 4300
   ```

## Default URLs

- Backend API: http://localhost:3000/api
- Swagger docs: http://localhost:3000/docs
- Admin app: http://localhost:4200
- Shop app: http://localhost:4300
- PGAdmin: http://localhost:5050

## Database config

Configure the backend with environment values in `apps/backend/.env` using the sample file `apps/backend/.env.example`.

## Notes

This is intentionally a skeletal implementation for initial bootstrapping. The next layer would extend the modules with real entities, auth, product management, order flows, and micro-frontend decomposition if needed.

# Getting started

## Prerequisites and installation

Use Node.js and npm compatible with the app package manifests and lockfiles, Docker with Compose for the local database, and optionally PostgreSQL's `psql` client. This project was exercised locally with Node 26.3.0; the documentation tooling CI uses Node 22. The manifests declare Angular 22, NestJS 12, TypeScript 6, and TypeORM 1.1. Exact installed versions are pinned by each application's package lock.

Run these commands from the repository root:

```sh
npm --prefix apps/backend ci
npm --prefix apps/admin ci
npm --prefix apps/shop ci
docker compose up -d
```

There is no root npm workspace dependency installation. Install all three apps separately. Each app has its own scripts and lockfile.

Copy `apps/backend/.env.example` to `apps/backend/.env` if the latter does not exist. Do not overwrite an existing configuration. **Set DB_PORT=5433 when the backend runs on your host against the supplied Compose database.** The sample file and application fallback currently say 5432; Compose publishes 5433. PostgreSQL inside the container still listens on 5432.

Local configuration:

| Variable | Local value / purpose |
| --- | --- |
| PORT | 3000; API listener |
| DB_HOST | localhost for a host-run API |
| DB_PORT | 5433 for the supplied Docker mapping |
| DB_USERNAME / DB_PASSWORD | Match the local Compose configuration; development credentials only |
| DB_NAME | shopping_db |
| DB_SYNCHRONIZE | true creates/updates mapped development tables; false for migration-managed deployments |
| DB_LOGGING | false normally; true enables TypeORM query logging |
| AUTH_ORIGINS | http://localhost:4200,http://localhost:4300 |
| NODE_ENV | production enables Secure cookies; use HTTPS in that environment |

Configuration is loaded from `.env` then `.env.local` in the backend working directory; do not assume `.env.local` overrides the earlier file. Boolean database flags are enabled only by the string `true`.

## Start the applications

In separate terminals at the repository root:

```sh
npm run backend:dev
npm run admin:dev
npm run shop:dev
```

| Address | Purpose |
| --- | --- |
| http://localhost:3000/api/health | API liveness |
| http://localhost:3000/docs | Generated Swagger UI |
| http://localhost:4300/account | Customer sign-in and registration |
| http://localhost:4200/login | Administrator sign-in |
| http://localhost:5051 | Local pgAdmin |
| localhost:5433 | Host connection to PostgreSQL |

Auth clients currently hard-code localhost:3000. Use `localhost` consistently for browser origins; switching to 127.0.0.1 requires origin and client configuration changes.

## First account and administrator

Customers can register at /account with a name, email, and 12-128 character password. Registration creates a customer.

For local admin setup, set SEED_SUPERADMIN_EMAIL and a unique SEED_SUPERADMIN_PASSWORD in apps/backend/.env, then run:

~~~sh
npm --prefix apps/backend run seed:superadmin
~~~

Open http://localhost:4200/login with those credentials; successful admin authentication redirects to /dashboard. The seed is explicit, refuses production, and never overwrites an existing password or promotes an existing customer. See [superadmin setup](backend/features/superadmin-setup.md).

Both apps now have a Material light/dark toggle that remembers the choice independently per browser origin.

## Database ownership and shutdown

Startup with synchronization enabled manages only the mapped `users` and `auth_sessions` tables. States and districts were provisioned separately; the checked-in district importer assumes both tables and all matching states already exist. A new database does not obtain demographic tables automatically. Read [demographics](backend/features/demographics.md) before using that importer.

Use `docker compose stop` to pause the database or `docker compose down` to remove containers while keeping its volume. The existing root `docker:down` script includes `-v` and deletes the database volume; it is a reset command, not a routine shutdown. Do not reset a database to troubleshoot a connection error.

Build with `npm run backend:build`, `npm run admin:build`, and `npm run shop:build`. Documentation references regenerate before builds. The backend TypeScript dependency must be installed for the documentation generator.

The root backend:dev, admin:dev, and shop:dev commands automatically start a documentation watcher alongside the application. Stop the terminal command with Ctrl+C when finished. Direct per-app start commands do not start that watcher.

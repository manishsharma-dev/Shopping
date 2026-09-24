# Testing, verification, and troubleshooting

## Commands

Run from the repository root unless noted.

| Command | Purpose |
| --- | --- |
| npm run docs:generate | Regenerate current source references |
| npm run docs:check | Check generated freshness, guide review fingerprints, ownership, local links |
| npm run docs:test | Test the documentation tooling with isolated fixtures |
| npm run backend:build | Compile backend; prebuild refreshes references |
| npm run admin:build | Compile admin; prebuild refreshes references |
| npm run shop:build | Compile shop; prebuild refreshes references |
| npm --prefix apps/backend test -- --runInBand | Isolated backend unit test |
| npm --prefix apps/backend run test:e2e -- --runInBand auth.e2e-spec.ts | Auth integration suite using local PostgreSQL |

The existing auth integration suite creates a random auth_test_ schema, synchronizes only the auth entities there, and drops that specific schema afterward. It loads apps/backend/.env using process.loadEnvFile and needs permission to create/drop its test schema. It changes no application users or districts. An interrupted process can leave a test schema behind; inspect ownership/name before removing anything.

## What is covered

Seven auth integration cases collectively exercise registration validation, normalized inputs, role stripping, password/token hashing, duplicate email, unauthenticated/customer/admin access, unknown/wrong credentials, session restoration/expiry/logout, hostile origin/header rejection, and throttling.

The root service unit test checks a scaffold Hello World response in isolation. It is not evidence of a live root route. Existing app.e2e-spec.ts still assumes that route and is outdated. Frontend tests now cover Material auth presentation, registration switching, saved theme preferences, and admin navigation. Do not claim the entire repository test suite is green based on the auth suite alone.

Builds check compilation, not browser runtime, responsiveness, or successful cart dependency injection. The new frontend DOM tests exercise admin redirection and account forms; real-browser visual testing and cart coverage are still separate gaps.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Database connection refused | Compose service, host DB_PORT=5433, credentials, existing database; do not delete the volume |
| users table missing | DB_SYNCHRONIZE setting and environment location; production needs a migration |
| Auth POST returns 403 | X-Shopping-Client:web header and exact AUTH_ORIGINS match |
| Browser says it cannot reach server | API running on localhost:3000, hostname/CORS, network console |
| Login returns 401 | Email/password or expired/missing cookie; unknown and wrong credentials intentionally share response |
| Admin login rejects account | Database role must be admin/superadmin; registration creates customer |
| Auth returns 429 | Wait Retry-After; successes and invalid input count against the same IP window |
| Cookie not sent in deployment | HTTPS for Secure cookie, path /api, credentialed fetch, same-site assumptions |
| UI says signed in after logout elsewhere | Frontend identity is cached with no cross-tab sync |
| Cart navigation errors | Missing CartStore provider and independently constructed root instance |
| District grid shows 100 rows | Query COUNT(*) and viewer pagination |
| docs check reports stale guide | Read affected changes, edit guide as needed, explicitly record its review |

Logs should not include passwords, password hashes, or session cookies. Query public account fields when debugging. Production operational checks need separate database readiness, shared throttling, migrations, backups, and scheduled removal of expired sessions.

## Material UI and local seed checks

Run npm --prefix apps/admin test -- --watch=false and npm --prefix apps/shop test -- --watch=false. Admin tests cover Material fields, signed-out shell and superadmin redirect, signed-out guards, theme switching, and saved dark mode. Shop tests cover registration fields/password length, theme continuity, and account identity. Backend unit tests also cover seeded hash storage, idempotency, non-promotion, and production/invalid-input refusal. A live local seed login was verified against /auth/login, /users, and /auth/logout.

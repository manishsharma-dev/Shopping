# Development superadmin setup

Use this explicit local setup command to provision an administrator without exposing a public role-assignment endpoint.

## Configuration and command

Set SEED_SUPERADMIN_EMAIL and a unique SEED_SUPERADMIN_PASSWORD (12-128 characters) in the ignored apps/backend/.env. The example email is superadmin@shopping.local. No working password is committed to the source or docs.

From the repository root:

```sh
npm --prefix apps/backend run seed:superadmin
```

The command builds the backend, initializes the configured application database, and calls seedSuperadmin. It refuses NODE_ENV=production. Normal application startup does not run this seed. Local credentials created during setup remain in .env; the command never prints passwords.

Open http://localhost:4200/login and sign in using those values. Successful superadmin authentication redirects to /dashboard.

## Files and method behavior

| File / symbol | Behavior |
| --- | --- |
| src/scripts/seed-superadmin.ts / main | Reject production, initialize AppModule, load seed settings with ConfigService, call helper, print created/exists plus email, close the context |
| auth/seed-superadmin.ts / seedSuperadmin | Validate environment, normalize/validate email and password length, check account, create only if absent |
| auth/auth.service.ts / hashPassword | Generate 16-byte salt and the same scrypt hash used by customer registration |
| auth/seed-superadmin.spec.ts | Creation/hash, idempotency, no customer promotion, production/config rejection tests |

A new account has name Super Admin and role superadmin. Existing superadmins are returned with status exists, without resetting the password. An existing non-superadmin using that email causes an error; the seed never silently promotes accounts. No new table, DTO, controller, or HTTP endpoint is introduced.

If the command says exists, the configured password is not necessarily the existing account's password. Do not assume rerunning the seed changes credentials. Use an intentional credential-management process or a different unused local seed email.

## Design choice

An explicit, environment-configured development command gives a new local workspace a usable administrator while keeping privileged creation out of public registration. Production administration provisioning remains a separately managed operation.

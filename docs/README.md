# Shopping application documentation

Start here if you are joining the project. This repository contains three applications: a NestJS API, an Angular administration app, and an Angular customer storefront. PostgreSQL stores authentication, marketplace management records and geographic reference data.

## Reading order

1. [Getting started](getting-started.md): run the apps, configure the database, create an administrator.
2. [Architecture and terminology](architecture.md): understand the request flow and repository layout.
3. [Feature status](feature-status.md): distinguish working functionality from demonstrations.
4. [Backend guide](backend/README.md): tables, DTOs, services, controllers, and security.
5. [Frontend guide](frontend/README.md): admin and shop routes, components, state, and API calls.
6. [Testing and troubleshooting](testing.md): validation commands and known gaps.
7. [Design decisions](design-decisions.md): reasons and tradeoffs.
8. [Keeping documentation current](maintenance.md): generation, watching, review, and CI.

## Documentation layers

Feature guides explain behavior, intent, examples, and limitations. File references under each application's `generated/files` directory mirror individual source paths and extract declarations and members, with a complete source snapshot for exact implementation details. Follow the file-reference indexes from the backend and frontend guides.

Generated references describe code on disk, not a running deployment. Database tables in [the database guide](backend/database.md) were checked against the local database on 2026-09-24. Counts are observations, not requirements. Never copy real passwords, cookies, or private `.env` values into documentation.

Authentication and scoped vendor/product/admin workflows are implemented. Customer checkout and payments remain placeholders. See [management](backend/features/management.md) and the feature status for precise boundaries.

[Operations and documentation-tooling file references](generated/README.md) cover Compose, root scripts, the importer, CI, and repository instructions.

[User Types and hierarchy](backend/features/user-types.md) describes the current administration and mandatory vendor approval workflow. Public vendor/Agent registration is deferred.

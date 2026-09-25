# Backend guide

The backend uses NestJS modules and TypeORM with PostgreSQL. Start with [runtime and configuration](runtime.md), then [database tables](database.md) and [API contracts](api.md).

## Features

- [Local superadmin setup](features/superadmin-setup.md): explicit development seed and account behavior.
- [Authentication](features/authentication.md): DTO rules, every service method, controller actions, guards, middleware, sessions.
- [Users](features/users.md): persistent user listing and role checks.
- [Catalog](features/catalog.md): persisted public products from active vendors.
- [Vendors](features/vendors.md): scoped persistent vendor data.
- [Health](features/health.md): liveness response and limitations.
- [Demographics](features/demographics.md): states, districts, and the transactional importer.

## File-by-file reference

[Generated backend file index](generated/README.md) contains one document per source, test, and configuration file, preserving its repository path. Each TypeScript reference lists imports, declarations, class members, decorators, source links, and the current implementation. Read the feature guide first for meaning; use the reference to inspect exact fields and methods.

There is no DTO or service for features that only return static controller data. This is explicitly stated in their guides rather than inventing a layer that does not exist.

- [Scoped management](features/management.md): User Types, regional/vendor scope, applications, products, fields, orders and audit.

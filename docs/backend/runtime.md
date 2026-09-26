# Backend runtime and supporting files

## main.ts

`bootstrap()` creates a Nest application from AppModule, enables credentialed CORS for allowedOrigins, prefixes API routes with `api`, and installs ValidationPipe with `whitelist: true` and `transform: true`. Unknown DTO fields are removed rather than rejected. DTO transformations normalize email/name before controller logic.

Swagger is exposed at `/docs`, outside the API prefix. The document is titled Shopping API, version 1.0, with a shopping tag. The DTOs have validation decorators but no explicit Swagger property metadata/plugin configuration, so do not assume the UI fully documents request bodies or the required custom header. Use [API contracts](api.md).

The port is `Number(process.env.PORT ?? 3000)`. Startup logs the listener address. There is no configured proxy trust, global exception filter, graceful-shutdown hook, or global authentication guard.

## app.module.ts

ConfigModule is global. TypeOrmModule.forRootAsync reads connection settings through ConfigService. Entities registered by imported feature modules are auto-loaded. DB_SYNCHRONIZE and DB_LOGGING are parsed by comparing their string values to `true`; their code defaults are false. The sample environment enables development synchronization.

Imports include AuthModule, ManagementModule, HealthModule, CatalogModule, UsersModule, and VendorsModule. ManagementModule registers management_records and the scoped administration service; its controller uses the same POST header/origin middleware as auth. The database must be reachable for normal application initialization.

## Scaffold root files

`app.controller.ts` defines AppController.getHello(), delegating to `app.service.ts`'s AppService.getHello(), which returns Hello World. Neither is registered in AppModule. Their existence does not create a live root endpoint. The isolated unit test constructs them directly and can pass while the old root end-to-end test is incompatible with runtime routing.

## Tooling files

| File | Role |
| --- | --- |
| package.json | Nest build/start scripts, Jest tests, oxlint, Prettier, dependencies |
| nest-cli.json | src root, deletes dist before build |
| tsconfig.json | Strict TypeScript, NodeNext modules, decorator metadata, declarations |
| tsconfig.build.json | Builds src only; excludes tests and spec files |
| jest.config.ts | Unit-test discovery and ts-jest transformation |
| test/jest-e2e.json | Separate e2e discovery and ts-jest |
| .env.example | Public configuration template; not a deployed environment |

See the [generated file index](generated/README.md) for exact current contents. No secrets are read into generated documentation.

## Explicit development seed

src/scripts/seed-superadmin.ts is a CLI entrypoint, not an HTTP route or an automatic bootstrap provider. npm run seed:superadmin builds and runs it. It rejects production before database initialization, and its helper validates again. Configuration comes from SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD. See [setup](features/superadmin-setup.md).

## User Type initialization

ManagementService.onModuleInit initializes missing stable default type records under the management transaction lock. This runs during normal module initialization and requires the existing management_records schema. It never creates user accounts and preserves soft-deleted definitions. Geography lookup reads separately provisioned public reference tables. See [User Types](features/user-types.md).

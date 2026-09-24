# Health feature

`health.module.ts` registers HealthController. `health.controller.ts` exposes public GET /api/health. getHealth() returns status:ok, service:shopping-backend, and a new ISO timestamp.

There are no tables, DTOs, services, authentication checks, or external probes for this feature. It indicates that the HTTP process can answer this controller request. Although normal startup requires the database connection, this endpoint does not query the database and cannot establish ongoing database readiness.

This small endpoint supports local smoke checks. If readiness checks are added, document which dependencies they probe, timeout behavior, and whether failure affects load-balancer routing.

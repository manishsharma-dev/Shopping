# Design decisions and tradeoffs

These explanations record the rationale visible in the implementation and the intended maintenance consequences. Where no historical decision record exists, they are an architectural interpretation, not a claim that a formal comparison took place.

| Decision | Reason | Cost / follow-up |
| --- | --- | --- |
| NestJS feature modules | Group transport, dependencies, and behavior by feature | Global AuthModule introduces implicit availability/coupling |
| PostgreSQL + TypeORM | Typed entity/repository access and relational constraints | Production migration workflow is not yet implemented |
| Separate admin/shop apps | Different audiences, navigation, and independent builds | Duplicate auth clients and separate deployment configuration |
| Email normalization | Consistent normal HTTP login/registration identity | Direct SQL can bypass normalization; DB uniqueness is case-sensitive |
| Salted scrypt | Password verification without plain-text storage; built-in Node crypto | Parameter tuning/algorithm versioning may be needed later |
| Server-stored random sessions | Revoke current session immediately and reload current role | Database reads on protected requests; no automatic renewal |
| Token hashing | Stored session rows do not contain browser bearer credentials | Raw token cannot be recovered; create a new session instead |
| HttpOnly cookie | Frontend code need not manage bearer tokens | Requires credentialed fetch, origin controls, and same-site deployment |
| Explicit publicUser projection | Stable limited account response | Additions must be coordinated with frontend SessionUser |
| Customer-only registration | Avoid user-selected privilege escalation | First local admin is provisioned by an explicit environment-configured seed |
| AuthGuard then AdminGuard | Separate identity validation from permission checks | Every new protected endpoint must apply the right guard chain |
| Per-process request limiter | Small first implementation without another service | Not shared across replicas; restart resets limits; proxy IP handling needed |
| Scoped management records | Persist vendor/product/access workflows with shared ownership columns and validated JSON payloads | Service-enforced references; requires pagination and normalized high-volume tables when scaling |
| Transactional district staging | Validate state mappings and all rows before commit | Requires pre-existing table/state setup and does not reconcile geography |
| Generated references + reviewed guides | Keep exact source details current and preserve human explanation | Authors still review rationale when code changes |

## Changes that require revisiting decisions

A mobile or third-party API client may need a different credential transport. Multiple backend instances require shared throttling and operational session cleanup. Vendor self-service requires tenant/ownership authorization beyond the current administrator check. Product/orders require money, inventory, transaction, and idempotency rules. Cross-site frontend deployment requires explicit cookie/CORS/CSRF redesign.

Do not silently change these contracts while adding a page. Update the feature guide, tests, database plan, and both frontend clients where applicable.

Material components and color-scheme tokens now provide consistent light/dark forms. An explicit local-only superadmin seed makes development login usable without a privileged public registration path. See [theming](frontend/theming.md) and [seed setup](backend/features/superadmin-setup.md).

## Scoped marketplace management

Fixed administrative levels set delegation authority; named User Types grant vendor capabilities within immutable assigned scope. Exact-region checks and vendor IDs are enforced on server reads and writes. Custom product fields are typed immutable definitions, preserving historical interpretation. Money uses integer INR minor units and orders capture discounted unit prices. Advisory-locked transactions couple stock, lifecycle changes and audit writes; version checks reject stale edits. This limits write throughput deliberately. Product deletion archives history; collections do not yet implement purchasable kits. See [management rationale and limitations](backend/features/management.md).

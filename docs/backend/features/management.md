# Scoped administration and marketplace management

## Ownership and design

ManagementModule owns `management_records`, its JSON payload rules, transactions, permission checks and the `/api/manage` controller. It imports the existing User repository and globally exported AuthGuard. CatalogModule and VendorsModule delegate to ManagementService. Admin ManagementPage uses these contracts; the customer account embeds VendorApplication.

User type is a named capability set, distinct from the fixed administrative level (`role`) and server-assigned scope. This prevents a custom type from granting platform authority. Platform and vendor administrators create custom staff types; regional levels are assigned by a superior. Public registration always creates a customer.

| Level | Scope and delegation |
| --- | --- |
| superadmin | Entire platform; can create admin and all lower levels; no HTTP superadmin creation |
| admin | Entire platform; can create state/district/vendor admins, staff, customers |
| state_admin | Exact assigned state; can create district/vendor admins and staff within it |
| district_admin | Exact assigned state AND district; can create vendor admins and staff there |
| vendor_admin | One approved, active vendor; can create vendor-local types and staff |
| staff / legacy vendor | One active vendor and an active assigned custom type; only granted capabilities |
| customer | Own vendor application only; no admin snapshot |

Geography currently uses trimmed exact state/district names, not foreign keys to the separately imported demographic tables. Use the same official spelling when assigning regions and applying. No geographic dropdown, normalization of aliases, or automatic correction exists. Platform administrators can see applications that have unmatched names.

Permissions are `products`, `categories` (also custom-field definitions), `orders_accept`, `orders_manage`, `team`, and `reports`. Global types and categories are reusable by vendors. Custom type permissions are read from storage on every management request. A delegating staff member with `team` cannot assign permissions absent from their own type. Type creation itself requires platform or vendor_admin. Blocking accounts reloads on authentication, immediately denying existing sessions; blocking a vendor denies its team's management access and removes its products from public catalog.

## Tables and payloads

`users` gains non-null userType varchar(100), default Customer; optional userTypeId UUID, state/district varchar, vendorId UUID; active boolean default true. Existing non-customer labels are backfilled by the upgrade SQL; publicUser also derives a readable label for legacy Customer defaults. All public account projections include type, scope and active status, never password hashes. The custom userTypeId references a type record logically; the saved name is an immutable snapshot.

`management_records` has UUID id; kind varchar; name varchar(150); status varchar default active; nullable state/district varchar and vendorId UUID; createdBy UUID; data JSONB default {}; integer version default 1; createdAt/updatedAt timestamps. Composite indexes cover kind/vendorId and kind/state/district. A vendor row's vendorId equals its own ID. Shared types/categories have null scope. Audit rows copy the target's scope.

| kind | data rules |
| --- | --- |
| vendor | contactEmail, phone (1-30), address (1-1000); application ownerId; status-change reason |
| type | Unique list of known permissions; name and permissions immutable after creation |
| category | Optional description up to 1000; immutable after creation |
| field | type text/number/boolean/choice, required boolean, choice options (1-50 distinct values); immutable |
| product | Unique vendor SKU up to 80, categoryId, description 1-10000, optional brand up to 100 and HTTPS imageUrl up to 2000; priceMinor integer 0-100000000, INR currency, discountPercent 0-100, stock/lowStock integers 0-1000000; validated fields object and bundleIds |
| order | Immutable line snapshots: productId, name, quantity and discounted unitMinor; totalMinor safe integer, INR currency, source manual; transition reason |
| audit | targetId, actorName and optional reason; append-only through API |

Relations inside JSON and user scope columns are validated by the service rather than database foreign keys. Direct database writes bypass these constraints and must not be treated as a supported integration API. Shared typed records keep the initial workflow small; a larger deployment should split high-volume orders/products and add query pagination and relational constraints. Reads currently load records into memory and filter before returning; no pagination is implemented. Audit responses return the newest 100 entries in scope; the table itself retains older entries.

## Request contracts and validation

Every `/manage` endpoint requires the session cookie. POST also requires `Content-Type: application/json` and `X-Shopping-Client: web`; the existing origin-check middleware covers ManagementController. Its login/register rate limiter does not throttle these business endpoints. DTO `ManagementDto` requires an object `data`, with optional positive integer `version`. The service validates allowed values, lengths, numbers, reference ownership, and transitions; unused properties are ignored and never spread into persistence. Text trims; passwords retain their exact characters.

| Method/path | Contract |
| --- | --- |
| GET /manage | Snapshot: permissions, scoped users/vendors/types/categories/fields/products/orders/audit, nullable stats; optional exact state, district, vendorId filters narrow authorized scope |
| GET /manage/applications | Only vendor rows created by the current user, newest first |
| POST /manage/apply | data: name, state, district, phone, address; customer without vendor only; contact email comes from account; pending application; duplicate non-rejected application is 409 |
| POST /manage/users | data: name, email, password (12-128), role; state/district for regional admins; vendorId for vendor team; userTypeId required for staff; scope forced from vendor for vendor teams |
| POST /manage/users/:id/status | data: active boolean, reason; team capability plus strictly lower rank and same scope; self-blocking forbidden |
| POST /manage/vendor | data: name, state, district, contactEmail, phone, address; regional/platform only; creates active vendor, then create vendor_admin via users endpoint |
| POST /manage/type | data: name, optional vendorId, permissions; global only for platform; vendor admins forced to own vendor |
| POST /manage/category | data: name, optional vendorId, description; platform may create shared category |
| POST /manage/field | data: name, vendorId, type, required, options for choice; categories capability |
| POST /manage/product | data: name, vendorId and all required product payload fields above; status draft/active/inactive |
| POST /manage/order | data: name (internal reference), vendorId, lines [{productId,quantity}]; 1-100 distinct standalone active vendor products; orders_manage |
| POST /manage/:kind/:id | Full product save or lifecycle change with expected version; immutable types/categories/fields reject edits |

Product update resubmits the complete product payload; ownership never changes. For platform/regional moderation send `{data:{action:'moderate',status,reason},version}`; statuses active/flagged/inactive/blocked/deleted. Deleted means archived, preserving history; there is no hard-delete endpoint. Vendors cannot edit flagged/blocked/deleted products or remove the restriction. A superior can restore the status. Saving a normal product retains only its validated payload.

Vendor transitions: pending to active/rejected, active to blocked, blocked to active. All transitions need a reason and expected version. Approval promotes the still-eligible customer owner to vendor_admin in the same transaction. Rejected applicants may apply again. Existing manually created vendors do not automatically create an account.

Order transitions: pending to accepted/cancelled; accepted to processing/cancelled; processing to shipped/cancelled; shipped to fulfilled. Terminal states cannot transition. Acceptance uses orders_accept; all other changes use orders_manage. Transition reasons are required. The API supports multiple lines; the initial admin form records one product per order. No customer private contact data is collected in the order record.

## Product flexibility, grouping, discounts

A vendor defines fields before editing products. Required fields apply to every future product save for that vendor; adding one does not rewrite existing products. Optional fields can be omitted. Unknown field IDs, wrong primitive types, invalid choices, non-finite numbers, and overlong text are rejected. Definitions are immutable to preserve historical meaning; no delete/rename or category-specific applicability editor is provided yet.

Bundle IDs group up to 20 active, non-bundle products from the same vendor. These are merchandising collections, not purchasable stock-depleting kits: manual orders reject collections and do not implement component stock or prorated kit discounts. A product has its own percentage discount; prices are stored in minor INR units and order unit prices are rounded once before multiplication.

## Service methods, consistency and security

`write` opens a database transaction and obtains a shared PostgreSQL advisory transaction lock. Every management mutation, stock change, approval/promotion and audit write participates. It re-reads the actor, so blocking during an earlier queued operation is enforced. `rows`, `actor`, `access`, `permit`, and `audit` provide loading, identity refresh, permission resolution, enforcement and audit creation. `inScope`/`requireScope` implement the hierarchy; filters cannot widen it. `snapshot`, `applications`, and `catalog` expose separate authorized projections. `createUser` hashes outside the transaction then checks current actor and delegation inside it; `userStatus` validates hierarchy. `save` handles kind-specific normalization and lifecycle changes. `apply` submits customer applications.

Version checks prevent a stale product edit from overwriting a later order's stock adjustment. An order reserves stock in the creation transaction, and cancellation restores it once. Duplicate product lines, insufficient stock, unsafe totals and a failing later line roll back the entire transaction. This global serialization is deliberately conservative and limits write throughput; replace it with ordered row locks and narrower transactions when scaling. There is no external write API or idempotency-key support; a retry after a lost successful response can create another manual order.

Errors: 400 for invalid payload or transition, 401 for missing/blocked/expired session, 403 for insufficient role/permission/scope/header/origin, 404 for missing editable record, 409 for duplicate email/SKU/application, stale version or insufficient stock. Business endpoints do not currently normalize every malformed UUID database error into 400.

## Schema upgrade and rollback

For development, restart with DB_SYNCHRONIZE=true. For deployments with synchronization disabled, review and apply `apps/backend/src/database/management-upgrade.sql` before the new API starts. It adds columns, backfills labels, creates the records table and indexes inside a transaction; it preserves users and auth sessions. The SQL lives under the already-scanned src root and is owned by the management docs group. It is a manual additive upgrade, not an automated production migration runner.

Back up before applying in a deployed environment. Roll back the application while retaining additive columns/table; dropping them destroys user assignments and business history. Existing vendor-role accounts have no automatic vendor assignment and require intentional provisioning; they cannot gain scope just from their legacy role name.

## Verification and remaining work

`management.e2e-spec.ts` creates and removes only a random isolated PostgreSQL schema. It exercises header/origin/session protection, scope/filter isolation, approval/promotion, permission limits, field validation, SKU and price rules, concurrent stock reservation, cancellation, stale versions, moderation and blocking. It does not run against live business rows.

Additional implemented dashboard features: required action reasons, activity history, low-stock and flagged-product counts, pending vendor/order queues, account blocking and safe archiving. Useful next additions: MFA/password reset, invitation-based staff onboarding, verified geography dropdowns, vendor document review, category field templates, image uploads, tax/shipping, returns/refunds, exports and notifications. These are suggestions, not completed integrations. Checkout/payments, purchasable kits, scheduled promotions, configurable currencies and report exports remain unimplemented.

## Changing staff types

POST /manage/users/:id/type takes data.userTypeId and reason. A scoped platform/regional/vendor administrator with team permission can reassign a staff or legacy vendor account to an active shared or same-vendor type. Cross-vendor types and non-staff targets are rejected. assignType writes the new ID/display label with an audit event transactionally; subsequent requests use the new permissions. Admin Users exposes Change user type with a permitted-type selector and required reason. Types themselves remain immutable.

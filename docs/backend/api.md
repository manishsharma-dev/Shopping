# HTTP API contracts

Local base URL is http://localhost:3000/api. Auth and management POST requests require JSON and `X-Shopping-Client: web`. Browser requests must use `credentials: 'include'` and an allowed Origin. Authentication uses the HttpOnly shopping_session cookie, path /api, SameSite=Lax, eight-hour expiry, Secure in production. Neither passwords nor raw session tokens appear in responses.

| Endpoint | Behavior and access |
| --- | --- |
| POST /auth/register | name, email, password; creates customer with User Type Customer; returns {user} plus cookie |
| POST /auth/login | email/password; returns {user} plus cookie; blocked accounts rejected |
| GET /auth/me | Current database-backed public identity; requires valid active account/session |
| POST /auth/logout | Idempotent current-session revocation; 204 and clear cookie |
| GET /users | Legacy latest-100 user list; admin/superadmin only; {data: publicUser[]} |
| GET /vendors | Live scoped vendors via management permissions; {data: vendor[]} |
| GET /catalog | Public active products of active vendors only; {items}; discounted INR prices |
| GET /manage | Live scoped administration snapshot and optional exact state/district/vendorId filters |
| GET /manage/applications | Current user's own submitted vendor records |
| POST /manage/apply | Disabled for future vendor self-registration; 403 |
| POST /manage/users | Authorized subordinate account creation with level/type/scope |
| POST /manage/users/:id/status | Subordinate account activation/blocking with reason |
| POST /manage/:kind | Create vendor/type/category/field/product/manual order |
| POST /manage/:kind/:id | Version-checked product edits or vendor/product/order status changes |
| GET /health | Public liveness response |

See [management contracts](features/management.md) for all kind-specific request fields, DTO validation, permissions, lifecycle transitions, status codes, and persistence. Business POST bodies use `{data:{...},version?:positiveInteger}`; expected version is mandatory for existing records. Categories/fields remain immutable; unused subordinate types support versioned soft deletion, while Super Admin and Admin are protected. No HTTP endpoint grants superadmin.

Public users include id, name, email, role, userType, nullable userTypeId/state/district/vendorId, and active. role is one of customer/superadmin/admin/state_admin/district_admin/vendor_admin/vendor/staff/agent. Account creation and administrative scope are server-managed; public registration ignores supplied roles/types/scopes. The legacy users endpoint is still limited to 100 rows; management listing uses a separate permission-aware snapshot.

Catalog items expose id, name, sku, description, discounted price in major INR units, currency, imageUrl, stock. Internal custom fields, moderation reasons, vendor contact information and audit records are not public. No storefront order/payment endpoint exists.

Auth errors: 400 invalid input, 401 unknown/wrong password or invalid/expired/blocked session, 403 untrusted header/origin or insufficient role, 409 duplicate email, 429 auth throttle. Management adds 404 missing record and 409 stale version/stock conflict. Nest error messages may be strings or arrays. Auth token/session behavior and normalization are detailed in [authentication](features/authentication.md). Swagger is supplementary; explicit guide contracts are authoritative for this implementation.

POST /manage/users/:id/type reassigns a scoped subordinate account at the same hierarchy level to an existing permitted User Type using data.userTypeId and reason; see the management guide.

GET /manage/access returns effective permissions, hierarchy and vendorStatus. GET /manage/geography returns reference states and districts. User creation requires userTypeId, never creates customers and validates state/district assignments; every vendor requires recorded approval. See [User Types](features/user-types.md).

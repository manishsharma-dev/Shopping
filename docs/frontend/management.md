# Administration workspace

## Routes, state and access

`pages/management/management.component.ts/html/scss` implements live `/dashboard`, `/users`, `/vendors`, `/products`, `/settings`, `/roles`, and `/orders`. These routes use adminGuard and route data `section`. The login, guard and shell admit platform admins, state/district admins, vendor admins, legacy vendor accounts and staff; the backend determines actual access, including approved vendor and active user type. Customers cannot enter the admin workspace. The sidebar displays the public User Type with a legacy role fallback.

The page owns snapshot/busy/error/notice signals, filter strings, formKind, editing row/version, draft, custom field values, permission and collection selections, and a pending action/reason. No business records or secrets are saved in localStorage. Auth and theme behavior retain their existing services. Root routes render loading, empty, error and success states.

| Screen | Behavior |
| --- | --- |
| Dashboard | Server metrics for authorized scope; fulfilled manual sales in INR; recent 100 audit events |
| Users | Live name/email/User Type/administrative level/region/status; subordinate creation and block/activate with reason |
| Vendors | Active/pending/rejected/blocked records; regional creation, approval, rejection, blocking/reactivation |
| User types | Shared or vendor-local immutable permission sets; platform/vendor administrators create them |
| Categories & fields | Shared/vendor categories; reusable text/number/boolean/choice product fields; required flag and comma-separated choices |
| Products | Comprehensive product create/edit form, stock, discounts, custom fields, collections, moderation and archive actions |
| Orders | Manual order capture (one product in UI), state transitions, reserved stock and cancellation recovery |

Upper administrators have exact state/district filters and a vendor dropdown. Filters narrow server-authorized scope. Geography is currently text-based; use consistent official names. Vendor accounts are forced to their own vendor server-side. Staff see forms/actions according to returned permissions. Some hierarchy-dependent buttons can still receive a server 403 (for example blocking a peer); this is shown as an error rather than granting access.

## Members and forms

`request` uses credentialed fetch at localhost:3000/api/manage, adds the custom header for POST, parses error messages, and rejects unsuccessful responses. `load` fetches a filtered snapshot with loading/error feedback. `start` opens a blank or existing draft and captures the record version; `cancel` clears the form and password draft. `save` converts rupee inputs to integer minor units, builds permission/field/collection payloads, sends create/update, and reloads after success. Errors preserve the unsaved form. `action` stages a lifecycle change; `confirmAction` requires a reason, posts the version and action, and refreshes. `nextStatuses` maps legal order transitions. `roles`, `can`, `isRegional`, `canCreateType`, `vendorFields`, `vendorProducts`, `availableCategories`, and `availableTypes` control form choices and presentation.

Product form: name, description, vendor, SKU, brand, category, draft/active/inactive, INR price, discount percentage, stock, low-stock threshold, HTTPS image URL, product grouping and dynamically typed fields. Optional fields may be left unset. Required vendor fields apply on subsequent product saves, including older products. Text fields use max lengths and numeric controls supply minima/steps; the server independently validates all inputs and references. No raw JSON editor is exposed.

User creation separates administrative level from custom User Type. Built-in levels receive a readable type label; staff select an existing permitted type. A vendor administrator can reuse shared types or create their own. Password entry is masked, requires 12-128 characters, and is cleared with the draft after saving; no invitation/reset mail workflow exists.

The API checks expected version for all record changes. A stale edit leaves the draft visible with a reload instruction. Moderation, account blocking and vendor/order changes use an inline confirmation form with mandatory reason. Product deletion is labeled Archive and preserves history.

## Design and limitations

Material buttons, inherited color tokens, labeled native inputs/selects, responsive card/form grids and scrollable tables provide a small accessible management surface without new dependencies. No automated accessibility audit or full browser visual review has been completed. The form appears below the record list; it is not a modal. Snapshot loading currently fetches all records the service needs and does not paginate. There is no report export, bulk editor, upload service or category-specific field template yet.

The earlier standalone dashboard/users/vendors/products/settings components remain unreferenced historical scaffolds; routes no longer render them. Do not interpret their sample data as live behavior. The unused SessionStore is also retained; it cannot authorize requests.

Component tests cover dynamic fields, currency payload conversion, preserving a rejected stale draft and permission separation. Existing tests cover sign-in, guards, shell and theme. Backend integration tests validate the actual security and stock boundaries; see [management guide](../backend/features/management.md) for data/API details and remaining commerce limitations.

User type reassignment uses typeTarget/typeId state and changeType(), which posts a permitted shared/vendor type plus reason, then reloads. The Users screen exposes this for staff/legacy vendor accounts to platform, regional and vendor administrators with team capability.

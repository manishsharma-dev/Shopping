# Feature status and known gaps

| Feature | Backend | Admin frontend | Shop frontend |
| --- | --- | --- | --- |
| Authentication/theme | Cookie sessions, active account enforcement, local superadmin seed | Material login and light/dark theme | Registration/login and theme |
| Users and User Types | Hierarchical User Types, protected defaults, lower-only creation, scope and blocking | Dynamic permission menus; subordinate creation; safe type deletion; block/activate | Public identity shows User Type |
| Vendors | All vendors pending until approved; scoped Agent submissions; approval/rejection and blocking | Live regional approval queue and creation | Vendor/Agent registration deferred |
| Products/categories | Persistent products, categories, typed custom fields, discounts, grouping, moderation | Live comprehensive form and moderation | Live public catalog |
| Dashboard | Scoped counts, low stock, flagged/pending queues, fulfilled manual sales, audit | Regional/vendor filters and activity table | Not applicable |
| Orders | Transactional manual orders, stock reservation/recovery, lifecycle permissions | One-line capture and lifecycle actions | No checkout/order submission |
| Settings | Shared/vendor categories and field definitions | Editors for categories and fields | Not applicable |
| Cart/checkout/payments | No customer order/payment API | No refunds, payments or returns | Existing cart provider scaffold and placeholder checkout remain |
| Geography | Existing imported tables; management validates assignments against reference geography | Required state/district selectors | Not available |

See [management](backend/features/management.md) for exact permission, data and API boundaries and [workspace](frontend/management.md) for UI behavior. Product collections are merchandising groups, not purchasable inventory kits. No image upload, scheduled promotions, report export, pagination, notifications, MFA/password reset or tax/shipping configuration is implemented. Old unreferenced admin components still contain examples but are no longer routed.

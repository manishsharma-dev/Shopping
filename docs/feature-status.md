# Feature status and known gaps

| Feature | Backend | Admin frontend | Shop frontend |
| --- | --- | --- | --- |
| Material appearance | Not applicable | Responsive login and workspace theme toggle | Material account forms and header theme toggle |
| Local superadmin seed | Explicit development command; no password reset/promotion | Seeded superadmin can sign in and reach dashboard | Not applicable |
| Email/password auth | Registration, login, logout, session lookup, validation, throttling | Login, restore, role-aware navigation, logout | Register, login, restore, logout |
| Users | Real DB list, latest 100, admin-only | Static role counts; no API call | Public account identity only |
| Vendors | Admin-only static example response | Static cards | No vendor workflow |
| Catalog/products | Public static example response | Static product cards | Static catalog; buttons have no handlers |
| Dashboard | No metrics/report endpoint | Fixed sample statistics; export inactive | Not applicable |
| Cart | No tables or endpoints | Not applicable | In-memory store scaffold; provider wiring is incomplete |
| Checkout/orders | No order/payment/address implementation | No order management | Static address; place-order button inactive |
| Settings | No configuration API/table | Static list | Not applicable |
| Geography | Existing states/districts tables and SQL importer | No UI | No address selector/API |
| Health | Process liveness response | No status page | No status page |

## Existing issues documented during inspection

- CartPage injects CartStore, but the store is not registered as a provider. App creates a separate instance with `new CartStore()`. Navigation to the cart can fail dependency injection; the header's demonstration cart is not a shared cart service.
- The old admin SessionStore is unused by live authentication. Its login method only changes local state.
- The old backend app end-to-end test expects a root Hello World endpoint, but AppController is not registered in AppModule.
- Cached frontend session state has no periodic expiry check or cross-tab synchronization. Backend expiry remains authoritative.
- Registration saves the user and then the session without a shared transaction; a session-write failure can leave a created account.
- No email verification, password recovery/change, MFA, session management screen, or all-device logout exists.
- Database migration files and a complete fresh-database demographics bootstrap are not yet provided.

These are observed implementation limits, not changes made by the documentation work. Future fixes should update both this status page and the relevant feature guide.

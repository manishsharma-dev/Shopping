# Frontend guide

The admin and storefront are independent Angular standalone applications. Both use signals for auth UI state and browser fetch for the auth API. Neither browser app owns database tables or backend controllers. Frontend request objects correspond to backend DTOs; see [API contracts](../backend/api.md).

- [Material theme and dark/light mode](theming.md)
- [Shared auth contract and service methods](authentication.md)
- [Admin shell, routes, login, and every page](admin.md)
- [Storefront shell, account, catalog, cart, and checkout](shop.md)
- [Frontend design decisions and extension workflow](design.md)
- [Admin file-by-file reference](admin/generated/README.md)
- [Shop file-by-file reference](shop/generated/README.md)

Each generated file document includes current imports, component/class members, declarations, and source. The two auth service copies are documented separately in those indexes even though their current behavior is the same.

- [Live administration workspace](management.md): forms, permissions, state, routes and validation.

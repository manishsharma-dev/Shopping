# Administration application

The standalone Angular app bootstraps App with router and theme configuration. App owns permission-filtered navigation, logout feedback and the authenticated shell; LoginPage retains the Material sign-in form. Successful admin, regional, agent, vendor or staff login goes to `/dashboard`; customer login is rejected and signed out. API permission checks remain authoritative for active accounts, approved vendor scope and custom types.

The live pages and every form/state method are described in [Administration workspace](management.md). Routes `/dashboard`, `/users`, `/vendors`, `/products`, `/settings`, `/roles`, and `/orders` all use ManagementPage with a section value and adminGuard. Root redirects to dashboard. Login remains full-width with the drawer closed. Navigation is eager; no wildcard route or returnUrl handling exists.

AuthService restores a cookie session before the guard permits entry. A cached frontend identity can outlive a revoked server session; management requests independently reject invalid access. The shell shows User Type with legacy role fallback. Logout awaits the server before navigating and shows failures without pretending success.

The old standalone demonstration page classes and unused NgRx SessionStore remain on disk but are not routed. The legacy store cannot grant trusted identity. Settings now means categories and custom product fields, not a functional tax, shipping or security settings editor.

See [authentication](authentication.md), [Material theme](theming.md), [backend management](../backend/features/management.md), and [generated files](admin/generated/README.md). DOM tests cover login/theme plus the management forms; build success alone does not establish full browser or accessibility verification.

## Responsive sidebar

App uses the existing Angular Material sidenav container. Above 960px, the 280px vertical sidebar starts open in side mode; the header menu button and panel close button slide it out/in while the main content adjusts its width. At 960px and below, the sidebar starts closed and opens in over mode above full-width content with a backdrop. Its width is capped at viewport width minus 48px, and its navigation remains vertical.

BreakpointObserver drives compact; desktopOpen and mobileOpen store separate in-memory choices. sidebarOpen combines workspace access with the active choice; setSidebarOpen changes it; closeMobileSidebar handles links (including the current route). NavigationEnd also closes the mobile drawer. Changing breakpoints closes the mobile drawer and retains the desktop choice. Subscriptions use takeUntilDestroyed. This preference is not persisted across reloads.

Material handles focus trapping, focus restoration, backdrop and Escape dismissal in overlay mode. The toggle exposes aria-expanded/aria-controls; the mobile panel is labeled as a dialog when visible. The header remains sticky in the independently scrolling main area, and long sidebar content scrolls within the drawer. Authenticated shell styles now live in app.scss; global styles retain the theme, base elements and scoped reduced-motion transition overrides. The router outlet stays mounted during toggling/resizing so unsaved page state survives. APIs, account permissions and data contracts are unchanged.

Component tests exercise desktop toggling, mobile overlay/backdrop/Escape/navigation dismissal, and desktop preference retention after responsive mode changes, alongside existing auth/theme coverage. These verify interaction and mode selection, not pixel-perfect screenshots at every viewport.

## Dynamic navigation

AccessService requests /manage/access during every guarded navigation. Its computed menu includes only permitted pages; Dashboard remains a common landing page. A hidden page also rejects direct navigation through adminGuard. The service keys cached permissions to the current account and clears them before refresh or on failure. ManagementPage snapshots refresh the same state. Menu items are no longer a fixed App array. Types and users are defined by the [hierarchy policy](../backend/features/user-types.md).

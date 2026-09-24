# Frontend design and extension

Standalone components keep each page's imports explicit and avoid introducing an Angular feature module for every small screen. Signals are used for auth state and async feedback; template-driven forms keep the initial two forms understandable. These are explanations of the current implementation, not an assertion that other forms/state approaches were evaluated historically.

## Layer responsibilities

Components own UI state, form mode, disabled/loading behavior, and navigation. AuthService owns HTTP details and identity state. The backend owns password validation, sessions, roles, and table access. A browser must never connect directly to PostgreSQL or treat a locally changed role as authorization.

The two apps deliberately have separate entrypoints, routes, builds, and styles so customer and administration experiences can evolve independently. The current auth-client duplication is a maintenance cost; both copies must follow the same response/header/cookie contract.

## Adding a real feature

1. Specify the server contract, DTOs, authorization, and storage behavior.
2. Add a frontend API service with pending/error states and explicit response types.
3. Connect a component to that service; remove contradictory hard-coded samples.
4. Register the route and appropriate navigation guard.
5. Define shared state/provider lifetime if multiple components consume it.
6. Verify loading, signed-out, permission-denied, empty, failure, and success states.
7. Update the relevant frontend/backend guides and docs ownership mapping; regenerate references and run the freshness check.

For cart work, fix provider scope first and decide whether the state is account-backed, browser-local, or session-local. For price/order work, the server must validate quantities and monetary values independently of browser display.

## Styling and deployment constraints

Global styles define Material themes and shells. Auth templates are external HTML with shared auth-layout.scss; most demonstration pages retain inline templates/styles using Material color tokens. No shared design-system package, localization, accessibility audit, or responsive admin redesign is present. Build success does not prove runtime dependency injection or browser behavior.

Auth API URLs are currently hard-coded. Deployed frontend origins must match AUTH_ORIGINS, and production cookie transport requires HTTPS. Both current apps assume a same-site API. No frontend environment configuration, reverse-proxy rule, or deployment pipeline is included.

## Material theme decision

Both apps use Angular Material 22 fields and buttons with azure/cyan palettes and CSS color-scheme tokens. ThemeService restores a saved local preference or the initial OS setting; the toggle persists per origin. See [theming](theming.md) for files, methods, breakpoints, and validation.

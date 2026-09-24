# Administration application

## Bootstrap, layout, and routes

main.ts bootstraps App with appConfig. app.config.ts provides browser error listeners and routing. app.ts injects AuthService and Router, stores a logout error signal, and defines navigation links. app.html displays a sidebar/profile only for admin or superadmin and always renders router-outlet. Global styles.scss defines the Material theme and applies the two-column shell only to authenticated workspace routes. The login remains full-width; app.scss is empty. The login and workspace header expose a persistent theme toggle.

| Route | Component | Guard / state |
| --- | --- | --- |
| / | Redirect to /dashboard | Redirect destination is guarded |
| /login | LoginPage | Public |
| /dashboard | DashboardPage | adminGuard; static metrics |
| /users | UsersPage | adminGuard; static role counts |
| /vendors | VendorsPage | adminGuard; static vendor cards |
| /products | ProductsPage | adminGuard; static product cards |
| /settings | SettingsPage | adminGuard; static categories |

Routes eagerly import their components. There is no wildcard/not-found route or lazy loading. Hiding navigation is presentation only; backend guards protect actual data.

## core/auth/auth.guard.ts

adminGuard injects AuthService and Router, awaits restore(), redirects to /login on restoration errors, and allows only admin/superadmin. Other roles redirect. No returnUrl is retained. Because restore caches its result, a previously loaded identity can outlive the server session in memory; API authorization remains necessary.

## pages/login/login.component.ts

LoginPage imports FormsModule, Material form-field/input/button modules, and ThemeToggle. Its template is in login.component.html. It owns email/password strings plus busy/error signals. The email field is required, email-validated, and capped at 254. Password is required and capped at 128; sign-in does not enforce the new-account 12-character minimum.

submit() clears the error, sets busy, calls login, clears the password after successful login, then checks the returned role. A non-admin is logged out and shown an access error. Admins navigate to /dashboard. Catch displays the error and finally clears busy. Invalid/busy forms disable submission. The suffix button toggles password visibility. There is no registration, forgot-password, remember-me, or MFA UI. A local superadmin can be created with the documented development seed command.

## app.ts logout()

logout() awaits the server, then routes to /login. A failure leaves the current identity visible and sets an error. The old demo login has been removed. Sidebar/profile rendering reads the live AuthService signal.

## Every remaining page

| File | Rendered content | Interaction / API |
| --- | --- | --- |
| pages/dashboard/dashboard.component.ts | Fixed revenue, orders, vendors, abandonment figures | Export report button has no handler; no metrics request |
| pages/users/users.component.ts | Fixed counts for superadmin/admin/vendor admins/customers | No /users call or role editor |
| pages/vendors/vendors.component.ts | Example vendor names/statuses | No /vendors call or approvals |
| pages/products/products.component.ts | Example product cards/prices | No /catalog call or product editing |
| pages/settings/settings.component.ts | Platform, tax/shipping, security, SEO categories | No forms or persistence |

These standalone components use inline templates and inline styles; their classes have no business methods.

## Legacy core/stores/session.store.ts

SessionStore is an NgRx signalStore with user and isAuthenticated state. login(user) sets them; logout() clears them. Its SessionUser type lacks email and excludes customer. It is not the auth service and is not used by the current App. Do not use this local setter to establish a trusted identity.

## Supporting files and limitations

index.html supplies the HTML shell and base href. angular.json configures application builds, public assets, global styles, development serving, and unit tests. package.json defines Angular commands. app.spec.ts now covers the signed-out shell, Material login, superadmin dashboard redirect, protected navigation, and persisted theme preference.

The shell has no sidebar column while signed out. Responsive auth forms become one column below 760px, and workspace navigation wraps on narrow screens. Real-browser visual verification remains separate from the passing DOM tests. See [generated files](admin/generated/README.md) for exact current templates and styles.

See [Material theming](theming.md) for component styling and [superadmin setup](../backend/features/superadmin-setup.md) for local login provisioning.

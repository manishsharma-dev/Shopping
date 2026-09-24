# Material theme and sign-in layout

Both applications use Angular Material 22 controls and its Material 3 Sass theme. The shared visual approach uses the azure primary palette, cyan tertiary palette, system fonts, outlined fields, and filled primary actions. No external icon/font request is required.

## Files in each application

| File | Responsibility |
| --- | --- |
| src/styles.scss | Material theme generation, light/dark color-scheme, app shell and responsive navigation |
| src/app/core/theme/theme.service.ts | Initialize and persist the user's appearance choice |
| src/app/core/theme/theme-toggle.component.ts | Accessible Material button with inline sun/moon SVG |
| src/app/core/theme/auth-layout.scss | Shared sign-in panels, spacing, responsive form layout and illustration styles |
| Login/account component .ts | Form state, Material imports, show/hide password and submission |
| Login/account component .html | Outlined fields, errors, pending labels and the split-panel presentation |

The files are separate copies in the two independent apps. Styling reads --mat-sys-* tokens rather than hard-coded light surfaces. Static dashboard/catalog cards also use those tokens, but their data remains illustrative.

## ThemeService

The constructor reads northstar-theme from localStorage. Valid saved values are light and dark; otherwise it uses the current prefers-color-scheme media query, falling back to light. apply updates the mode signal, the root data-theme attribute, and root color-scheme. toggle selects the other mode and persists it. Storage failures are caught, leaving an in-memory preference. It does not subscribe to later OS theme changes.

Preferences are stored per browser origin, so admin port 4200 and shop port 4300 maintain independent selections. This differs from the host-scoped authentication cookie. Theme state contains no credentials.

ThemeToggle labels the action (Switch to light theme or Switch to dark theme), uses an icon-only Material button with an accessible label and hover title, and excludes decorative SVG from the accessibility tree. It appears on the admin login, authenticated workspace header, and storefront header.

## Layout and forms

The admin root adds its two-column grid only when displaying an authenticated workspace, excluding /login. The login therefore has the full viewport width and no hidden-sidebar column. The root router-outlet remains mounted when shell styling changes.

At widths below 760px, the decorative auth panel is hidden and the form becomes one column. Admin navigation wraps on small screens; storefront navigation moves below the header below 1000px. No fixed form width exceeds the mobile container.

Forms use MatFormField, MatInput, and Material buttons. Validation errors are attached to fields; server errors use role=alert. Password visibility is toggled with a type=button suffix action. Busy states prevent duplicate submits; account loading uses a Material spinner. Login redirects successful admin/superadmin users to /dashboard.

## Why Material

Material supplies coherent field states, labels, errors, buttons, and theme tokens. A single color-scheme-driven theme makes light/dark colors consistent without duplicating component overrides. System fonts and inline SVG avoid dependency on a remote font CDN.

Theme settings are presentation-only and local; authentication/authorization remain server responsibilities. [Angular Material's theming guide](https://github.com/angular/components/blob/main/guides/theming.md) explains the underlying theme API.

## Verification

Admin component tests exercise the signed-out layout class, Material fields, a successful superadmin redirect and dashboard shell, protected navigation, theme toggling, and saved preference restoration. Shop tests exercise Material login/registration switching, password minimums, theme retention, and signed-in identity. These DOM tests do not replace visual inspection on real desktop/mobile browsers.

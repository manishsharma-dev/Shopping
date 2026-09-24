# Customer storefront

## Bootstrap and navigation

main.ts bootstraps App with appConfig; app.config.ts registers routing and browser error listeners. app.ts defines Home, Catalog, Cart, Checkout, and Account navigation. app.html shows the Northstar Market header, active links, cart count, and router-outlet. Global styles.scss owns the header/shell layout; app.scss is empty.

| Route | Component | Current behavior |
| --- | --- | --- |
| / | Redirect /home | Public |
| /home | HomePage | Marketing content |
| /catalog | CatalogPage | Static examples |
| /cart | CartPage | Cart summary scaffold; missing store provider |
| /checkout | CheckoutPage | Static address and inactive order button |
| /account | AccountPage | Working auth form and public identity |

All routes are currently public and eagerly loaded. Checkout has no customer guard, and it also has no functional order endpoint.

## AccountPage

File: pages/account/account.component.ts. Dependencies: FormsModule, root AuthService, and Material form-field/input/button/spinner modules. The template is in account.component.html; the shared auth-layout.scss controls its responsive panels.

State includes registering, busy, error, loading signals and name/email/password form strings. The constructor calls restore; a failure is shown as an error, and loading always clears. When authenticated, the page displays name/email and sign out. Otherwise it renders the selected login/register form.

submit() sets busy and clears errors, selects register or login from registering(), clears the password on success, displays failures, and clears busy in finally. logout() similarly manages pending/error state around the service. switchMode() clears error/password and resets password visibility. hidePassword controls the suffix show/hide action.

Name appears only during registration and is required with max 100. Email is required, email-validated, max 254. Password is required, max 128, and minimum 12 during registration versus 1 during login. Autocomplete differentiates new and current passwords. Backend DTO validation remains authoritative.

## CartStore and CartPage

File: core/stores/cart.store.ts. CartItem is { id, name, quantity, unitPrice }; state is an items array.

| Symbol | Behavior |
| --- | --- |
| itemCount | Sum of item quantities |
| totalAmount | Sum of quantity times unitPrice |
| addItem(item) | Append a new ID, or add its quantity to the existing item; existing name/price remain |
| removeItem(productId) | Filter out matching ID |
| clearCart() | Replace items with empty array |

The store does not validate positive quantities, integer quantities, prices, stock, or currency. It is in-memory with no backend/local persistence.

App creates a store using new CartStore() and adds one demonstration hoodie. CartPage separately injects CartStore, but no provider is declared in the store/app/page configuration. As written, cart navigation can fail injection; the header instance is not provided to CartPage. This must be fixed before treating the cart as functional. CartPage's template shows item count and CurrencyPipe total and calls clearCart, with no line-item editor.

## Other page files

HomePage contains marketing text and a Shop now button with no navigation/click handler. CatalogPage contains three static products and inactive Add to cart buttons; it does not call /api/catalog or CartStore. CheckoutPage displays a fixed New York address and Place order button with no handler. No address form, district selector, payment integration, order persistence, or stock reservation exists.

## Supporting files

index.html provides the document shell. angular.json configures builds/serve/assets/styles/test targets. package.json provides scripts and dependencies. app.spec.ts covers the Material account fields, registration switch and password minimum, theme retention, and signed-in identity. Cart behavior remains untested.

See [all storefront files](shop/generated/README.md) for exact templates, declarations, and stylesheet content.

The header exposes a persistent light/dark toggle on every route. The account route removes ordinary page padding and uses the responsive Material auth layout; see [theming](theming.md).

The header cart indicator uses an inline SVG shopping-cart icon and a numeric quantity badge, including on mobile. Its accessible label and hover title include the item count; it remains a display indicator rather than adding a new cart action. Theme controls are icon-only with accessible action labels.

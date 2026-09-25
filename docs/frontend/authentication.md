# Frontend authentication

## Source files and request model

Both `apps/admin/src/app/core/auth/auth.service.ts` and `apps/shop/src/app/core/auth/auth.service.ts` define a root-provided AuthService and SessionUser type. These are separate implementations, not imports from a shared package.

SessionUser contains id, name, email, role and optional userType/userTypeId/state/district/vendorId/active fields for compatibility with legacy clients. Role also includes state_admin, district_admin and staff. The current server always supplies the public User Type. There is no frontend password-hash field or token-storage field.

| Operation | Request object | Server DTO |
| --- | --- | --- |
| login | { email, password } | LoginDto |
| register | { name, email, password } | RegisterDto |
| logout | {} | No DTO |
| restore | GET with no body | No DTO |

HTML form validation improves feedback but does not replace backend validation. The backend trims/lowercases email and trims name. Passwords are not trimmed.

## Every service method

| Member | Behavior |
| --- | --- |
| user | Reactive signal, initially null; stores public identity only |
| base | Fixed http://localhost:3000/api/auth |
| restored | Records a completed restoration attempt; success and 401 both set it |
| restoring | Shared in-flight Promise so concurrent restores make one request |
| restore() | Return early after restoration; GET /me; set user on success; treat 401 as signed out; rethrow other failures; clear in-flight Promise |
| login(email,password) | POST /login; set returned user and restored flag |
| register(name,email,password) | POST /register; set returned user and restored flag |
| logout() | Await POST /logout; then clear user and set restored flag |
| request(path,body?) | Internal fetch wrapper, status/error mapping, JSON parsing |

request chooses POST when a body is present, otherwise GET. It always uses credentials:include. POST headers are application/json and X-Shopping-Client:web. Network failures become a readable connection error; non-success JSON messages become Errors with an added status property. Validation arrays are joined into a string. A 401 clears the user. A 204 maps to an empty object cast internally to the response shape; logout never reads its user.

## Browser state and session lifecycle

The browser stores the HttpOnly cookie; JavaScript cannot read it through normal document.cookie access. The service stores only identity in memory, not localStorage. Reloading the app resets the service, and a later restore call asks the server who is signed in.

Restoration is cached for the lifetime of that service instance. There is no periodic session check, refresh timer, automatic revalidation on every route, cross-tab event, or refresh-token workflow. A session may expire while the UI still displays the earlier identity. The server rejects later protected requests independently.

Both local apps share the backend's host cookie even though they use different ports. Their services are separate, so login/logout changes are not broadcast between them. Signing a customer into the admin form triggers logout after the role check, which can also revoke that browser's shared storefront session.

## Component connections

Admin LoginPage calls login, checks platform, regional, vendor and staff levels, logs out other roles, and navigates to /dashboard. Admin's route guard restores before allowing protected navigation. The admin App calls logout and navigates to /login after success.

Shop AccountPage restores in its constructor, switches between login/registration forms, calls the selected operation, and displays the authenticated name/email or an error. Its logout stays on /account.

## Design and change guidance

A root-provided service shares identity within each app. An in-flight Promise prevents duplicate initialization calls. Keeping state changes after successful requests avoids presenting an action as complete when the server failed.

Native fetch keeps the first auth client small but has no global interceptor, configurable base URL, generated response validation, or shared retry policy. Any API/cookie/error change currently needs edits in both files. A shared client can reduce duplication later; do not change only one app's contract.

## Material form presentation

Both auth forms now use outlined Material fields, attached validation messages, pending labels, and show/hide-password suffix buttons. AccountPage.switchMode resets the form mode feedback and password visibility. The request and cookie contracts are unchanged. See [theme documentation](theming.md).

The admin guard/login/shell admit regional and vendor teams as well as platform administrators. The management API independently checks active vendor scope and custom permissions. Customer AccountPage displays User Type and embeds VendorApplication for signed-in customers; that form has its own loading/error/submission state and never changes the registration role contract.

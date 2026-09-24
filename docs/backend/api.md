# HTTP API contracts

Base URL for local development: `http://localhost:3000/api`. JSON field names are case-sensitive. All auth POST calls require `Content-Type: application/json` and `X-Shopping-Client: web`. Browsers must use `credentials: 'include'` to accept/send the session cookie and an allowed Origin. Requests without an Origin can be used by CLI tools if they include the custom header.

| Method and path | Input | Success | Authorization |
| --- | --- | --- | --- |
| POST /auth/register | name, email, password | 201; { user } and session cookie | Public; middleware checks |
| POST /auth/login | email, password | 200; { user } and session cookie | Public; middleware checks |
| GET /auth/me | Cookie | 200; { user } | AuthGuard |
| POST /auth/logout | Cookie; body optional | 204; clears cookie | No AuthGuard; middleware checks |
| GET /users | Cookie | 200; { data: publicUser[] } | AuthGuard then AdminGuard |
| GET /vendors | Cookie | 200; { data: vendor[] } | AuthGuard then AdminGuard |
| GET /catalog | None | 200; { items: product[] } | Public |
| GET /health | None | 200; status, service, timestamp | Public |

Public user shape:

```json
{
  "user": {
    "id": "a UUID",
    "name": "Example Customer",
    "email": "customer@example.com",
    "role": "customer"
  }
}
```

Tokens, password hashes, and createdAt are excluded. No endpoint accepts a client-selected role. DTO whitelisting strips unknown fields.

## Registration example

```http
POST /api/auth/register
Content-Type: application/json
X-Shopping-Client: web

{"name":"Example Customer","email":"customer@example.com","password":"example-long-password"}
```

The cookie is named shopping_session, scoped to /api, host-only (no Domain attribute), HttpOnly, SameSite=Lax, and expires after eight hours. It is Secure when NODE_ENV is production. Apps on different localhost ports share the same host cookie; signing out in one can invalidate the session another app was using, though their in-memory state is not synchronized.

## Errors

| Status | Condition |
| --- | --- |
| 400 | Invalid DTO, including short registration password, invalid email, blank normalized name |
| 401 | Unknown/wrong credentials, malformed token, missing/expired/revoked session, missing user |
| 403 | Missing custom header, disallowed supplied Origin, or insufficient admin role |
| 409 | Duplicate account email |
| 429 | Auth request limit reached; Retry-After in seconds |
| 500 | Unhandled storage/runtime failure |

Nest returns JSON errors with message/statusCode and often an error label. Validation message may be an array. Clients join arrays for display. GET /auth/me returning 401 is normal for a signed-out visitor. Logout is idempotent: no valid session is required, but the middleware requirements still apply.

There are no pagination query parameters, mutation endpoints for users/vendors/products, district APIs, or order APIs. Swagger at /docs is supplementary and currently less detailed than these contracts.

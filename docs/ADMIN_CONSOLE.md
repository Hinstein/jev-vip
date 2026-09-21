# New API administrator console

JEV Store does not implement a second user-management screen. User accounts,
roles, quota, API keys, redemption codes and usage logs are managed by the New
API administrator console.

The production New API process stays on `127.0.0.1:3001`. Publish it through a
dedicated HTTPS admin hostname, not through the customer frontend path:

```text
DNS A:          admin.jevhub.store -> 43.135.155.97
Admin entry:    https://admin.jevhub.store/ (redirects to `/users/`)
User manager:   https://admin.jevhub.store/users/
New API public: not the default admin entry
Upstream:       http://127.0.0.1:3001
```

Use the Caddy example in `deploy/caddy/admin-console.caddy.example`. It sends
the admin root to New API's user-management route and leaves authentication to
New API itself. This gives operators one normal, stylable New API sign-in
screen instead of a second browser-native Basic Auth prompt.

Customer registration remains on the JEV Store frontend. The admin hostname
uses the same New API account system, but only a New API administrator can
open the administrator-only sections such as user management, channels and
usage logs.

The Caddy configuration redirects `/register` on the admin hostname to the
JEV Store sign-up page and rejects direct calls to `/api/user/register` there.
This prevents the generic New API UI from becoming a second customer
registration surface.

When the admin hostname is enabled, add its exact origin to
`NEW_API_SESSION_COOKIE_TRUSTED_URL` alongside `https://jevhub.store`, then
recreate only the `new-api` container. Do not expose port 3001 directly to the
Internet.

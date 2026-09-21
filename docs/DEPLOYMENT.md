# Deployment checklist

## JEV Store frontend

The JEV Store Next.js frontend is stateless and has no application database.

1. Install Node 22+ and pnpm.
2. Copy `.env.example` to `.env` and set production secrets.
3. Install and build:

```bash
pnpm install --frozen-lockfile
pnpm build
```

4. Start the backend stack:

```bash
docker compose -f docker-compose.backend.yml up -d
```

5. Start the JEV Store frontend with `pnpm start`.
6. Put both the JEV site and New API administrator console behind HTTPS.
7. In production enable Secure New API session cookies and configure the trusted
   admin URL.

## New API state

New API PostgreSQL and Redis are the persistent backend state. Back up New API
PostgreSQL before public sales. Redis is operational/cache state and should be
configured for reliable restart behavior.

## Before public sales

- Root setup completed.
- Password registration/login settings match the JEV Store frontend.
- `jev` channel points only to the internal JEV adapter.
- TypeSafe credential exists only in the adapter environment.
- Model price is $0.42/M input and $0/M output.
- Default group ratio and rate limit are configured.
- Recharge-code batches can be generated and redeemed.
- A fresh account can create a key and call `/api/v1/decide`.
- Usage reduces New API quota and appears in New API logs.
- New API PostgreSQL backups are configured.
- Public sales-channel URLs are set in the JEV environment.


## Reverse-proxy security requirement

Do not expose the Next.js process directly to the public Internet. The public
HTTPS reverse proxy/CDN must **overwrite** client-address headers
(`X-Forwarded-For`, `X-Real-IP`, or `CF-Connecting-IP`) so a caller cannot
choose another user's rate-limit identity.

JEV forwards that sanitized client identity to New API for login/register,
session refresh and logout. New API trusts only the private/loopback proxy
ranges configured by `NEW_API_TRUSTED_PROXIES`.

The reverse proxy should also enforce a request-body limit of 2 MiB on
`/api/v1/decide`; JEV enforces the same limit while streaming the body so
chunked requests cannot bypass it.

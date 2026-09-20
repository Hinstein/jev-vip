# Deployment checklist

## JEV frontend

The JEV Next.js frontend is stateless and has no application database.

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

5. Start the JEV frontend with `pnpm start`.
6. Put both the JEV site and New API administrator console behind HTTPS.
7. In production enable Secure New API session cookies and configure the trusted
   admin URL.

## New API state

New API PostgreSQL and Redis are the persistent backend state. Back up New API
PostgreSQL before public sales. Redis is operational/cache state and should be
configured for reliable restart behavior.

## Before public sales

- Root setup completed.
- Password registration/login settings match the JEV frontend.
- `jev` channel points only to the internal JEV adapter.
- TypeSafe credential exists only in the adapter environment.
- Model price is $0.42/M input and $0/M output.
- Default group ratio and rate limit are configured.
- Recharge-code batches can be generated and redeemed.
- A fresh account can create a key and call `/api/v1/decide`.
- Usage reduces New API quota and appears in New API logs.
- New API PostgreSQL backups are configured.
- Public sales-channel URLs are set in the JEV environment.

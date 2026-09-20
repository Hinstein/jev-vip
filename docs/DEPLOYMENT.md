# Deployment checklist

## JEV frontend

1. Install Node 22+, pnpm and PostgreSQL 16+.
2. Copy `.env.example` to `.env` and set production secrets.
3. Install and build:

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
pnpm jev:configure-products
pnpm build
```

4. Start the backend stack:

```bash
docker compose -f docker-compose.backend.yml up -d
```

5. Start the Next.js frontend with `pnpm start`.
6. Put both the JEV site and the New API administrator console behind HTTPS.

## New API checks before public sales

- New API root setup completed.
- Password login and registration match the JEV frontend configuration.
- Customer roles/status/groups are visible in the New API admin console.
- The `jev` channel points only to the internal JEV adapter.
- TypeSafe credentials exist only in the adapter environment.
- Recharge-code batches can be generated and redeemed.
- A redeemed account can create a token and call `/api/v1/decide`.
- Usage reduces New API quota and appears in New API logs.
- Database and Redis backups are configured.

## Sales channel

Set the public purchase URLs used by the JEV product cards. The sales channel
only sells recharge codes; New API is the source of truth for code state and
credited quota.

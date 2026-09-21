# Deployment checklist

## JEV VIP

1. Install Node 22+, pnpm and PostgreSQL 16+.
2. Clone the repository.
3. Copy `.env.example` to `.env` and set real values.
4. Run:

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
pnpm jev:configure-products
pnpm build
pnpm start
```

5. Put Caddy or Nginx in front of port 3000 and serve the site over HTTPS. Session cookies are secure-only.

Stripe is not required for this phase.

## OfferKit

Deploy OfferKit independently. Pin a stable release rather than an edge image for production. Configure its own Postgres/Redis, admin credentials and API key, then create the three JEV campaigns described in `docs/OFFERKIT_INTEGRATION.md`.

Before opening redemption to users, verify the OfferKit readiness endpoint and redeem one disposable test voucher end to end.

## Before public sales

- Set all three real OfferKit campaign UUIDs.
- Set Xianyu product URLs.
- Test valid, invalid, expired and already-used codes.
- Test two simultaneous submissions of the same code.
- Back up both JEV Postgres and OfferKit Postgres.
- Keep the built-in redemption rate limit enabled; add reverse-proxy limiting
  as a second layer for multi-instance deployments.
- Configure LiteLLM, TypeSafe and the JEV usage-metering database migration
  before issuing API keys publicly.
- Treat the relay as configured only when all of these are non-empty and valid:
  `LITELLM_PROXY_URL`, `LITELLM_MASTER_KEY`, `LITELLM_SALT_KEY`,
  `LITELLM_DATABASE_URL`, `TYPESAFE_API_BASE` and `TYPESAFE_API_KEY`.

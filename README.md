# JEV VIP

JEV VIP keeps its own customer-facing Next.js UI while using **New API as the sole business backend**.

## Architecture

```text
Customer browser
   -> JEV VIP / ZEV custom frontend
      -> /api/* reverse proxy
         -> New API
            -> users / sessions
            -> wallet / quota
            -> redemption codes
            -> API tokens
            -> usage / logs
            -> models / channels / routing
            -> admin console

Public API clients
   -> api.<domain>/v1
      -> New API directly
```

There is intentionally no second JEV user database, voucher engine, credit
ledger, or LiteLLM sidecar in the active runtime path.

## What stays custom

- Landing and pricing pages
- Sign-in / sign-up UX
- Customer dashboard
- Wallet / redemption UX
- API key UX
- Usage UX
- Product copy and integration documentation

## What New API owns

- Users and login sessions
- User quota / wallet
- Redemption code generation and lifecycle
- API tokens
- Usage accounting and logs
- Model/channel configuration and routing
- Admin console

## Local setup

1. Copy `.env.example` to `.env`.
2. Start New API:

```bash
docker compose -f docker-compose.new-api.yml up -d
```

3. Complete New API's initial Root setup on port 3001.
4. For the first ZEV version, keep password-login encryption, Turnstile and
   login 2FA challenges disabled unless the custom UI is extended to support
   those flows.
5. Start the frontend:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

See `docs/NEW_API_INTEGRATION.md` and `docs/DEPLOYMENT.md`.

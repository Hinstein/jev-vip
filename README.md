# JEV prepaid API platform

This repository is the customer-facing recharge and hosted-access platform for
Jev.

## Architecture

```text
Customer
  -> JEV Next.js frontend
       -> New API
          -> login / users / roles / permissions
          -> quota / redemption codes
          -> API keys / usage / logs
          -> routing / administrator console
          -> internal Jev protocol adapter
               -> TypeSafe /v1/systemone
```

New API is the source of truth for customer identity and commercial API state.
The JEV frontend does not maintain a second user/permission system or credit
ledger.

The TypeSafe upstream is not OpenAI-compatible, so
`relay/jev-adapter` remains as a narrow protocol converter. It owns no users,
keys, quota or billing state.

## Customer product

- New API-backed registration and login
- prepaid credit balance
- recharge-code redemption
- API key create/list/revoke
- usage visibility
- hosted `POST /api/v1/decide`

The customer experience references the product mechanics of
jevtypesafeai.com while keeping independent branding and implementation.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
pnpm jev:configure-products
docker compose -f docker-compose.backend.yml up -d
pnpm dev
```

See `docs/NEW_API_BACKEND.md` and `docs/DEPLOYMENT.md`.

This is an independent service and is not affiliated with, endorsed by, or
operated by TypeSafe AI.

# JEV prepaid API platform

This repository is the customer-facing recharge and hosted-access platform for
Jev.

## Architecture

```text
Customer
  -> JEV Next.js frontend (stateless; no local database)
       -> New API
          -> login / users / roles / permissions
          -> quota / redemption codes
          -> API keys / usage / logs
          -> routing / administrator console
          -> PostgreSQL + Redis
          -> internal Jev protocol adapter
               -> TypeSafe /v1/systemone
```

New API is the only source of truth for customer identity and commercial API
state. The JEV frontend does not maintain a second user database, permission
system, credit ledger or API-key store.

The TypeSafe upstream is not OpenAI-compatible, so
`relay/jev-adapter` remains as a narrow protocol converter. It owns no users,
keys, quota or billing state.

## Billing V1

- retail Jev input: $0.42 / 1M tokens
- output: free
- New API internal quota: 500,000 = $1
- recharge packs: ¥10 / ¥30 / ¥50
- authoritative settlement: TypeSafe `usage.input_tokens`

Recharge-pack metadata is static in `lib/jev/products.ts`; only public sales
URLs come from environment variables. Pack purchase configuration is not a
second billing database.

See `docs/BILLING_V1.md`.

## Customer product

- New API-backed registration and login
- prepaid API balance
- recharge-code redemption
- API key create/list/revoke
- usage visibility
- hosted `POST /api/v1/decide`

## Setup

```bash
pnpm install --frozen-lockfile
docker compose -f docker-compose.backend.yml up -d
pnpm dev
```

Before public sales, run the full checklist in `docs/LAUNCH_RUNBOOK.md`.

This is an independent service and is not affiliated with, endorsed by, or
operated by TypeSafe AI.

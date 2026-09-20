# Deployment

## Services

Deploy two independent services:

1. **JEV/ZEV frontend** — this Next.js repository.
2. **New API** — the official New API container.

The frontend never connects to the New API database. All integration is via its
HTTP API.

## Recommended domains

```text
www.example.com   -> Next.js frontend
api.example.com   -> New API (public /v1 gateway)
admin.example.com -> New API operator UI (optional separate reverse-proxy host)
```

The Next.js server also needs private reachability to New API using
`NEW_API_INTERNAL_URL`.

## New API

Copy `.env.example` and set at least:

- `NEW_API_SESSION_SECRET`
- `NEW_API_CRYPTO_SECRET`
- `NEW_API_TRUSTED_FRONTEND=https://www.example.com`

Use PostgreSQL/MySQL and Redis when moving beyond a single-node validation
deployment. SQLite is acceptable for the first local smoke test.

Start:

```bash
docker compose -f docker-compose.new-api.yml up -d
```

Complete Root initialization in the New API UI. Configure channels, models,
pricing, user groups and redemption codes there.

## Frontend

Set:

```bash
NEW_API_INTERNAL_URL=http://127.0.0.1:3001
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1
```

Then:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## Reverse proxy

Route the public API domain directly to New API. Do not route LLM streaming
through Next.js.

The browser dashboard uses `/api/*` on the frontend origin. Next.js forwards
those requests internally to New API so New API's HttpOnly refresh cookie stays
same-origin from the browser's point of view.

## Cutover

Do not run OfferKit or LiteLLM for this architecture. Before deleting old
production data, export any users, balances, keys or redemption records that
must be migrated. This repository's pre-New-API database is not read by the new
runtime.

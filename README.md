# ZEV / JEV VIP

ZEV is a branded prepaid-access frontend for the JEV/TypeSafe API.

## Architecture

```text
Customer
   -> ZEV Next.js frontend
      -> New API
         -> users / quota / redemption
         -> API keys / usage / logs
         -> routing / admin console
         -> internal JEV protocol adapter
            -> TypeSafe /v1/systemone
```

The customer-facing frontend remains ours. New API is the business backend and
administrator console.

## Current backend migration

The active customer flows now use New API for:

- quota and redemption codes
- API-key create/list/revoke
- gateway authentication and routing
- usage counters and request accounting

The existing TypeSafe endpoint is not OpenAI-compatible, so
`relay/jev-adapter` is intentionally kept as a tiny protocol adapter. It owns
no commercial state.

Legacy OfferKit/LiteLLM files are temporarily retained only as rollback
reference and are no longer on the active API-key, redemption or
`/api/v1/decide` request paths.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
docker compose -f docker-compose.backend.yml up -d
pnpm dev
```

See `docs/NEW_API_BACKEND.md` for New API first-boot and channel setup.

## Security boundary

- TypeSafe upstream credentials exist only in the internal adapter.
- New API is bound to localhost by default; publish its admin UI only through a
  protected HTTPS reverse proxy.
- Customer API keys are returned by ZEV only at explicit creation time.
- `NEW_API_IDENTITY_SECRET`, database credentials and adapter shared key are
  server-side secrets.

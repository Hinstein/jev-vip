# New API backend migration

## Decision

Keep the existing ZEV Next.js frontend and local sign-in UX. Replace the
business backend with upstream New API.

New API owns:

- mirrored backend users
- quota
- redemption codes
- API keys
- gateway authentication
- routing
- usage / spend accounting
- request logs
- administrator console

The ZEV application owns:

- branded public/customer UI
- local frontend session
- product/sales links
- the public JEV-shaped endpoint `/api/v1/decide`

A small internal adapter only converts the existing TypeSafe
`/v1/systemone` protocol to OpenAI chat-completions format. It does not own
users, keys, quota, billing or logs.

## Why the adapter remains

The TypeSafe upstream is not OpenAI-compatible. New API can therefore own the
gateway, but it still needs a channel whose upstream speaks the OpenAI
chat-completions contract. The adapter performs only this protocol conversion.

Request path:

```text
customer ZEV key
  -> POST /api/v1/decide
  -> New API /v1/chat/completions
       -> authenticate token
       -> enforce quota/model
       -> meter/log request
       -> route model "jev"
  -> jev-adapter /v1/chat/completions
  -> TypeSafe /v1/systemone
```

## First boot

1. Fill the New API and adapter variables in `.env`.
2. Start the backend:

   ```bash
   docker compose -f docker-compose.backend.yml up -d
   ```

3. Open the New API console through a protected HTTPS reverse proxy to
   `127.0.0.1:3001` and complete root setup.
4. Keep password registration/login enabled for ZEV's private mirrored users.
   Disable New API email verification for this integration. Do not expose the
   New API signup page publicly.
5. Disable automatic default-token generation; ZEV creates tokens explicitly.
6. Create an OpenAI-compatible channel:
   - Base URL: `http://jev-adapter:4100`
   - API key: value of `JEV_ADAPTER_SHARED_KEY`
   - Model: `jev`
7. Configure the model price/quota rules for `jev` in New API.
8. Generate redemption-code batches from the New API admin console.

## User mirroring

The existing ZEV login UI remains unchanged. A local user is lazily mirrored
into New API as `zev_<local user id>`. The backend-only password is derived
with HMAC from `NEW_API_IDENTITY_SECRET`; the customer's actual password is
never sent to New API.

This deliberately avoids a risky all-at-once auth rewrite while moving all
commercial API capabilities to New API.

## Rollback

Legacy OfferKit/LiteLLM source files remain in this migration branch for one
release as rollback reference, but active routes no longer call them. Delete
them only after deployment verification.

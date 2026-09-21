# LiteLLM relay

JEV Store uses LiteLLM only as the relay layer.

## What LiteLLM owns

- Virtual API keys
- API-key authentication
- Model access restriction
- Gateway request routing
- Upstream forwarding
- Relay-side request/token logs

## What LiteLLM does not own

- JEV users
- JEV credit balances
- Credit transactions
- OfferKit vouchers
- Xianyu sales
- JEV product definitions
- JEV business billing

Those remain in the existing JEV Store application.

## Request path

```text
customer
  -> POST /api/v1/decide
  -> Next.js format adapter
  -> LiteLLM /v1/chat/completions
       - validate LiteLLM Virtual Key
       - allow model "jev"
       - invoke custom provider
  -> JevTypeSafeProvider
  -> https://api.typesafe.ai/v1/systemone
  -> LiteLLM records normalized token usage
  -> JEV Store reserves 1 Credit, then settles the exact reported token total
  -> Next.js unwraps the original JEV JSON
  -> customer
```

The public customer request/response remains JEV-shaped. The OpenAI-shaped
request exists only on the private hop between JEV Store and LiteLLM.

## Why custom provider instead of generic passthrough

We intentionally do not use LiteLLM's dynamic/generic passthrough endpoint.
The JEV relay is pinned to one upstream URL in `jev_provider.py`, so clients
cannot choose arbitrary destinations. This keeps the upstream TypeSafe key
private and avoids turning the gateway into a generic HTTP proxy.

## Deploy

Create a second PostgreSQL database on the same PostgreSQL server. LiteLLM
virtual-key management requires PostgreSQL; SQLite is not supported:

```bash
createdb jev_litellm
```

Set the LiteLLM and TypeSafe variables in `.env`, then start only the relay:

```bash
docker compose --env-file /absolute/path/to/.env \
  -f docker-compose.relay.yml up -d
```

If the application keeps its production env file outside the release
directory, point Compose at it explicitly:

```bash
JEV_VIP_ENV_FILE=/absolute/path/to/.env \
  docker compose --env-file /absolute/path/to/.env \
  -f docker-compose.relay.yml up -d
```

The compose file binds LiteLLM to `127.0.0.1:4000`, not the public network.

If the Next.js application also runs in Docker, attach both services to a
private Docker network and set:

```env
LITELLM_PROXY_URL=http://litellm:4000
```

## API keys

The JEV Dashboard calls LiteLLM management APIs with the server-only master key.

- Create: `POST /key/generate`
- List: `GET /key/list`
- Revoke: `POST /key/delete`

Keys are restricted to the `jev` model and tagged with a stable JEV user id.
The plaintext key is returned to the customer only at creation time. JEV Store
stores only a SHA-256 hash of each generated key and its LiteLLM token id.
Each request first reserves 1 Credit so concurrent requests cannot overspend.
Successful requests are recorded in `usage_events` and settled against the
exact reported token total in one database transaction; unused reservation
credits are refunded. If the final token total exceeds the remaining balance,
the reservation is restored and the upstream result is not returned.

## Version

The relay is pinned to LiteLLM `v1.101.0`. Do not switch to `latest`.
Review release notes/security advisories before upgrading.

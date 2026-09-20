# JEV VIP

JEV VIP is an independent prepaid-access SaaS for Jev users, built on the MIT-licensed `nextjs/saas-starter`.

## Architecture

```text
Xianyu (sales only)
   -> unique voucher code
OfferKit (voucher lifecycle only)
   -> successful atomic redemption
JEV VIP
   -> products
   -> user credit balance
   -> credit transaction ledger
```

OfferKit never owns or deducts JEV Credits.

## Implemented

- Email/password sign up, sign in and session-protected dashboard
- Account and password settings
- Product catalog
- Xianyu purchase-link slots
- `/redeem` customer flow
- Server-only OfferKit adapter
- OfferKit atomic redemption + stable idempotency key
- Product mapping by actual OfferKit campaign UUID
- JEV credit balances
- Immutable credit transaction history
- Local ledger idempotency
- Credits dashboard
- Safe retry after partial OfferKit/JEV failure
- Production migration + CI migration check
- LiteLLM v1.101.0 relay sidecar
- LiteLLM Virtual Key create/list/revoke from the existing Dashboard
- Public `POST /api/v1/decide` backed by a LiteLLM custom JEV provider
- Local API-key ownership, request metering and atomic JEV Credit debits

Default products:

| Product | Price | Credits | Campaign key |
| --- | ---: | ---: | --- |
| Starter | ¥10 | 1,000,000 | JEV_10 |
| Standard | ¥30 | 3,500,000 | JEV_30 |
| Pro | ¥50 | 6,000,000 | JEV_50 |

## Intentionally not implemented yet

- WeChat/Alipay/Stripe payment collection
- Voucher generation or voucher inventory inside JEV VIP
- Xianyu automatic fulfillment
- A global admin console

## Public API

`POST /api/v1/decide` accepts a JEV-shaped JSON object with a JEV VIP Bearer
API key. The request is relayed through LiteLLM and a successful response is
metered at one JEV Credit per reported token. The response includes
`X-JEV-Credits-Used`, `X-JEV-Credits-Remaining` and `X-JEV-Request-ID` headers.
Clients may send a stable `X-Request-ID` to prevent accidental duplicate
billing; a reused id is rejected rather than forwarded again.

These are separate concerns and should not be mixed into the voucher adapter.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
pnpm jev:configure-products
pnpm dev
```

See:

- `docs/OFFERKIT_INTEGRATION.md`
- `docs/DEPLOYMENT.md`
- `docs/LITELLM_RELAY.md`

JEV VIP is independent and is not affiliated with or operated by TypeSafe AI.

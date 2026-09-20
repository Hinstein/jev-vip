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

Default products:

| Product | Price | Credits | Campaign key |
| --- | ---: | ---: | --- |
| Starter | ¥10 | 1,000,000 | JEV_10 |
| Standard | ¥30 | 3,500,000 | JEV_30 |
| Pro | ¥50 | 6,000,000 | JEV_50 |

## Intentionally not implemented yet

- WeChat/Alipay/Stripe payment collection
- Voucher generation or voucher inventory inside JEV VIP
- JEV API-key delivery
- JEV request metering and credit debits
- Xianyu automatic fulfillment
- A global admin console

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

JEV VIP is independent and is not affiliated with or operated by TypeSafe AI.

# OfferKit voucher integration

## Boundary

OfferKit is voucher infrastructure only.

- OfferKit owns voucher existence, lifecycle, expiration, limits, atomic redemption and redemption history.
- JEV Store owns products, user credit balances and the credit ledger.
- Xianyu is only a sales channel.
- OfferKit does not own JEV balances and is never consulted when JEV usage is debited.

## OfferKit setup

Create three OfferKit campaigns named for the JEV products:

- `JEV_10`
- `JEV_30`
- `JEV_50`

OfferKit resource IDs are UUIDs. The names above are operator-facing keys; after creating the campaigns, copy their actual campaign IDs into:

```env
OFFERKIT_CAMPAIGN_JEV_10=<uuid>
OFFERKIT_CAMPAIGN_JEV_30=<uuid>
OFFERKIT_CAMPAIGN_JEV_50=<uuid>
```

For this integration, use unique one-time discount vouchers only as a technical mechanism for code lifecycle. Keep the OfferKit value nominal and unrelated to JEV Credits. The JEV server sends a synthetic one-minor-unit CNY order purely so OfferKit can commit a discount-voucher redemption.

Recommended OfferKit settings:

- campaign active;
- unique generated voucher codes;
- voucher redemption limit: 1;
- nominal fixed discount: 1 CNY minor unit;
- no gift-card balance;
- no loyalty;
- no referral;
- no payment or billing integration.

Generate and export codes from OfferKit. Do not build a second voucher generator in JEV Store.

## Server secrets

```env
OFFERKIT_API_URL=https://offerkit.example.com
OFFERKIT_API_KEY=offerkit_***
OFFERKIT_REDEEM_CURRENCY=CNY
OFFERKIT_REDEEM_AMOUNT_MINOR=1
```

The API key must never be exposed to browser code.

## Configure product mapping

After migrations and after creating the campaigns:

```bash
pnpm jev:configure-products
```

This writes campaign UUIDs and optional Xianyu URLs into the JEV `products` table.

## Redemption sequence

```text
browser
  -> POST /api/redeem
  -> authenticate JEV user
  -> OfferKit GET voucher
  -> map OfferKit campaign UUID to JEV product
  -> OfferKit atomic redemption with stable idempotency key
  -> Postgres transaction:
       insert unique credit transaction
       atomically increment user balance
  -> return new JEV balance
```

The JEV ledger reference is deterministic for a user + voucher code. If OfferKit commits successfully but the JEV database write fails, retrying the same code replays the OfferKit result with the same idempotency key and can safely finish the local credit write.

Raw voucher codes are not persisted in JEV Store. The credit ledger stores only a SHA-256 hash and the final four characters for support correlation.

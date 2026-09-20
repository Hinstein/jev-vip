# Phase 1 scope

## Goal

Ship the reusable SaaS shell before implementing recharge delivery.

## Fixed architecture

Use the upstream `nextjs/saas-starter` for generic SaaS concerns. Do not
replace its auth/session/database foundation with a custom framework.

Customer flow:

```text
landing
  -> sign up / sign in
  -> dashboard
      -> balance
      -> top up
      -> API keys
      -> usage
      -> orders
      -> account/security
```

## Phase 2 integration boundaries

Payment and Jev delivery should later be added behind these modules:

- credit ledger
- top-up orders
- payment adapter
- delivery adapter
- API key store
- Jev upstream/proxy adapter
- usage meter

Do not put payment-provider code directly in dashboard components. Do not put
upstream Jev secrets in client components.

## Phase 1 acceptance

- Existing starter auth remains intact.
- `/dashboard` remains protected.
- Customer navigation contains Overview, API Keys, Usage, Top Up, Orders,
  Account and Security.
- Top-up and API-key actions do not execute real money/key operations.
- UI explicitly marks unfinished delivery functions as phase 2.

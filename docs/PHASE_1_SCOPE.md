# Current scope

## Product

This repository is a JEV prepaid API/recharge platform.

Customer flow:

```text
landing
  -> sign up / sign in
  -> dashboard
      -> available credits
      -> top up / redeem code
      -> API keys
      -> usage
  -> POST /api/v1/decide
```

## Fixed architecture

- JEV Next.js: branded customer frontend and Jev-shaped API facade.
- New API: authentication, users, roles, permissions, quota, redemption,
  customer tokens, usage, logs, routing and admin console.
- JEV adapter: protocol conversion only.
- TypeSafe: official upstream Jev model endpoint.

Do not add another customer user table, permission system, credit ledger or API
key store to the JEV frontend.

## Acceptance

- Product naming is consistently JEV/Jev.
- Dashboard product mechanics follow the hosted Jev reference: balance, top up,
  API key management, usage and a simple API quick start.
- JEV login is New API login.
- User role/status/group/permissions are sourced from New API.
- Recharge codes are generated and managed in New API.
- Public Jev API keys are issued and metered by New API.

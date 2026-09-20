# JEV VIP

JEV VIP is an independent prepaid-access SaaS foundation for Jev users.

## Foundation

This repository intentionally starts from the MIT-licensed
[nextjs/saas-starter](https://github.com/nextjs/saas-starter) rather than
rebuilding common SaaS infrastructure.

Inherited starter capabilities:

- Next.js + React
- Postgres + Drizzle ORM
- Email/password authentication
- Protected dashboard routes
- Team/RBAC foundation
- Activity logging
- Stripe integration kept available for later use
- shadcn/ui primitives

## Phase 1: SaaS shell

Implemented now:

- Marketing landing page
- Sign up / sign in
- JEV VIP dashboard shell
- Overview metrics
- API Keys page and empty state
- Usage page and empty state
- Top-up pack UI
- Orders page and empty state
- Existing account and security settings

Not implemented in phase 1:

- Real payment collection
- Recharge settlement
- Automatic Jev account/key delivery
- Jev proxying
- Usage metering
- Credit ledger

Those belong to phase 2 and must plug into the existing dashboard rather than
replacing authentication or the SaaS shell.

## Local development

```bash
pnpm install
pnpm db:setup
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The starter's environment and Stripe variables remain available in
`.env.example`.

## Product reference

The product flow was informed by the public structure of
`jevtypesafeai.com`: prepaid credits, API-key management, usage visibility and
a customer dashboard. JEV VIP does not copy that site's branding or proprietary
assets.

JEV VIP is independent and is not affiliated with or operated by TypeSafe AI.

# JEV backend architecture audit

Audit date: 2026-09-21

## Executive status

The core architecture is now coherent:

```text
JEV customer frontend / BFF
  -> New API
       -> auth, users, roles, groups
       -> wallet quota
       -> redemption codes
       -> API keys
       -> model pricing
       -> rate limits
       -> usage / audit logs
       -> admin console
       -> jev-adapter
            -> TypeSafe /v1/systemone
```

There is no longer a second JEV user database or JEV wallet ledger. New API is
the commercial source of truth.

The repository builds successfully, but **public launch is not authorized until
the live end-to-end acceptance in `docs/LAUNCH_RUNBOOK.md` passes**.

## What New API can control from the administrator console

| Concern | Source of truth | Admin-changeable without JEV deploy |
| --- | --- | --- |
| User account/status | New API Users | yes |
| Role/group | New API Users / Groups | yes |
| User wallet quota | New API Users | yes |
| API keys | New API Tokens | yes |
| Allowed model | New API Token/model config | yes |
| Jev input/output price | New API Models/Pricing | yes |
| Group price multiplier | New API Groups/Ratio | yes |
| RPM/hour limits | New API Rate Limits/Groups | yes |
| Redemption-code quota | New API Redemption Codes | yes |
| Redemption expiry/status | New API Redemption Codes | yes |
| Request count/tokens/cost | New API Usage Logs | view/filter/export |
| New-user initial quota | New API System Settings | yes |
| Customer-facing CNY sale SKU | JEV sales config / external channel | **no** |
| Which exported code was sent to which sale order | external fulfillment process | **no** |

The last two rows are intentionally outside New API: an external marketplace
sale price/order is not the same thing as API wallet quota.

## V1 billing contract

- official TypeSafe cost: $0.042 / 1M Jev input tokens
- public JEV retail price: $0.42 / 1M input tokens
- output tokens: free
- New API internal unit: 500,000 quota = $1
- therefore 1M Jev input tokens = 210,000 quota
- default user/group multiplier = 1.0
- new user quota = 0

Recharge-pack mapping:

- ¥10 code -> 750,000 quota -> $1.50 API balance -> ~3.57M input tokens
- ¥30 code -> 2,250,000 quota -> $4.50 API balance -> ~10.71M input tokens
- ¥50 code -> 3,750,000 quota -> $7.50 API balance -> ~17.86M input tokens

These CNY package conversions are fixed sales terms, not live FX conversions.

## Findings fixed during this audit

### 1. Split-brain local account/wallet state

Old local users, teams, OfferKit campaign fields, credit balances and credit
transactions were still present after the New API migration.

Status: **fixed**. Local commercial database state has been removed from the
active architecture.

### 2. Undefined quota/price relationship

The old catalog had arbitrary credit values that were not tied to New API's
quota unit or Jev token pricing.

Status: **fixed**. Billing math is documented in `docs/BILLING_V1.md` and the
customer UI displays API balance instead of raw internal quota.

### 3. Missing authoritative-usage guard

A missing TypeSafe usage block could previously become zero metered tokens.

Status: **fixed**. The adapter now fails closed with 502 unless a successful
upstream response contains valid integer `usage.input_tokens`.

### 4. Shared-IP rate limiting

Every customer call reaches New API from the JEV server, so New API's global
per-IP limiter would collapse customers into one internal IP bucket.

Status: **fixed in deployment defaults**. Global IP API limiting is disabled;
use user/group/token controls.

### 5. Hardcoded API-key group

JEV-created API keys forced the literal group `default`, which would interfere
with future VIP/internal groups.

Status: **fixed**. JEV keys now leave group empty and follow New API's normal
user/default-group resolution.

### 6. Floating backend version

A floating New API image would make billing/auth behavior change during a
restart.

Status: **fixed**. The stack pins a specific New API release. Upgrades must be
treated as explicit migrations and rerun E2E.

## Remaining launch blockers

### P0 — must complete before accepting money

1. **Commercial/API permission check**
   Confirm the TypeSafe account/API terms permit the intended hosted/resold
   access model. The public website terms are not a substitute for any account
   or API agreement shown during console onboarding.

2. **Real New API bootstrap**
   Root setup, production secrets, Secure cookies, trusted origins, compliance
   confirmation, registration settings, and admin access controls must be
   configured on the deployed instance.

3. **Admin console isolation**
   New API should remain on localhost/private network. If an admin hostname is
   exposed, protect it with an additional admin-only access layer. Customer
   traffic should go through the JEV frontend/BFF.

4. **Real TypeSafe upstream**
   Add the funded/authorized TypeSafe API key to the adapter and verify the
   channel test.

5. **Model billing**
   Configure `jev` at $0.42/M input, $0/M output, group ratio 1.0. Keep the internal New API Pricing module enabled/public-to-the-private-network so the JEV BFF can read `/api/pricing`. Make a request and verify actual quota settlement and storefront display.

6. **Rate limits**
   Start conservatively at 120 RPM for the default group, then adjust after the
   real upstream account limits and production latency are known.

7. **Recharge inventory**
   Generate a disposable test code, then the production code batches with the
   exact quota denominations in `docs/BILLING_V1.md`.

8. **Sales fulfillment**
   Decide how an external order reserves one specific unused code. New API knows
   unused/used, but not "already sold but not yet redeemed". For V1 use either:
   - generate one code per order on demand; or
   - maintain a separate fulfillment sheet/list marking exported codes as sent.
   Do not select repeatedly from New API's "unused" list without a reservation
   process.

9. **Live backend E2E**
   Run `pnpm jev:e2e` with a disposable redemption code and confirm:
   registration/login -> redemption -> API key -> real Jev call -> token usage
   -> expected quota deduction -> key cleanup.

10. **Manual frontend E2E**
    Run the same path through the actual JEV browser UI, including session
    refresh and sign-out.

11. **Backups/monitoring**
    Back up New API PostgreSQL, test restore, monitor New API health, adapter
    health, upstream TypeSafe failures, error rate and upstream funding/quota.

## P1 — not required for first manual-sale launch

- customer-facing per-request usage table inside the JEV frontend
- password reset/email verification
- Turnstile after abuse appears
- admin-editable JEV documentation/CMS
- automatic marketplace order -> code fulfillment
- refund/order reconciliation
- upstream-cost vs retail-revenue margin dashboard
- customer IP preservation for richer abuse/audit analysis
- automated alert when upstream TypeSafe balance/limit is near exhaustion

## Important operational rule

Do not change `QuotaPerUnit` after sales begin merely to change the retail
price. Keep the internal unit stable and change the `jev` model price or group
ratio instead. Otherwise existing wallet balances and redemption denominations
change economic meaning.

Likewise, changing model price affects future consumption; already-issued
redemption codes retain the quota value with which they were generated.


## Final pre-deploy code hardening

The pre-deploy audit additionally fixed:

- fail-closed `AUTH_SECRET` validation (minimum 32 bytes)
- session cookie refresh retaining `Secure` based on canonical `BASE_URL`
- client IP forwarding for New API's critical auth rate limiter
- same-origin mutation checks failing closed instead of allowing missing Origin
- streaming request-size enforcement for `/api/v1/decide`
- sanitized gateway/upstream errors
- race-safe API-key creation using a unique temporary token name
- adapter health failure when required secrets are absent
- removal of experimental Next.js runtime flags
- Next.js / React security patch upgrades before deployment

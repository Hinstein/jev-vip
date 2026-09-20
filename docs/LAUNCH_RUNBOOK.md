# JEV launch runbook

This is the minimum end-to-end path that must pass before public sales.

## A. Infrastructure

1. Deploy the pinned New API image from `.env`; do not deploy a floating
   `latest` tag.
2. Start New API + PostgreSQL + Redis + JEV adapter.
3. Put the JEV site and New API administrator console behind HTTPS.
4. In production set New API session cookies to Secure. Set `SESSION_COOKIE_TRUSTED_URL` to exact HTTPS origins and ensure the JEV public origin is included, because the JEV BFF sends that Origin when refreshing/logout of New API sessions. Add the admin-console origin too if it differs.
5. Configure database backups before public sales.

## B. New API initial setup

1. Complete Root setup.
2. Confirm the payment/compliance setting required by New API before creating
   redemption codes.
3. Keep password login and password registration enabled.
4. Keep new-user initial quota at 0.
5. Verify `QuotaPerUnit = 500000` and treat it as immutable after launch.
6. Keep automatic default-token generation disabled.
7. Enable quota-consumption logs.
8. Keep the New API Pricing module enabled and readable without New API browser login; the JEV server reads internal `/api/pricing` to render the current retail rate. New API itself remains private/localhost.
9. Configure the default user group:
   - price ratio: 1.0
   - rate limit: 120 RPM, no hourly cap for V1.
10. Keep the global per-IP API limiter disabled for the internal JEV -> New API
   relay path.

## C. Jev upstream channel

Create one OpenAI-compatible New API channel:

```text
name: jev-typesafe
base URL: http://jev-adapter:4100
API key: <JEV_ADAPTER_SHARED_KEY>
model: jev
group: default
```

Then run the channel test.

The adapter itself must have a real `TYPESAFE_API_KEY` with enough official
TypeSafe quota.

## D. Pricing

Configure model `jev`:

```text
input:  $0.42 / 1M tokens
output: $0 / 1M tokens
group ratio: 1.0
```

See `docs/BILLING_V1.md`.

## E. Recharge batches

Create at least one disposable test code first.

Production batch examples:

```text
¥10 -> 750000 quota
¥30 -> 2250000 quota
¥50 -> 3750000 quota
```

For a 100-code ¥10 batch, create exactly 100 codes at 750,000 quota each.

## F. Full customer E2E acceptance

Run this exact sequence:

1. Register a fresh customer from the JEV frontend.
2. Verify the same user appears in New API User Management.
3. Confirm initial quota = 0.
4. Redeem one test code.
5. Confirm:
   - code status changes to used
   - used user ID is recorded
   - user quota increases by the code denomination
   - recharge/audit log exists
6. Create a JEV API key from the JEV frontend.
7. Confirm in New API:
   - the key belongs to that user
   - model restriction contains only `jev`
   - user-wallet quota is still the account spending limit
8. Call `POST /api/v1/decide`.
9. Confirm the response contains `usage.input_tokens`.
10. In New API usage logs confirm the same call shows:
    - user
    - token/key name
    - model `jev`
    - input token count
    - quota cost
    - success status
11. Check the wallet delta.

For an example response with 62 input tokens:

```text
62 × 0.21 quota = ~13 quota
13 quota / 500000 = ~$0.000026
```

The exact integer settlement may reflect New API's quota rounding.

## G. Failure-path acceptance

All of these must be tested:

- invalid API key -> 401
- disabled/revoked API key -> rejected
- disabled user -> rejected
- zero/insufficient user balance -> rejected before successful upstream use
- invalid Jev request -> 400 and no successful consumption
- TypeSafe upstream failure -> no successful consumption
- TypeSafe response missing valid usage.input_tokens -> JEV adapter returns 502
- same recharge code submitted twice -> only one credit
- concurrent double-redeem -> only one credit
- deleted/revoked key stops working immediately

## H. Price-change acceptance

After the baseline E2E passes:

1. Change `jev` input price in New API from $0.42/M to a temporary test value.
2. Make one test request.
3. Verify the log/quota delta changes accordingly.
4. Restore $0.42/M.

This proves that retail API pricing is controlled from the admin backend rather
than hard-coded into the JEV request path.

## I. Operations before public launch

- monitor official TypeSafe upstream balance separately from customer balances
- alert before the upstream account is close to exhaustion
- keep New API consumption logs enabled
- back up New API PostgreSQL
- back up the external code-distribution/export records
- record which redemption batch belongs to which sales SKU/channel
- do not promise an upstream rate limit until the actual TypeSafe account limit
  is verified


## J. Automated production smoke test

After the disposable test redemption code exists, run:

```bash
JEV_E2E_REDEMPTION_CODE=<one-time-test-code> pnpm jev:e2e
```

The script now fails if any of these invariants are wrong:

- New API `QuotaPerUnit` is not 500,000
- `jev` is not $0.42/M input and $0/M output
- redemption does not add quota
- a generated API key cannot call JEV
- the successful Jev result lacks input-token usage
- wallet deduction differs from New API pricing
- upstream commercial/account fields leak through the public JEV response

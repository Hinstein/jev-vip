# JEV billing V1

## Fixed V1 pricing

JEV V1 uses one public model, `jev`.

| Item | V1 value |
| --- | ---: |
| Retail input price | $0.42 / 1M input tokens |
| Retail output price | $0 |
| New API quota unit | 500,000 quota = $1 |
| Quota per input token | 0.21 quota |
| Default group ratio | 1.0 |
| New user initial quota | 0 |

The public retail price intentionally matches the current hosted Jev reference
price. The official TypeSafe public price is currently $0.042 / 1M input tokens
with output free. This gives V1 roughly a 10x gross price/cost spread before
infrastructure, payment-channel loss, refunds and support.

Sources checked on 2026-09-21:
- https://typesafe.ai/
- https://jevtypesafeai.com/pricing
- https://jevtypesafeai.com/docs

## New API model pricing

In the New API administrator console:

1. Open **Models** (`/console/models`).
2. Add or edit model `jev`.
3. Set input price to **$0.42 / 1M tokens**.
4. Set output price to **$0 / 1M tokens**.
5. Keep default user/group multiplier at **1.0**.

Equivalent quota math:

```text
1M input tokens
× $0.42 / 1M
× 500,000 quota / $1
= 210,000 quota

1 input token = 0.21 quota
```

If the New API pricing editor is using the expression mode, the equivalent
token expression is:

```text
tier("base", p * 0.42 + c * 0)
```

where `p` is input/prompt tokens and `c` is output/completion tokens.

## V1 CNY recharge packs

The external sales channel stays in CNY. Pack quota is deliberately fixed; it
does not change with live FX after codes are generated.

| Pack | Sale price | New API quota per code | API balance | Approx. Jev input tokens |
| --- | ---: | ---: | ---: | ---: |
| Starter | ¥10 | 750,000 | $1.50 | 3.57M |
| Standard | ¥30 | 2,250,000 | $4.50 | 10.71M |
| Pro | ¥50 | 3,750,000 | $7.50 | 17.86M |

The catalog convention is therefore:

```text
¥1 pack value = 75,000 New API quota
```

This is a commercial pack conversion, not a live foreign-exchange promise.

## Redemption-code batches

Generate codes in New API **Redemption Codes** (`/console/redemption`).

Suggested batches:

```text
XIANYU-CNY10-YYYYMM
quota: 750000
count: 100

XIANYU-CNY30-YYYYMM
quota: 2250000
count: 100

XIANYU-CNY50-YYYYMM
quota: 3750000
count: 100
```

New API currently permits up to 100 codes in one creation request. Export the
generated codes and distribute them through the external sales channel.

## What administrators can change without a JEV deploy

New API is the source of truth for all of these:

- user quota balance
- user enabled/disabled status
- user role and group
- redemption-code face value, expiry and status
- model input/output price
- group price multiplier
- API key limits and model restrictions
- API/user/group rate limits
- request usage logs and spend
- new-user starting quota

Changing the `jev` model price affects future API calls immediately. Existing
redemption codes keep the quota value they were issued with.

## Rate limiting

JEV calls New API from the JEV server. Therefore New API's global **per-IP API
limiter is disabled** in `docker-compose.backend.yml`; otherwise every customer
would share the JEV server's internal IP bucket.

For V1, configure the New API `default` user group to:

```json
{
  "default": [120, 0]
}
```

Interpretation: 120 requests/minute, no separate hourly cap. Increase this only
after the real TypeSafe upstream account limits and server capacity are measured.

## Billing integrity rule

The TypeSafe response is the authoritative usage source. The JEV adapter must
receive a valid integer `usage.input_tokens`; otherwise it returns 502 and the
call must not settle as a successful free request.

The adapter maps:

```text
TypeSafe usage.input_tokens  -> New API usage.prompt_tokens
TypeSafe usage.output_tokens -> New API usage.completion_tokens
```

New API then pre-consumes, settles against actual usage, writes the usage log
and updates the user's quota.

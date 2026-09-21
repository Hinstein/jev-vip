# New API backend

## Source-of-truth boundary

The JEV Store Next.js application is the customer-facing frontend. New API is the
account and business backend.

New API owns:

- registration and login
- user id, status, role, group and permissions
- login sessions
- account quota
- redemption codes
- customer API keys
- gateway authentication and routing
- usage / spend accounting
- request and administrator logs
- the administrator console

JEV does not keep a second business user, role table, permission model or credit
balance.

The JEV Store frontend stores only an HttpOnly signed session envelope containing the
current New API access token/user snapshot plus the New API refresh credential.
Access tokens are refreshed through New API's session endpoint.

## Login path

```text
JEV sign-in form
  -> POST New API /api/user/login
  -> New API validates username/password, status and login policy
  -> JEV stores the returned New API session in HttpOnly cookies
  -> protected JEV pages read /api/user/self
```

Role values remain New API's values:

- common user: 1
- admin: 10
- root: 100

Sensitive operations are still enforced by New API. The JEV Store frontend should
never implement a parallel authorization decision.

## Jev request path

The official TypeSafe endpoint is not OpenAI-compatible, so a narrow protocol
adapter remains:

```text
customer API key
  -> JEV /api/v1/decide
  -> New API /v1/chat/completions
       -> authenticate key
       -> enforce quota/model
       -> pre-consume quota
       -> route model "jev"
  -> jev-adapter /v1/chat/completions
  -> TypeSafe /v1/systemone
  -> authoritative usage.input_tokens
  -> New API settlement/logging
```

The adapter owns no users, keys, quota, redemption codes or billing state. It
fails closed when a successful TypeSafe response does not contain valid token
usage, preventing an unmetered successful call.

## First boot

1. Fill `.env`.
2. Start the backend:

   ```bash
   docker compose -f docker-compose.backend.yml up -d
   ```

3. Put the New API administrator console behind a protected HTTPS reverse proxy
   to `127.0.0.1:3001` and complete root setup.
4. Keep New API password registration/login enabled for the JEV customer
   frontend. JEV reads the public `/api/status` flags at the sign-in and
   sign-up pages, so the following New API Root settings are the source of
   truth for the customer auth experience:
   - configure the SMTP server in New API's email-server settings;
   - enable `EmailVerificationEnabled` when registration must verify an email;
   - enable `TurnstileCheckEnabled` and set `TurnstileSiteKey` plus
     `TurnstileSecretKey` when bot protection is required.

   With email verification enabled, JEV sends the code through New API's
   `GET /api/verification` endpoint and registers with
   `POST /api/user/register` using `email` and `verification_code`. Email
   verification is a registration step; normal password login does not ask
   for the email code. If Turnstile is enabled, JEV includes a fresh token on
   each protected request. A successful Turnstile-protected registration
   returns the user to sign-in because New API tokens are single-use.
5. Keep new-user quota at 0 and automatic default-token generation disabled.
6. Confirm New API payment/compliance settings so redemption-code generation is
   allowed.
7. Create an OpenAI-compatible channel:
   - Base URL: `http://jev-adapter:4100`
   - API key: `JEV_ADAPTER_SHARED_KEY`
   - Model: `jev`
8. Configure model `jev` to input $0.42/M and output $0/M.
9. Configure default group ratio 1.0 and V1 group rate limit 120 RPM.
10. Keep New API's global per-IP API limiter disabled on this internal relay
    deployment; customer limits belong at the user/group/token level.
11. Enable consumption logs.
12. Generate test and production recharge-code batches.

See `docs/BILLING_V1.md` and `docs/LAUNCH_RUNBOOK.md`.

## Frontend reference

The customer experience intentionally follows the same product mechanics as
jevtypesafeai.com: prepaid balance, API keys, usage visibility and a direct Jev
API quick start. Branding, copy and implementation remain independent.

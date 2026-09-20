# New API backend

## Source-of-truth boundary

The JEV Next.js application is the customer-facing frontend. New API is the
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

The JEV frontend stores only an HttpOnly signed session envelope containing the
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

Sensitive operations are still enforced by New API. The JEV frontend should
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
       -> meter/log
       -> route model "jev"
  -> jev-adapter /v1/chat/completions
  -> TypeSafe /v1/systemone
```

The adapter owns no users, keys, quota, redemption codes or billing state.

## First boot

1. Fill `.env`.
2. Start the backend:

   ```bash
   docker compose -f docker-compose.backend.yml up -d
   ```

3. Put the New API administrator console behind a protected HTTPS reverse proxy
   to `127.0.0.1:3001` and complete root setup.
4. Keep New API password registration/login enabled for the JEV customer
   frontend. For the current simple JEV signup form, keep Turnstile, email
   verification and password-login encryption disabled until those flows are
   explicitly implemented in JEV.
5. Disable automatic default-token generation; JEV creates customer API keys
   explicitly.
6. Create an OpenAI-compatible channel:
   - Base URL: `http://jev-adapter:4100`
   - API key: `JEV_ADAPTER_SHARED_KEY`
   - Model: `jev`
7. Configure the `jev` model ratio/quota rules in New API.
8. Generate recharge-code batches from the New API admin console.

## Frontend reference

The customer experience intentionally follows the same product mechanics as
jevtypesafeai.com: prepaid balance, API keys, usage visibility and a direct Jev
API quick start. Branding, copy and implementation remain independent.

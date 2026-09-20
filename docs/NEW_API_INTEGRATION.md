# New API integration

## Decision

New API is the only business backend. The custom JEV/ZEV Next.js application is
an interface layer; it does not own a duplicate user, wallet, token or voucher
database.

## Browser authentication

The frontend proxies `/api/*` to New API through the Next.js fallback rewrite.

- `POST /api/user/login` returns a short-lived access token.
- The access token stays in React memory.
- New API writes its HttpOnly refresh cookie through the same-origin proxy.
- `POST /api/user/auth/refresh` restores a browser session after a reload.
- Authenticated frontend requests send `Authorization: Bearer <access_token>`.

Production must set New API `SESSION_COOKIE_TRUSTED_URL` to the exact frontend
origin and serve the site over HTTPS.

## Customer flows

- Register: `POST /api/user/register`
- Login: `POST /api/user/login`
- Account: `GET/PUT /api/user/self`
- Sessions: `GET /api/user/sessions`
- Wallet/redeem: `POST /api/user/topup`
- Tokens: `GET/POST /api/token/`, `DELETE /api/token/:id`
- Reveal token: `POST /api/token/:id/key`
- Usage: `GET /api/log/self`

## Admin flows

Do not reimplement the New API operator console in this repository. Operators
use the New API admin UI for:

- users and quota
- redemption-code batches
- channels and provider credentials
- model availability and pricing
- logs and statistics
- subscriptions
- system settings

## Public gateway

API traffic should go directly to New API (for example
`https://api.example.com/v1`) rather than through the Next.js application.
This keeps streaming, timeouts and gateway scaling separate from the marketing
and dashboard frontend.

## Feature compatibility

The first custom frontend supports ordinary username/password sessions and
optional email verification. Before enabling these New API security switches,
extend the frontend for the corresponding protocol:

- password-login encryption
- Turnstile
- login-time 2FA / secondary verification

New API's admin accounts can still use the upstream New API console directly.

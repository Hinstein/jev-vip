# Reference product notes

Reference reviewed: https://jevtypesafeai.com/

## Product mechanics worth reusing

The reference product turns Jev access into a familiar prepaid developer SaaS:

1. User creates an account.
2. User prepays a credit balance.
3. User receives/manages an API key from the dashboard.
4. API usage deducts against prepaid credits.
5. Dashboard exposes remaining balance and usage.
6. Documentation provides a simple Bearer-token API workflow.
7. The service clearly discloses that it is independent from TypeSafe AI.

## What JEV Store adopts in phase 1

- Customer dashboard as the product center
- Credit balance as the primary account state
- API Keys as a first-class dashboard section
- Usage visibility
- Top-up packs
- Order history
- Clear independent-service disclaimer

## What is intentionally not copied

- Branding, logo, wording, proprietary assets or visual identity
- Their exact checkout implementation
- Their backend proxy implementation
- Their secret/key issuance implementation
- Their pricing markup

The UI uses the Next.js SaaS Starter's existing component system and an original
JEV Store layout.

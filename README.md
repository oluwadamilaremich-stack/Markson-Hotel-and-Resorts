# Markson Hotels & Resorts

Markson Hotels & Resorts is a hotel website and booking demo built with Next.js. The site includes
room browsing, test-mode Paystack checkout, guest contact and newsletter forms, and Telegram
operations notifications.

## Repository layout

- `apps/frontend/` — Next.js website, API routes, booking flow, and Telegram bot code.
- `docs/` — Booking demo and Telegram operations guides.

## Run locally

Use Node.js and npm. From PowerShell:

```powershell
Set-Location apps/frontend
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Set `PAYSTACK_SECRET_KEY` in `.env.local` to a Paystack **test** secret, then run:

```powershell
npm run dev
```

The site is available at `http://localhost:3000`.

To receive Telegram commands locally, run `npm run bot:dev` in a second terminal from
`apps/frontend`. Local polling disables the bot's webhook; do not run it at the same time as the
deployed webhook. See [the Telegram operations guide](docs/telegram-bot.md) for setup details.

## Validation

From `apps/frontend`, run:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## Current limitations

- Paystack checkout is restricted to test mode and does not charge real money.
- Booking and editable content data use local JSON files; production deployment needs durable
  database storage and atomic availability handling.
- Do not commit `.env.local` or runtime booking data.

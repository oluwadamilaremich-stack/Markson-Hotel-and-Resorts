# Markson Hotels & Resorts

Markson Hotels & Resorts is a full-stack Next.js hotel website and booking demo. The site includes
room browsing, test-mode Paystack checkout, guest contact and newsletter forms, and Telegram
operations notifications. The website and its API routes deploy together as one application.

## Repository layout

- `src/` — Next.js website, API routes, booking flow, and Telegram integration.
- `public/` — Static images and other assets.
- `docs/` — Booking demo and Telegram operations guides.

## Run locally

Use Node.js and npm from the repository root:

```powershell
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Set `PAYSTACK_SECRET_KEY` in `.env.local` to a Paystack **test** secret, then run:

```powershell
npm run dev
```

The site is available at `http://localhost:3000`.

To receive Telegram commands locally, run `npm run bot:dev` in a second terminal. Local polling
disables the bot's webhook; do not run it at the same time as the deployed webhook. See
[the Telegram operations guide](docs/telegram-bot.md) for setup details.

## Deploy to Vercel

Import this Git repository into Vercel and leave **Root Directory** set to `.` (the repository
root). Vercel detects Next.js and uses the root `package.json` and lockfile to build the website
and API routes together. Connect the Git repository's production branch to deploy pushes
automatically.

Add these environment variables in the Vercel project settings before deploying:

- `PAYSTACK_SECRET_KEY` — Paystack **test** secret only.
- `APP_URL` — The deployed site's canonical HTTPS URL.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_ADMIN_USER_IDS`, and
  `TELEGRAM_WEBHOOK_SECRET` — Required for Telegram operations.
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` — Required for transactional
  email.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` — Optional hosted
  image uploads.

Set the Telegram webhook to `https://<your-domain>/api/telegram/webhook` after deployment; see
[the Telegram operations guide](docs/telegram-bot.md).

## Validation

Run from the repository root:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## Current limitations

- Paystack checkout is restricted to test mode and does not charge real money.
- Booking and editable content data use local JSON files. Vercel's filesystem is not durable, so
  production bookings and content require durable database storage and atomic availability handling.
- Do not commit `.env.local` or runtime booking data.

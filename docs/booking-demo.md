# Demo booking and Paystack test mode

The booking drawer calls Next.js Route Handlers in `src/`. The server recalculates the
total, initializes Paystack hosted checkout, and verifies the returned transaction. It only accepts
a secret key beginning with `sk_test_`; keep the key in `.env.local`, never in a
`NEXT_PUBLIC_` variable.

## Run locally

1. In the Paystack dashboard, use test mode and create a test secret key.
2. From the repository root, run `npm ci`, copy `.env.example` to `.env.local`, and set `PAYSTACK_SECRET_KEY` to the test key and `MONGODB_URI` to your MongoDB Atlas connection string.
3. Keep `APP_URL` set to `http://localhost:3000`, then run `npm run dev`.
4. Open a room page, select **Book a Stay**, and complete checkout with Paystack's test details.

The server verifies transaction status, reference, currency, room, dates, guest limit, and the
server-calculated amount. After verification, the app records demo bookings in MongoDB, then waits
for the Telegram staff alert and guest confirmation email to send. Configure `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `BREVO_API_KEY`, and `BREVO_SENDER_EMAIL` in Vercel for production alerts.
`GET /api/health` checks server status.

Paystack is restricted to test mode: a successful test transaction does not charge real money.
Do not use a live secret key. Room and blog content are stored in MongoDB. The Telegram admin CMS
can update this content; Cloudinary credentials are needed for room and blog photo uploads.

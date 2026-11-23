# Markson frontend

Next.js website and booking application. Booking endpoints run as Next.js Route Handlers in the same app.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `PAYSTACK_SECRET_KEY` in `.env.local` to a Paystack test key before testing checkout.

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` to validate the frontend.

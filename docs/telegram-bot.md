# Markson Hotels & Resorts — Telegram Bot Operations System

This document outlines the architecture, setup, commands, and notification structure for the Markson Telegram Bot Operations Concierge, which replaces a traditional admin dashboard.

---

## 1. System Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │                     GUEST JOURNEY                      │
                       │   • Room Reservation Checkout (Paystack Test/Live)    │
                       │   • Contact Inquiry Form (/contact)                    │
                       │   • Newsletter Subscription                            │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     NEXT.JS BACKEND                                           │
│                                                                                               │
│  [Paystack Verification]          [Contact API]              [Newsletter API]                 │
│  /api/bookings/verify/[ref]       POST /api/contact          POST /api/newsletter             │
│            │                             │                          │                         │
│            └─────────────────────────────┼──────────────────────────┘                         │
│                                          │                                                    │
│                                          ▼                                                    │
│                        Telegram Dispatcher (lib/server/telegram.ts)                           │
│                        • HTML entity escaping                                                 │
│                        • Nigerian phone number converter (080.. → wa.me/234..)               │
│                        • Duplicate alert prevention (in-memory reference set)                 │
│                        • Inline Keyboard generation (Call, WhatsApp, Acknowledge)             │
│                                          │                                                    │
│                                          ▼ POST /sendMessage                                  │
└──────────────────────────────────────────┼────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TELEGRAM BOT API (api.telegram.org)                           │
│                                                                                               │
│  Push to:                                                     Two-way Webhook:                │
│  Staff Chat / Group (TELEGRAM_CHAT_ID)                        POST /api/telegram/webhook      │
│  • 🛎️ New Confirmed Booking                                   • /rooms (Catalog & Pricing)    │
│  • 📬 New Guest Inquiry                                        • /status (Lagos Time & Health) │
│  • 📰 New Subscriber                                          • /contact (Hotel Contacts)     │
│                                                               • Interactive Button Callbacks  │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Notification Formats & Quick Actions

### A. Confirmed Booking Alert (Dispatched on Paystack Verification)
```html
🛎️ NEW CONFIRMED BOOKING
━━━━━━━━━━━━━━━━━━━━━━
🏨 Room: Ocean View King Suite
👤 Guest: Olumide Adeleke
📞 Phone: 08121141582
✉️ Email: olumide@example.com
📅 Dates: 2026-11-20 → 2026-11-23 (3 nights)
👥 Guests: 2
💳 Total Paid: ₦1,710,000 (Paystack Verified)
🔖 Ref: markson_4fe8adc870f64d028f264116b2378373
━━━━━━━━━━━━━━━━━━━━━━
Tap below to contact the guest directly:
[ 📞 Call Guest ]  [ 💬 WhatsApp ]
[ ✅ Mark Acknowledged ]
```

* **One-tap Call**: Opens the device phone dialer with `tel:+2348121141582`.
* **One-tap WhatsApp**: Formats `0812...` into `https://wa.me/2348121141582` and opens WhatsApp directly to chat with the guest.
* **Mark Acknowledged**: When any staff member taps this button, the bot edits the message in the group to: `✅ Acknowledged by @username at 2:34 PM`, preventing duplicate handling by front desk staff.

---

### B. Contact Inquiry Alert (Dispatched from `/contact`)
```html
📬 NEW GUEST INQUIRY
━━━━━━━━━━━━━━━━━━━━━━
🏷️ Topic: Events & Weddings
👤 From: Chioma Eze
✉️ Email: chioma@example.com
📝 Message:
Inquiring about beachfront wedding packages for 150 guests in December.
━━━━━━━━━━━━━━━━━━━━━━
[ ✉️ Reply via Email ]  [ ✅ Handled ]
```

---

### C. Newsletter Subscription Alert
```html
📰 NEW NEWSLETTER SUBSCRIBER
━━━━━━━━━━━━━━━━━━━━━━
✉️ Email: guest@example.com
━━━━━━━━━━━━━━━━━━━━━━
```

---

## 3. Bot Commands (Available in Chat)

Staff can send commands directly to the bot in their private chat or group:

* `/start` or `/help` — Welcome greeting, menu buttons, and overview of system capabilities.
* `/rooms` — Current rates in Naira (₦), bed configurations, max guest counts, and square footage for all 6 suites.
* `/status` — Server time in Lagos (`Africa/Lagos`), Paystack environment status (Test/Live), and bot health.
* `/contact` — Quick lookup for Markson hotel address, concierge phone, and department emails.

---

## 4. Setup Guide (2 Minutes)

### Step 1: Create the Telegram Bot
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`.
3. Give your bot a display name (e.g., `Markson Hotel Operations`).
4. Give it a username ending in `bot` (e.g., `MarksonHotelBot`).
5. Copy the generated **HTTP API Token**.

### Step 2: Get your Chat ID or Group ID
* **For Private Alerts**:
  1. Search for `@userinfobot` on Telegram and click **Start**.
  2. Copy your numeric `Id` (e.g., `123456789`).
* **For a Team Group (Front Desk / Reservations Team)**:
  1. Create a group named "Markson Reservations" and add your bot.
  2. Add `@RawDataBot` to the group temporarily to get the group `chat_id` (starts with `-100...`).
  3. Remove `@RawDataBot`.

### Step 3: Add to `.env.local`
In `apps/frontend/.env.local`:
```env
TELEGRAM_BOT_TOKEN=your_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_or_group_id
TELEGRAM_ADMIN_USER_IDS=123456789,987654321
TELEGRAM_WEBHOOK_SECRET=create_a_random_string_here
```

`TELEGRAM_ADMIN_USER_IDS` contains the numeric Telegram user IDs allowed to perform admin
actions such as early checkout. It is required for group chats. In a private chat, the configured
`TELEGRAM_CHAT_ID` owner is also recognized as an admin.

### Step 4: Register the Webhook (When deployed or using ngrok)
Run this command in PowerShell or terminal (replace with your values):
```powershell
$TOKEN = "YOUR_BOT_TOKEN"
$WEBHOOK_URL = "https://your-domain.com/api/telegram/webhook"
$SECRET = "YOUR_WEBHOOK_SECRET"

Invoke-RestMethod -Uri "https://api.telegram.org/bot$TOKEN/setWebhook" -Method Post -Body @{
    url = $WEBHOOK_URL
    secret_token = $SECRET
}
```
For local development without a public URL, run the web app and `npm run bot:dev` in separate
terminals from `apps/frontend`. The poller receives commands and button clicks locally, and
disables the webhook before polling. Do not run it at the same time as the deployed webhook;
register the webhook again when switching back to deployment.

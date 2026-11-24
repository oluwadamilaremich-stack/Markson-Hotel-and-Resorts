import https from "node:https";
import { rooms } from "@/content/rooms";
import { formatNaira } from "@/lib/format";
import { site } from "@/lib/site";
import { markBookingCheckedOut } from "./store";

export function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || "";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || "";
  return {
    token,
    chatId,
    webhookSecret,
    isConfigured: Boolean(token && chatId),
  };
}

function isAuthorizedAdmin(userId: number, chatId: number, chatType: string) {
  const { chatId: configuredChatId } = getTelegramConfig();
  const allowedUserIds = (process.env.TELEGRAM_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return (
    String(chatId) === configuredChatId &&
    (allowedUserIds.includes(String(userId)) ||
      (chatType === "private" && String(userId) === configuredChatId))
  );
}

/**
 * Clean and convert phone numbers to WhatsApp click-to-chat links (https://wa.me/234...).
 * Formats Nigerian domestic numbers (e.g., 08012345678) into international 2348012345678.
 */
export function formatWhatsAppUrl(phone: string): string | null {
  if (!phone) return null;
  // Remove spaces, hyphens, parentheses, pluses
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  // If local Nigerian format (e.g. 080... or 090... with 11 digits)
  if (digits.startsWith("0") && digits.length === 11) {
    return `https://wa.me/234${digits.slice(1)}`;
  }
  // If already starts with 234
  if (digits.startsWith("234") && digits.length >= 13) {
    return `https://wa.me/${digits}`;
  }
  // General international format
  if (digits.length >= 10) {
    return `https://wa.me/${digits}`;
  }
  return null;
}

export function formatTelUrl(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type InlineKeyboardButton =
  | { text: string; url: string }
  | { text: string; callback_data: string };

type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

/**
 * Generic caller for Telegram Bot API methods.
 */
export async function callTelegramApi(
  method: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; result?: unknown; description?: string }> {
  const { token, isConfigured } = getTelegramConfig();
  if (!isConfigured) {
    console.warn(`[Telegram Bot] Skipped call to '${method}': TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.`);
    return { ok: false, description: "Telegram credentials not configured" };
  }

  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const req = https.request(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": Buffer.byteLength(postData),
        },
        family: 4,
        timeout: 10000,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (!data.ok) {
              console.error(`[Telegram Bot] Error calling ${method}:`, data);
              resolve({ ok: false, description: data.description ?? "Telegram API error" });
            } else {
              resolve({ ok: true, result: data.result });
            }
          } catch {
            resolve({ ok: false, description: "Invalid JSON from Telegram" });
          }
        });
      },
    );

    req.on("error", (error) => {
      console.error(`[Telegram Bot] Network failure calling ${method}:`, error);
      resolve({ ok: false, description: "Network failure calling Telegram" });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, description: "Timeout calling Telegram" });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send an HTML-formatted message to the designated hotel staff chat or group.
 */
export async function sendTelegramMessage(
  text: string,
  options?: {
    chatId?: string | number;
    replyMarkup?: InlineKeyboardMarkup;
    disableWebPagePreview?: boolean;
  },
) {
  const { chatId: defaultChatId } = getTelegramConfig();
  const targetChatId = options?.chatId ?? defaultChatId;

  if (!targetChatId) {
    return { ok: false, description: "No target chat ID" };
  }

  return callTelegramApi("sendMessage", {
    chat_id: targetChatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: options?.disableWebPagePreview ?? true,
    ...(options?.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
  });
}

// Track sent booking references to avoid duplicate alerts upon page reloads
const notifiedBookingReferences = new Set<string>();

export type BookingAlertPayload = {
  reference: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  amountKobo: number;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
};

/**
 * Dispatches an instant booking notification with quick contact action buttons.
 */
export async function sendBookingAlert(booking: BookingAlertPayload) {
  if (notifiedBookingReferences.has(booking.reference)) {
    return { ok: true, description: "Already notified" };
  }

  const amountNaira = formatNaira(booking.amountKobo / 100);
  const guestName = escapeHtml(booking.guestName || "Guest");
  const roomName = escapeHtml(booking.roomName);
  const guestPhone = escapeHtml(booking.guestPhone || "Not provided");
  const guestEmail = escapeHtml(booking.guestEmail || "Not provided");

  const cleanTel = booking.guestPhone ? booking.guestPhone.replace(/[^\d+]/g, "") : "";
  const phoneMarkup = cleanTel
    ? `<a href="tel:${cleanTel}"><code>${guestPhone}</code></a>`
    : `<code>${guestPhone}</code>`;

  const text = [
    `🛎️ <b>NEW CONFIRMED BOOKING</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🏨 <b>Room:</b> ${roomName}`,
    `👤 <b>Guest:</b> ${guestName}`,
    `📞 <b>Phone:</b> ${phoneMarkup} <i>(tap to dial)</i>`,
    `✉️ <b>Email:</b> <code>${guestEmail}</code>`,
    `📅 <b>Dates:</b> ${booking.checkIn} → ${booking.checkOut} (<b>${booking.nights} night${booking.nights > 1 ? "s" : ""}</b>)`,
    `👥 <b>Guests:</b> ${booking.guests}`,
    `💳 <b>Total Paid:</b> <b>${amountNaira}</b> <i>(Paystack Verified)</i>`,
    `🔖 <b>Ref:</b> <code>${escapeHtml(booking.reference)}</code>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `<i>Tap below to open WhatsApp chat with the guest:</i>`,
  ].join("\n");

  const actionButtons: InlineKeyboardButton[] = [];
  if (booking.guestPhone) {
    const wa = formatWhatsAppUrl(booking.guestPhone);
    if (wa) actionButtons.push({ text: "💬 WhatsApp Guest", url: wa });
  }

  const keyboardRows: InlineKeyboardButton[][] = [];
  if (actionButtons.length > 0) {
    keyboardRows.push(actionButtons);
  }
  keyboardRows.push([
    { text: "🏁 Early checkout", callback_data: `early_checkout:${booking.reference}` },
  ]);
  keyboardRows.push([
    { text: "✅ Mark Acknowledged", callback_data: `ack_booking:${booking.reference}` },
  ]);

  const result = await sendTelegramMessage(text, {
    replyMarkup: { inline_keyboard: keyboardRows },
  });

  if (result.ok) {
    notifiedBookingReferences.add(booking.reference);
  }

  return result;
}

export type ContactInquiryPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/**
 * Dispatches an instant contact inquiry alert.
 */
export async function sendContactAlert(inquiry: ContactInquiryPayload) {
  const name = escapeHtml(inquiry.name);
  const email = escapeHtml(inquiry.email);
  const subject = escapeHtml(inquiry.subject);
  const message = escapeHtml(inquiry.message);

  const text = [
    `📬 <b>NEW GUEST INQUIRY</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🏷️ <b>Topic:</b> ${subject}`,
    `👤 <b>From:</b> ${name}`,
    `✉️ <b>Email:</b> <code>${email}</code>`,
    `📝 <b>Message:</b>`,
    `<blockquote>${message}</blockquote>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

  const keyboardRows: InlineKeyboardButton[][] = [
    [
      { text: "✉️ Reply via Email", url: `mailto:${encodeURIComponent(inquiry.email)}?subject=Re:%20${encodeURIComponent(inquiry.subject)}` },
      { text: "✅ Handled", callback_data: `ack_contact:${Date.now().toString(36)}` },
    ],
  ];

  return sendTelegramMessage(text, {
    replyMarkup: { inline_keyboard: keyboardRows },
  });
}

/**
 * Dispatches a quick newsletter subscription alert.
 */
export async function sendNewsletterAlert(email: string) {
  const safeEmail = escapeHtml(email);
  const text = [
    `📰 <b>NEW NEWSLETTER SUBSCRIBER</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `✉️ <b>Email:</b> <code>${safeEmail}</code>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

  return sendTelegramMessage(text);
}

// Telegram Update Types for Webhook
export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; is_bot: boolean; first_name: string; username?: string };
    chat: { id: number; type: string; title?: string };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string; username?: string };
    message?: { message_id: number; chat: { id: number; type: string }; text?: string };
    data?: string;
  };
};

/**
 * Handles incoming Telegram bot webhook updates (commands and callback buttons).
 */
export async function handleTelegramUpdate(update: TelegramUpdate) {
  // 1. Handle Inline Button Clicks (Callback Queries)
  if (update.callback_query) {
    const cq = update.callback_query;
    const data = cq.data || "";
    const staffName = cq.from.username ? `@${cq.from.username}` : cq.from.first_name;

    if (data.startsWith("early_checkout:")) {
      if (!cq.message || !isAuthorizedAdmin(cq.from.id, cq.message.chat.id, cq.message.chat.type)) {
        await callTelegramApi("answerCallbackQuery", {
          callback_query_id: cq.id,
          text: "Only an authorized hotel admin can check out a booking.",
          show_alert: true,
        });
        return { ok: true };
      }

      const reference = data.slice("early_checkout:".length);
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: "Confirm the guest has checked out today.",
        show_alert: false,
      });
      await sendTelegramMessage(
        `Confirm early checkout for booking <code>${escapeHtml(reference)}</code>? This records today's date in Lagos time and releases later dates.`,
        {
          chatId: cq.message.chat.id,
          replyMarkup: {
            inline_keyboard: [[
              { text: "✅ Confirm checkout today", callback_data: `early_checkout_confirm:${reference}` },
              { text: "Cancel", callback_data: "early_checkout_cancel" },
            ]],
          },
        },
      );
      return { ok: true };
    }

    if (data.startsWith("early_checkout_confirm:")) {
      if (!cq.message || !isAuthorizedAdmin(cq.from.id, cq.message.chat.id, cq.message.chat.type)) {
        await callTelegramApi("answerCallbackQuery", {
          callback_query_id: cq.id,
          text: "Only an authorized hotel admin can check out a booking.",
          show_alert: true,
        });
        return { ok: true };
      }

      const reference = data.slice("early_checkout_confirm:".length);
      const result = await markBookingCheckedOut(reference);
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: result.message,
        show_alert: !result.ok,
      });
      if (result.ok && result.booking) {
        await sendTelegramMessage(
          `✅ <b>Early checkout recorded</b>\n🏨 ${escapeHtml(result.booking.roomName)}\n📅 Room released from ${result.booking.actualCheckOut}.\n🔖 <code>${escapeHtml(reference)}</code>`,
          { chatId: cq.message.chat.id },
        );
      }
      return { ok: true };
    }

    if (data === "early_checkout_cancel") {
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: "Checkout cancelled.",
      });
      return { ok: true };
    }

    if (data.startsWith("ack_booking:")) {
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: `Booking acknowledged by ${staffName}!`,
        show_alert: false,
      });

      if (cq.message) {
        const time = new Intl.DateTimeFormat("en-NG", {
          timeZone: "Africa/Lagos",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date());

        const updatedText = `${cq.message.text || ""}\n\n✅ <i>Acknowledged by ${escapeHtml(staffName)} at ${time}</i>`;
        await callTelegramApi("editMessageText", {
          chat_id: cq.message.chat.id,
          message_id: cq.message.message_id,
          text: updatedText,
          parse_mode: "HTML",
        });
      }
      return { ok: true };
    }

    if (data.startsWith("ack_contact:")) {
      await callTelegramApi("answerCallbackQuery", {
        callback_query_id: cq.id,
        text: `Inquiry marked as handled by ${staffName}!`,
        show_alert: false,
      });

      if (cq.message) {
        const time = new Intl.DateTimeFormat("en-NG", {
          timeZone: "Africa/Lagos",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date());

        const updatedText = `${cq.message.text || ""}\n\n✅ <i>Handled by ${escapeHtml(staffName)} at ${time}</i>`;
        await callTelegramApi("editMessageText", {
          chat_id: cq.message.chat.id,
          message_id: cq.message.message_id,
          text: updatedText,
          parse_mode: "HTML",
        });
      }
      return { ok: true };
    }

    if (data === "cmd_rooms") {
      await callTelegramApi("answerCallbackQuery", { callback_query_id: cq.id });
      if (cq.message) {
        const roomLines = rooms.map((r, i) => {
          return `${i + 1}. <b>${escapeHtml(r.name)}</b>\n   • Rate: <b>${formatNaira(r.pricePerNight)}</b> / night\n   • Bed: ${escapeHtml(r.beds)} (${r.maxGuests} max guests)\n   • Size: ${r.sizeSqft} sq. ft.`;
        });
        const reply = [
          `🏨 <b>Markson Room &amp; Suite Catalog</b>`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          ...roomLines,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `<i>Rates are synchronized with the online booking drawer.</i>`,
        ].join("\n");
        await sendTelegramMessage(reply, { chatId: cq.message.chat.id });
      }
      return { ok: true };
    }

    if (data === "cmd_status") {
      await callTelegramApi("answerCallbackQuery", { callback_query_id: cq.id });
      if (cq.message) {
        const now = new Intl.DateTimeFormat("en-NG", {
          timeZone: "Africa/Lagos",
          dateStyle: "medium",
          timeStyle: "medium",
        }).format(new Date());

        const paystackKey = process.env.PAYSTACK_SECRET_KEY || "";
        const paystackMode = paystackKey.startsWith("sk_live_")
          ? "🟢 LIVE MODE"
          : paystackKey.startsWith("sk_test_")
          ? "🟡 TEST MODE"
          : "🔴 NOT CONFIGURED";

        const reply = [
          `⚡ <b>Markson HR System Status</b>`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `🕒 <b>Lagos Time:</b> ${now}`,
          `💳 <b>Paystack Status:</b> ${paystackMode}`,
          `🌐 <b>App URL:</b> <code>${process.env.APP_URL || "http://localhost:3000"}</code>`,
          `🤖 <b>Telegram Alerts:</b> 🟢 Active`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
        ].join("\n");
        await sendTelegramMessage(reply, { chatId: cq.message.chat.id });
      }
      return { ok: true };
    }

    // Default answer
    await callTelegramApi("answerCallbackQuery", {
      callback_query_id: cq.id,
      text: "Action registered.",
    });
    return { ok: true };
  }

  // 2. Handle Text Messages & Commands
  if (update.message && typeof update.message.text === "string") {
    const text = update.message.text.trim();
    const chatId = update.message.chat.id;
    const command = text.split(/\s+/)[0].toLowerCase().split("@")[0];

    switch (command) {
      case "/start":
      case "/menu":
      case "/help": {
        const welcome = [
          `🌊 <b>Markson Hotels &amp; Resorts Bot</b>`,
          `Welcome to your hotel operations concierge. This bot automatically pushes real-time guest bookings, inquiries, and subscriber updates here.`,
          ``,
          `<b>Available Commands:</b>`,
          `• /rooms — View all suites, capacities &amp; rates`,
          `• /status — Server &amp; payment gateway status`,
          `• /contact — Hotel contact information`,
          `• /help — Show this help overview`,
          ``,
          `<i>Alerts are pushed automatically when guests book or reach out on the website.</i>`,
        ].join("\n");

        await sendTelegramMessage(welcome, {
          chatId,
          replyMarkup: {
            inline_keyboard: [
              [
                { text: "🏨 View Rooms", callback_data: "cmd_rooms" },
                { text: "⚡ System Status", callback_data: "cmd_status" },
              ],
              [
                { text: "🌐 Open Website", url: process.env.APP_URL || "https://marksonhotel.com" },
              ],
            ],
          },
        });
        break;
      }

      case "/rooms": {
        const roomLines = rooms.map((r, i) => {
          return `${i + 1}. <b>${escapeHtml(r.name)}</b>\n   • Rate: <b>${formatNaira(r.pricePerNight)}</b> / night\n   • Bed: ${escapeHtml(r.beds)} (${r.maxGuests} max guests)\n   • Size: ${r.sizeSqft} sq. ft.`;
        });

        const reply = [
          `🏨 <b>Markson Room &amp; Suite Catalog</b>`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          ...roomLines,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `<i>Rates are synchronized with the online booking drawer.</i>`,
        ].join("\n");

        await sendTelegramMessage(reply, { chatId });
        break;
      }

      case "/status": {
        const now = new Intl.DateTimeFormat("en-NG", {
          timeZone: "Africa/Lagos",
          dateStyle: "medium",
          timeStyle: "medium",
        }).format(new Date());

        const paystackKey = process.env.PAYSTACK_SECRET_KEY || "";
        const paystackMode = paystackKey.startsWith("sk_live_")
          ? "🟢 LIVE MODE"
          : paystackKey.startsWith("sk_test_")
          ? "🟡 TEST MODE"
          : "🔴 NOT CONFIGURED";

        const reply = [
          `⚡ <b>Markson HR System Status</b>`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `🕒 <b>Lagos Time:</b> ${now}`,
          `💳 <b>Paystack Status:</b> ${paystackMode}`,
          `🌐 <b>App URL:</b> <code>${process.env.APP_URL || "http://localhost:3000"}</code>`,
          `🤖 <b>Telegram Alerts:</b> 🟢 Active`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
        ].join("\n");

        await sendTelegramMessage(reply, { chatId });
        break;
      }

      case "/contact": {
        const reply = [
          `📍 <b>Markson Hotels &amp; Resorts Details</b>`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `🏢 <b>Location:</b> ${escapeHtml(site.address)}`,
          `📞 <b>Reservations:</b> ${site.phone}`,
          `✉️ <b>General Email:</b> ${site.emails.general}`,
          `✉️ <b>Bookings Email:</b> ${site.emails.bookings}`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
        ].join("\n");

        await sendTelegramMessage(reply, { chatId });
        break;
      }

      case "/admin": {
        if (!isAuthorizedAdmin(
          update.message.from?.id ?? 0,
          chatId,
          update.message.chat.type,
        )) {
          await sendTelegramMessage("⛔ Admin access is restricted to authorized hotel staff.", { chatId });
          break;
        }

        await sendTelegramMessage(
          "🔐 <b>Hotel admin actions</b>\nUse the <b>Early checkout</b> button on a booking alert to record an early departure. Scheduled checkout dates release automatically.",
          { chatId },
        );
        break;
      }

      default:
        await sendTelegramMessage(
          "I can help with hotel operations, but I don't understand free-form prompts. Try /start, /rooms, /status, /contact, or /admin.",
          { chatId },
        );
        break;
    }
  }

  return { ok: true };
}

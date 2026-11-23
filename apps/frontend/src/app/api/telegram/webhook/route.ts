import {
  getTelegramConfig,
  handleTelegramUpdate,
  type TelegramUpdate,
} from "@/lib/server/telegram";

export async function POST(request: Request) {
  const { webhookSecret, isConfigured } = getTelegramConfig();

  // If secret token is configured, enforce it
  if (webhookSecret) {
    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (receivedSecret !== webhookSecret) {
      return Response.json({ error: "Unauthorized: Invalid Telegram secret token." }, { status: 401 });
    }
  }

  if (!isConfigured) {
    return Response.json(
      { error: "Telegram bot is not configured on this server." },
      { status: 503 },
    );
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch (error) {
    console.error("[Telegram Webhook] Failed to parse JSON payload:", error);
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    await handleTelegramUpdate(update);
  } catch (error) {
    console.error("[Telegram Webhook] Error processing update:", error);
    // Still return 200 to Telegram so it doesn't repeatedly retry a faulty update
  }

  return Response.json({ ok: true });
}

export async function GET() {
  const config = getTelegramConfig();

  return Response.json({
    status: "ok",
    service: "Markson Hotels & Resorts Telegram Webhook",
    configured: config.isConfigured,
    hasWebhookSecret: Boolean(config.webhookSecret),
    setupGuide: {
      step1: "Create a bot using @BotFather on Telegram to obtain TELEGRAM_BOT_TOKEN.",
      step2: "Obtain your staff or reservations group chat ID using @userinfobot or @RawDataBot.",
      step3: "To set webhook: curl -F 'url=https://YOUR_DOMAIN/api/telegram/webhook' -F 'secret_token=YOUR_SECRET' https://api.telegram.org/botYOUR_TOKEN/setWebhook",
    },
  });
}

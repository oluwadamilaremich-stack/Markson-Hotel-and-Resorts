import { sendNewsletterAlert } from "@/lib/server/telegram";
import { readJsonBody } from "@/lib/server/request";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const data = body.value as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim() : "";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  sendNewsletterAlert(email).catch((error) => {
    console.error("[Telegram Newsletter Alert] Failed to dispatch alert:", error);
  });

  return Response.json({ ok: true, message: "Thank you for subscribing!" });
}

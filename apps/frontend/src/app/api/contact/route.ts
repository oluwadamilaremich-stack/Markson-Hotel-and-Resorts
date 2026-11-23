import { sendContactAlert } from "@/lib/server/telegram";
import { readJsonBody } from "@/lib/server/request";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const data = body.value as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const subject = typeof data.subject === "string" ? data.subject.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (!name || name.length > 100) {
    return Response.json({ error: "Please enter your name (max 100 characters)." }, { status: 400 });
  }

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!subject || subject.length > 100) {
    return Response.json({ error: "Please select an inquiry topic." }, { status: 400 });
  }

  if (!message || message.length > 3000) {
    return Response.json({ error: "Please enter a message (max 3,000 characters)." }, { status: 400 });
  }

  // Send real-time alert to Telegram
  sendContactAlert({ name, email, subject, message }).catch((error) => {
    console.error("[Telegram Contact Alert] Failed to dispatch alert:", error);
  });

  return Response.json({ ok: true, message: "Thank you, your message has been sent." });
}

import https from "node:https";
import { formatNaira } from "../format";
import { site } from "../site";

export function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim() || "";
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "oluwadamilaremich@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || site.name;

  return {
    apiKey,
    senderEmail,
    senderName,
    isConfigured: Boolean(apiKey && senderEmail),
  };
}

export type BookingEmailPayload = {
  reference: string;
  roomName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guests: number;
  amountKobo: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
};

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDateDisplay(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return isoDate;
  }
}

// Base64 encoded M logo (3.3 KB) for embedded CID attachment in emails
const LOGO_M_BASE64 =
  "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";

function getLogoBuffer(): { name: string; content: string } {
  return {
    name: "logo-m.png",
    content: LOGO_M_BASE64,
  };
}

/**
 * Builds a luxury brand-aligned HTML booking folio that perfectly mirrors
 * Markson's website palette (Sand #F9F6F3, Ink #1F3A40, Tan #A1826A, Line #D1DFE0).
 */
function buildWebsiteAlignedHtml(booking: BookingEmailPayload): string {
  const amountNaira = formatNaira(booking.amountKobo / 100);
  const guestName = escapeHtml(booking.guestName || "Valued Guest");
  const roomName = escapeHtml(booking.roomName);
  const checkInFormatted = formatDateDisplay(booking.checkIn);
  const checkOutFormatted = formatDateDisplay(booking.checkOut);
  const appUrl = process.env.APP_URL || "https://marksonhotel.com";

  const conciergeWa =
    "https://wa.me/2348121141582?text=" +
    encodeURIComponent(
      `Hello Markson Concierge, I have an inquiry regarding my booking ${booking.reference} (${booking.roomName}).`,
    );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Reservation at Markson Hotels & Resorts</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F3A40; -webkit-font-smoothing: antialiased;">

  <!-- Outer Canvas (Sand background matching website) -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F6F3; padding: 40px 15px;">
    <tr>
      <td align="center">

        <!-- Main Card Container (Pure White on Sand with sharp lines) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D1DFE0; border-radius: 0; box-shadow: 0 10px 40px rgba(31,58,64,0.06);">

          <!-- Top Accent Line (Ink #1F3A40) -->
          <tr>
            <td style="height: 4px; background-color: #1F3A40; line-height: 4px; font-size: 1px;">&nbsp;</td>
          </tr>

          <!-- Header with the 'M' Logo Emblem -->
          <tr>
            <td style="padding: 45px 35px 25px 35px; text-align: center; border-bottom: 1px solid #D1DFE0;">

              <!-- M Emblem Image (Clean contrast on pure white) -->
              <div style="margin-bottom: 18px;">
                <img src="cid:logo-m.png" alt="Markson M Emblem" width="62" height="68" style="display: inline-block; border: 0;" />
              </div>

              <p style="margin: 0 0 6px 0; font-size: 10px; letter-spacing: 0.28em; color: #A1826A; text-transform: uppercase; font-weight: 600;">
                COASTAL LUXURY · LAGOS, NIGERIA
              </p>

              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; letter-spacing: 0.08em; color: #1F3A40; text-transform: uppercase;">
                MARKSON
              </h1>

              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 0.2em; color: #4B6166; text-transform: uppercase;">
                HOTELS &amp; RESORTS
              </p>

            </td>
          </tr>

          <!-- Greeting & Headline -->
          <tr>
            <td style="padding: 35px 35px 20px 35px; text-align: left;">
              <p style="margin: 0 0 10px 0; font-size: 10px; letter-spacing: 0.2em; color: #A1826A; text-transform: uppercase; font-weight: 600;">
                CONFIRMED RESERVATION
              </p>
              <h2 style="margin: 0 0 14px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #1F3A40; line-height: 1.3;">
                Your Oceanfront Stay is Confirmed
              </h2>
              <p style="margin: 0; font-size: 14px; color: #4B6166; line-height: 1.7;">
                Dear <strong>${guestName}</strong>, thank you for choosing Markson Hotels &amp; Resorts. We have reserved your suite and look forward to welcoming you to our shores.
              </p>
            </td>
          </tr>

          <!-- Reservation Folio Card (Sand fill inside White Card) -->
          <tr>
            <td style="padding: 0 35px 30px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F6F3; border: 1px solid #D1DFE0;">

                <!-- Room Title & Status Header -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #D1DFE0; background-color: #F1ECE6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 2px 0; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: #A1826A; font-weight: 600;">ACCOMMODATION</p>
                          <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 19px; font-weight: 600; color: #1F3A40;">${roomName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Check-in & Check-out Dates Grid -->
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>

                        <!-- Check In -->
                        <td width="48%" style="vertical-align: top;">
                          <p style="margin: 0 0 4px 0; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #A1826A; font-weight: 600;">CHECK-IN</p>
                          <p style="margin: 0 0 3px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 600; color: #1F3A40;">
                            ${checkInFormatted}
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #4B6166;">
                            From 2:00 PM (14:00)
                          </p>
                        </td>

                        <!-- Vertical Border Divider -->
                        <td width="4%" align="center" style="vertical-align: middle; color: #D1DFE0; font-size: 16px;">
                          |
                        </td>

                        <!-- Check Out -->
                        <td width="48%" style="vertical-align: top; padding-left: 10px;">
                          <p style="margin: 0 0 4px 0; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #A1826A; font-weight: 600;">CHECK-OUT</p>
                          <p style="margin: 0 0 3px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 600; color: #1F3A40;">
                            ${checkOutFormatted}
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #4B6166;">
                            By 11:00 AM (11:00)
                          </p>
                        </td>

                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Stay Details Summary -->
                <tr>
                  <td style="padding: 16px 24px; background-color: #FFFFFF; border-top: 1px solid #D1DFE0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="33%">
                          <p style="margin: 0; font-size: 9px; letter-spacing: 0.1em; color: #A1826A; text-transform: uppercase;">DURATION</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: 600; color: #1F3A40;">${booking.nights} Night${booking.nights > 1 ? "s" : ""}</p>
                        </td>
                        <td width="33%">
                          <p style="margin: 0; font-size: 9px; letter-spacing: 0.1em; color: #A1826A; text-transform: uppercase;">GUESTS</p>
                          <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: 600; color: #1F3A40;">${booking.guests} Guest${booking.guests > 1 ? "s" : ""}</p>
                        </td>
                        <td width="34%" align="right">
                          <p style="margin: 0; font-size: 9px; letter-spacing: 0.1em; color: #A1826A; text-transform: uppercase;">TOTAL PAID</p>
                          <p style="margin: 3px 0 0 0; font-size: 16px; font-weight: 700; color: #1F3A40;">${amountNaira}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Booking Code -->
                <tr>
                  <td style="padding: 12px 24px; background-color: #F1ECE6; border-top: 1px solid #D1DFE0; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #4B6166;">
                      Booking Reference: <strong style="font-family: 'Courier New', monospace; font-size: 12px; color: #1F3A40; letter-spacing: 0.05em;">${booking.reference}</strong>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Inclusions / Stay Details -->
          <tr>
            <td style="padding: 0 35px 25px 35px;">
              <h3 style="margin: 0 0 12px 0; font-size: 10px; letter-spacing: 0.2em; color: #A1826A; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #D1DFE0; padding-bottom: 6px;">
                YOUR STAY INCLUDES
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #4B6166; line-height: 1.6;">
                    • <strong>Complimentary Breakfast:</strong> Served daily at Shoreline Restaurant from 7:00 AM to 10:30 AM.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #4B6166; line-height: 1.6;">
                    • <strong>Beach &amp; Cabana Access:</strong> Reserved private sun loungers and towel service.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #4B6166; line-height: 1.6;">
                    • <strong>The Tide Pool Spa:</strong> Priority booking for therapeutic wellness treatments and sunrise yoga.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #4B6166; line-height: 1.6;">
                    • <strong>Location:</strong> ${site.address}.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Primary CTA Button (Exact website CTA: bg-ink #1F3A40, text-sand #F9F6F3) -->
          <tr>
            <td style="padding: 10px 35px 35px 35px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <a href="${appUrl}/rooms" target="_blank" style="display: inline-block; background-color: #1F3A40; color: #F9F6F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 15px 34px; text-decoration: none; border-radius: 0;">
                      EXPLORE RESORT &amp; EXPERIENCES
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${conciergeWa}" target="_blank" style="display: inline-block; font-size: 12px; color: #0F677D; text-decoration: underline; font-weight: 500;">
                      Chat with Front Desk on WhatsApp (24/7 Concierge)
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer (Sand background matching website footer) -->
          <tr>
            <td style="background-color: #F9F6F3; border-top: 1px solid #D1DFE0; padding: 25px 35px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-weight: 600; color: #1F3A40;">
                MARKSON HOTELS &amp; RESORTS
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #4B6166; line-height: 1.5;">
                ${site.address} · Lagos, Nigeria<br>
                Reservations: <a href="tel:+2348121141582" style="color: #1F3A40; text-decoration: none;">(234) 812-114-1582</a> ·
                Email: <a href="mailto:oluwadamilaremich@gmail.com" style="color: #1F3A40; text-decoration: none;">oluwadamilaremich@gmail.com</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #A1826A;">
                © 2026 Markson Hotels &amp; Resorts. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * Sends a transactional booking confirmation email via Brevo REST API with embedded logo.
 */
export async function sendBookingConfirmationEmail(
  booking: BookingEmailPayload,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const { apiKey, senderEmail, senderName, isConfigured } = getBrevoConfig();

  if (!isConfigured) {
    console.warn("[Brevo] Email not sent: BREVO_API_KEY or BREVO_SENDER_EMAIL is not configured.");
    return { ok: false, error: "Brevo credentials not configured." };
  }

  if (!booking.guestEmail || !booking.guestEmail.includes("@")) {
    console.warn(`[Brevo] Skipped email: Invalid recipient email (${booking.guestEmail})`);
    return { ok: false, error: "Invalid guest email." };
  }

  const logoAttachment = getLogoBuffer();

  const payload: Record<string, unknown> = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: booking.guestEmail.trim(),
        name: booking.guestName?.trim() || "Guest",
      },
    ],
    subject: `Reservation Confirmed: Your Stay at Markson Hotels & Resorts (${booking.reference})`,
    htmlContent: buildWebsiteAlignedHtml(booking),
  };

  if (logoAttachment) {
    payload.attachment = [logoAttachment];
  }

  const postData = JSON.stringify(payload);

  return new Promise((resolve) => {
    const req = https.request(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": apiKey,
          "Content-Length": Buffer.byteLength(postData),
        },
        family: 4,
        timeout: 15000,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              console.log("[Brevo] Booking confirmation email dispatched successfully. Message ID:", data.messageId);
              resolve({ ok: true, messageId: data.messageId });
            } else {
              console.error("[Brevo] Error dispatching email:", data);
              resolve({ ok: false, error: data.message || "Failed to send email via Brevo." });
            }
          } catch {
            resolve({ ok: false, error: "Invalid JSON response from Brevo." });
          }
        });
      },
    );

    req.on("error", (err) => {
      console.error("[Brevo] Network error dispatching email:", err.message);
      resolve({ ok: false, error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "Timeout contacting Brevo API." });
    });

    req.write(postData);
    req.end();
  });
}

import type { VerifiedBooking } from "./paystack";
import { sendBookingConfirmationEmail } from "./brevo";
import { sendBookingAlert } from "./telegram";
import {
  claimBookingNotification,
  markBookingNotificationSent,
  releaseBookingNotificationClaim,
} from "./store";

async function finalizeNotification(
  reference: string,
  channel: "telegram" | "email",
  delivered: boolean,
): Promise<void> {
  try {
    if (delivered) {
      await markBookingNotificationSent(reference, channel);
    } else {
      await releaseBookingNotificationClaim(reference, channel);
    }
  } catch (error) {
    console.error(`[${channel === "telegram" ? "Telegram Alert" : "Brevo"}] Could not update delivery status.`, {
      reference,
      error,
    });
  }
}

export async function dispatchBookingNotifications(
  booking: VerifiedBooking,
  roomName: string,
): Promise<void> {
  const alert = {
    reference: booking.reference,
    roomName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    guests: booking.guests,
    amountKobo: booking.amountKobo,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestEmail: booking.guestEmail,
  };
  const [telegramClaim, emailClaim] = await Promise.allSettled([
    claimBookingNotification(booking.reference, "telegram"),
    booking.guestEmail
      ? claimBookingNotification(booking.reference, "email")
      : Promise.resolve(false),
  ]);

  const telegramClaimed = telegramClaim.status === "fulfilled" && telegramClaim.value;
  const emailClaimed = emailClaim.status === "fulfilled" && emailClaim.value;
  if (telegramClaim.status === "rejected") {
    console.error("[Telegram Alert] Could not claim booking notification delivery.", {
      reference: booking.reference,
      error: telegramClaim.reason,
    });
  }
  if (emailClaim.status === "rejected") {
    console.error("[Brevo] Could not claim booking email delivery.", {
      reference: booking.reference,
      error: emailClaim.reason,
    });
  }

  const [telegramResult, emailResult] = await Promise.allSettled([
    telegramClaimed ? sendBookingAlert(alert) : Promise.resolve(null),
    emailClaimed
      ? sendBookingConfirmationEmail({
          ...alert,
          guestName: booking.guestName || "Guest",
          guestEmail: booking.guestEmail || "",
        })
      : Promise.resolve(null),
  ]);

  if (telegramClaimed && telegramResult.status === "rejected") {
    console.error("[Telegram Alert] Failed to dispatch booking alert.", {
      reference: booking.reference,
      error: telegramResult.reason,
    });
    await finalizeNotification(booking.reference, "telegram", false);
  } else if (telegramClaimed && telegramResult.status === "fulfilled" && telegramResult.value && !telegramResult.value.ok) {
    console.error("[Telegram Alert] Booking alert was rejected.", {
      reference: booking.reference,
      error: telegramResult.value.description,
    });
    await finalizeNotification(booking.reference, "telegram", false);
  } else if (telegramClaimed && telegramResult.status === "fulfilled" && telegramResult.value?.ok) {
    await finalizeNotification(booking.reference, "telegram", true);
  }

  if (emailClaimed && emailResult.status === "rejected") {
    console.error("[Brevo] Failed to dispatch guest confirmation email.", {
      reference: booking.reference,
      error: emailResult.reason,
    });
    await finalizeNotification(booking.reference, "email", false);
  } else if (emailClaimed && emailResult.status === "fulfilled" && emailResult.value && !emailResult.value.ok) {
    console.error("[Brevo] Guest confirmation email was not sent.", {
      reference: booking.reference,
      error: emailResult.value.error,
    });
    await finalizeNotification(booking.reference, "email", false);
  } else if (emailClaimed && emailResult.status === "fulfilled" && emailResult.value?.ok) {
    await finalizeNotification(booking.reference, "email", true);
  } else if (!booking.guestEmail) {
    console.warn("[Brevo] Guest confirmation email skipped: booking has no guest email.", {
      reference: booking.reference,
    });
  }
}

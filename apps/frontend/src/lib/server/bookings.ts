import { randomUUID } from "node:crypto";
import { getRoom } from "@/lib/data";
import { getNights, isDateOnly } from "@/lib/booking-rules";
import { checkRoomAvailability, recordBooking } from "./store";
import { readJsonBody } from "./request";
import { initializePaystackTransaction, verifyPaystackBooking } from "./paystack";
import { sendBookingAlert } from "./telegram";
import { sendBookingConfirmationEmail } from "./brevo";

type BookingRequest = {
  roomSlug?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
  guests?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function initializeBooking(request: Request): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  if (!isRecord(body.value)) {
    return Response.json({ error: "Please submit valid booking details." }, { status: 400 });
  }

  const input = body.value as BookingRequest;
  const roomSlug = typeof input.roomSlug === "string" ? input.roomSlug : "";
  const { checkIn, checkOut, guests } = input;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());

  if (!name || name.length > 100) {
    return Response.json({ error: "Enter a name of 1 to 100 characters." }, { status: 400 });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!phone || phone.length > 30) {
    return Response.json({ error: "Enter a valid phone number." }, { status: 400 });
  }
  if (!isDateOnly(checkIn) || !isDateOnly(checkOut) || checkIn < today) {
    return Response.json({ error: "Choose valid check-in and check-out dates." }, { status: 400 });
  }

  const nights = getNights(checkIn, checkOut);
  if (nights < 1) {
    return Response.json(
      { error: "Check-out must be at least one night after check-in." },
      { status: 400 },
    );
  }

  const room = await getRoom(roomSlug);
  if (!room) {
    return Response.json({ error: "Choose one of the available rooms." }, { status: 400 });
  }
  if (typeof guests !== "number" || !Number.isInteger(guests) || guests < 1 || guests > room.maxGuests) {
    return Response.json({ error: `This room allows 1 to ${room.maxGuests} guests.` }, { status: 400 });
  }

  // -----------------------------------------------------------------
  // CALENDAR COLLISION CHECK: Prevent double-booking this room
  // -----------------------------------------------------------------
  const availability = checkRoomAvailability(roomSlug, checkIn, checkOut);
  if (!availability.available) {
    const conflict = availability.conflictingBooking;
    const msg = conflict
      ? `Sorry, ${room.name} is already reserved from ${conflict.checkIn} to ${conflict.actualCheckOut ?? conflict.checkOut}. Please choose alternative dates or another luxury suite.`
      : `Sorry, this suite is not available for the selected dates. Please choose different dates.`;
    return Response.json({ error: msg }, { status: 409 });
  }

  const amountKobo = room.pricePerNight * nights * 100;
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 1) {
    return Response.json({ error: "The booking total is invalid." }, { status: 400 });
  }

  const reference = `markson_${randomUUID().replaceAll("-", "")}`;
  let callbackUrl: string;
  try {
    callbackUrl = new URL("/book/confirmation", process.env.APP_URL ?? "http://localhost:3000").toString();
  } catch {
    console.error("APP_URL must be a valid absolute URL.");
    return Response.json(
      { error: "The booking service is not configured correctly." },
      { status: 500 },
    );
  }

  const checkout = await initializePaystackTransaction({
    reference,
    email,
    amountKobo,
    callbackUrl,
    metadata: {
      booking: { roomSlug, roomName: room.name, checkIn, checkOut, guests, nights },
      customer: { name, phone },
    },
  });
  if (!checkout.ok) {
    return Response.json({ error: checkout.message }, { status: checkout.statusCode });
  }
  return Response.json({ authorizationUrl: checkout.authorizationUrl });
}

export async function verifyBooking(reference: string): Promise<Response> {
  if (!/^markson_[a-f0-9]{32}$/.test(reference)) {
    return Response.json({ error: "Invalid booking reference." }, { status: 400 });
  }

  const result = await verifyPaystackBooking(reference);
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: result.statusCode });
  }

  const room = await getRoom(result.booking.roomSlug);
  const roomName = room?.name ?? result.booking.roomSlug;

  // Persist confirmed booking into data store to lock the calendar dates
  const isNewBooking = recordBooking({
    reference: result.booking.reference,
    roomSlug: result.booking.roomSlug,
    roomName,
    checkIn: result.booking.checkIn,
    checkOut: result.booking.checkOut,
    nights: result.booking.nights,
    guests: result.booking.guests,
    amountKobo: result.booking.amountKobo,
    guestName: result.booking.guestName || "Guest",
    guestEmail: result.booking.guestEmail || "",
    guestPhone: result.booking.guestPhone || "",
    createdAt: new Date().toISOString(),
    status: "confirmed",
  });

  if (isNewBooking) {
    // Trigger real-time Telegram notification to hotel staff
    sendBookingAlert({
      reference: result.booking.reference,
      roomName,
      checkIn: result.booking.checkIn,
      checkOut: result.booking.checkOut,
      nights: result.booking.nights,
      guests: result.booking.guests,
      amountKobo: result.booking.amountKobo,
      guestName: result.booking.guestName,
      guestPhone: result.booking.guestPhone,
      guestEmail: result.booking.guestEmail,
    }).catch((error) => console.error("[Telegram Alert] Failed to dispatch booking alert:", error));

    // Trigger luxury branded booking confirmation email to guest via Brevo
    if (result.booking.guestEmail) {
      sendBookingConfirmationEmail({
        reference: result.booking.reference,
        roomName,
        checkIn: result.booking.checkIn,
        checkOut: result.booking.checkOut,
        nights: result.booking.nights,
        guests: result.booking.guests,
        amountKobo: result.booking.amountKobo,
        guestName: result.booking.guestName || "Guest",
        guestEmail: result.booking.guestEmail,
        guestPhone: result.booking.guestPhone,
      }).catch((error) => console.error("[Brevo] Failed to dispatch guest confirmation email:", error));
    }
  }

  return Response.json({ verified: true, booking: result.booking });
}

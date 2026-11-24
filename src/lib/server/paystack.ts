import { getStoredRooms } from "./store";
import { isDateOnly, validateBookingPayment } from "@/lib/booking-rules";

type PaystackResponse<T> = {
  status?: boolean;
  message?: string;
  data?: T;
};

type InitializedTransaction = {
  authorization_url?: unknown;
  reference?: unknown;
};

type VerifiedTransaction = {
  status?: unknown;
  amount?: unknown;
  currency?: unknown;
  reference?: unknown;
  metadata?: unknown;
  customer?: unknown;
};

export type VerifiedBooking = {
  reference: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  amountKobo: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
};

export function getPaystackTestSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  return secret?.startsWith("sk_test_") ? secret : null;
}

export async function initializePaystackTransaction(payload: {
  reference: string;
  email: string;
  amountKobo: number;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const secret = getPaystackTestSecret();
  if (!secret) {
    return { ok: false as const, statusCode: 503, message: "Demo checkout requires a Paystack test secret key." };
  }

  let response: Response;
  try {
    response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: payload.reference,
        email: payload.email,
        amount: payload.amountKobo,
        currency: "NGN",
        callback_url: payload.callbackUrl,
        metadata: payload.metadata,
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false as const, statusCode: 502, message: "Could not connect to Paystack. Please try again." };
  }

  let result: PaystackResponse<InitializedTransaction>;
  try {
    result = (await response.json()) as PaystackResponse<InitializedTransaction>;
  } catch {
    return { ok: false as const, statusCode: 502, message: "Paystack returned an unreadable response." };
  }

  const authorizationUrl = result.data?.authorization_url;
  if (
    !response.ok ||
    result.status !== true ||
    typeof authorizationUrl !== "string" ||
    typeof result.data?.reference !== "string" ||
    result.data.reference !== payload.reference
  ) {
    return {
      ok: false as const,
      statusCode: 502,
      message: typeof result.message === "string" ? result.message : "Paystack could not start checkout.",
    };
  }

  let checkoutUrl: URL;
  try {
    checkoutUrl = new URL(authorizationUrl);
  } catch {
    return { ok: false as const, statusCode: 502, message: "Paystack returned an invalid checkout link." };
  }

  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paystack.com") {
    return { ok: false as const, statusCode: 502, message: "Paystack returned an untrusted checkout link." };
  }

  return { ok: true as const, authorizationUrl };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function verifyPaystackBooking(
  reference: string,
  loadRooms: typeof getStoredRooms = getStoredRooms,
) {
  const secret = getPaystackTestSecret();
  if (!secret) {
    return { ok: false as const, statusCode: 503, message: "Paystack test mode is not configured." };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
    );
  } catch {
    return { ok: false as const, statusCode: 502, message: "Could not verify with Paystack. Please try again." };
  }

  let result: PaystackResponse<VerifiedTransaction>;
  try {
    result = (await response.json()) as PaystackResponse<VerifiedTransaction>;
  } catch {
    return { ok: false as const, statusCode: 502, message: "Paystack returned an unreadable response." };
  }

  const transaction = result.data;
  if (
    !response.ok ||
    result.status !== true ||
    !transaction ||
    typeof transaction.status !== "string" ||
    typeof transaction.amount !== "number" ||
    transaction.currency !== "NGN" ||
    transaction.reference !== reference
  ) {
    return {
      ok: false as const,
      statusCode: 404,
      message: typeof result.message === "string" ? result.message : "Paystack could not find this transaction.",
    };
  }

  if (transaction.status !== "success") {
    return { ok: false as const, statusCode: 402, message: "The Paystack test payment was not completed." };
  }

  if (!isRecord(transaction.metadata) || !isRecord(transaction.metadata.booking)) {
    return { ok: false as const, statusCode: 422, message: "This transaction has no valid booking details." };
  }

  const metadata = transaction.metadata.booking;
  const roomSlug = metadata.roomSlug;
  const checkIn = metadata.checkIn;
  const checkOut = metadata.checkOut;
  const guests = metadata.guests;
  const nights = metadata.nights;
  if (
    typeof roomSlug !== "string" ||
    !isDateOnly(checkIn) ||
    !isDateOnly(checkOut) ||
    typeof guests !== "number" ||
    !Number.isInteger(guests) ||
    typeof nights !== "number" ||
    !Number.isInteger(nights) ||
    nights < 1
  ) {
    return { ok: false as const, statusCode: 422, message: "This transaction has invalid booking details." };
  }

  const room = (await loadRooms()).find((storedRoom) => storedRoom.slug === roomSlug) ?? null;
  const validation = validateBookingPayment({ checkIn, checkOut, guests, nights }, transaction.amount, room);
  if (!validation.ok) {
    return { ok: false as const, statusCode: 422, message: "Payment details do not match this booking." };
  }
  const { amountKobo } = validation;

  const customerMeta = isRecord(transaction.metadata.customer) ? transaction.metadata.customer : {};
  const guestName = typeof customerMeta.name === "string" ? customerMeta.name : undefined;
  const guestPhone = typeof customerMeta.phone === "string" ? customerMeta.phone : undefined;
  const customerObj = isRecord(transaction.customer) ? transaction.customer : {};
  const guestEmail = typeof customerObj.email === "string" ? customerObj.email : undefined;

  const booking: VerifiedBooking = {
    reference,
    roomSlug,
    checkIn,
    checkOut,
    guests,
    nights,
    amountKobo,
    guestName,
    guestEmail,
    guestPhone,
  };
  return { ok: true as const, booking };
}

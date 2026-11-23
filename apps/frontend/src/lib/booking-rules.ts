export type AvailabilityBooking = {
  reference?: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  actualCheckOut?: string;
  status: string;
};

export type BookingPaymentMetadata = {
  checkIn: unknown;
  checkOut: unknown;
  guests: unknown;
  nights: unknown;
};

export type BookingPaymentValidation =
  | { ok: true; computedNights: number; amountKobo: number }
  | { ok: false; reason: "invalid_booking" | "mismatch" };

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function getNights(checkIn: string, checkOut: string) {
  return Math.round(
    (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86_400_000,
  );
}

export function datesOverlap(in1: string, out1: string, in2: string, out2: string): boolean {
  return in1 < out2 && out1 > in2;
}

export function findRoomAvailabilityConflict<T extends AvailabilityBooking>(
  bookings: readonly T[],
  roomSlug: string,
  checkIn: string,
  checkOut: string,
  excludeReference?: string,
): T | undefined {
  return bookings.find((booking) => {
    if (booking.status === "cancelled") return false;
    if (excludeReference && booking.reference === excludeReference) return false;
    if (booking.roomSlug !== roomSlug) return false;

    return datesOverlap(
      checkIn,
      checkOut,
      booking.checkIn,
      booking.actualCheckOut ?? booking.checkOut,
    );
  });
}

export function validateBookingPayment(
  metadata: BookingPaymentMetadata,
  transactionAmount: number,
  room: { pricePerNight: number; maxGuests: number } | null,
): BookingPaymentValidation {
  const { checkIn, checkOut, guests, nights } = metadata;
  if (
    !isDateOnly(checkIn) ||
    !isDateOnly(checkOut) ||
    typeof guests !== "number" ||
    !Number.isInteger(guests) ||
    typeof nights !== "number" ||
    !Number.isInteger(nights) ||
    nights < 1
  ) {
    return { ok: false, reason: "invalid_booking" };
  }

  const computedNights = getNights(checkIn, checkOut);
  const amountKobo = room ? room.pricePerNight * computedNights * 100 : 0;
  if (
    !room ||
    checkOut <= checkIn ||
    guests < 1 ||
    guests > room.maxGuests ||
    computedNights !== nights ||
    !Number.isSafeInteger(amountKobo) ||
    transactionAmount !== amountKobo
  ) {
    return { ok: false, reason: "mismatch" };
  }

  return { ok: true, computedNights, amountKobo };
}

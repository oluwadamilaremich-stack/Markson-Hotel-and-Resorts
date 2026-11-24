import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  datesOverlap,
  findRoomAvailabilityConflict,
  getNights,
  isDateOnly,
  validateBookingPayment,
  type AvailabilityBooking,
} from "../src/lib/booking-rules";

describe("booking date and availability rules", () => {
  it("allows a new stay to begin on the previous guest's checkout date", () => {
    assert.equal(datesOverlap("2026-12-23", "2026-12-26", "2026-12-20", "2026-12-23"), false);
  });

  it("detects overlapping stays but ignores cancelled and other-room bookings", () => {
    const bookings: AvailabilityBooking[] = [
      {
        reference: "cancelled",
        roomSlug: "garden-suite",
        checkIn: "2026-12-20",
        checkOut: "2026-12-25",
        status: "cancelled",
      },
      {
        reference: "other-room",
        roomSlug: "ocean-suite",
        checkIn: "2026-12-20",
        checkOut: "2026-12-25",
        status: "confirmed",
      },
      {
        reference: "active",
        roomSlug: "garden-suite",
        checkIn: "2026-12-20",
        checkOut: "2026-12-25",
        status: "confirmed",
      },
    ];

    assert.equal(
      findRoomAvailabilityConflict(bookings, "garden-suite", "2026-12-24", "2026-12-27")?.reference,
      "active",
    );
    assert.equal(
      findRoomAvailabilityConflict(bookings, "garden-suite", "2026-12-25", "2026-12-27"),
      undefined,
    );
  });

  it("uses an early checkout date as the end of the blocked interval", () => {
    const booking: AvailabilityBooking = {
      reference: "early-checkout",
      roomSlug: "garden-suite",
      checkIn: "2026-12-20",
      checkOut: "2026-12-25",
      actualCheckOut: "2026-12-22",
      status: "confirmed",
    };

    assert.equal(
      findRoomAvailabilityConflict([booking], "garden-suite", "2026-12-22", "2026-12-24"),
      undefined,
    );
    assert.equal(
      findRoomAvailabilityConflict([booking], "garden-suite", "2026-12-21", "2026-12-23"),
      booking,
    );
  });
});

describe("booking payment validation", () => {
  const room = { pricePerNight: 500_000, maxGuests: 3 };
  const metadata = {
    checkIn: "2026-12-20",
    checkOut: "2026-12-22",
    guests: 2,
    nights: 2,
  };

  it("validates the room, dates, guest count, nights, and exact Paystack amount", () => {
    assert.deepEqual(validateBookingPayment(metadata, 100_000_000, room), {
      ok: true,
      computedNights: 2,
      amountKobo: 100_000_000,
    });
  });

  it("rejects a transaction amount that differs from the calculated booking total", () => {
    assert.deepEqual(validateBookingPayment(metadata, 100_000_001, room), {
      ok: false,
      reason: "mismatch",
    });
  });

  it("rejects invalid dates, inconsistent nights, and guests above the room limit", () => {
    assert.deepEqual(
      validateBookingPayment({ ...metadata, checkIn: "2026-02-30" }, 100_000_000, room),
      { ok: false, reason: "invalid_booking" },
    );
    assert.deepEqual(validateBookingPayment({ ...metadata, nights: 3 }, 100_000_000, room), {
      ok: false,
      reason: "mismatch",
    });
    assert.deepEqual(validateBookingPayment({ ...metadata, guests: 4 }, 100_000_000, room), {
      ok: false,
      reason: "mismatch",
    });
  });

  it("validates calendar dates and calculates nights using UTC day boundaries", () => {
    assert.equal(isDateOnly("2028-02-29"), true);
    assert.equal(isDateOnly("2027-02-29"), false);
    assert.equal(getNights("2026-12-20", "2026-12-22"), 2);
  });
});

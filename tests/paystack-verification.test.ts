import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { rooms } from "../src/content/rooms";
import { verifyPaystackBooking } from "../src/lib/server/paystack";

const reference = "markson_0123456789abcdef0123456789abcdef";
const originalFetch = globalThis.fetch;
const originalSecret = process.env.PAYSTACK_SECRET_KEY;
const room = rooms[0];
if (!room) throw new Error("The room catalog must contain at least one room for Paystack tests.");

function verifyBooking() {
  return verifyPaystackBooking(reference, async () => [room]);
}

function createTransaction(overrides: Record<string, unknown> = {}) {
  const checkIn = "2026-12-20";
  const checkOut = "2026-12-22";
  const guests = 1;
  const nights = 2;

  return {
    status: "success",
    amount: room.pricePerNight * nights * 100,
    currency: "NGN",
    reference,
    metadata: {
      booking: { roomSlug: room.slug, checkIn, checkOut, guests, nights },
      customer: { name: "Test Guest", phone: "08000000000" },
    },
    customer: { email: "guest@example.com" },
    ...overrides,
  };
}

function mockPaystackResponse(transaction: Record<string, unknown>) {
  globalThis.fetch = async (_input, init) => {
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer sk_test_automated-test-key");
    return new Response(JSON.stringify({ status: true, data: transaction }), { status: 200 });
  };
}

beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_automated-test-key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) {
    delete process.env.PAYSTACK_SECRET_KEY;
  } else {
    process.env.PAYSTACK_SECRET_KEY = originalSecret;
  }
});

describe("Paystack booking verification", () => {
  it("accepts a successful NGN payment matching the stored room price and booking", async () => {
    mockPaystackResponse(createTransaction());

    const result = await verifyBooking();

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.booking.reference, reference);
      assert.equal(result.booking.roomSlug, room.slug);
      assert.equal(result.booking.amountKobo, room.pricePerNight * 2 * 100);
      assert.equal(result.booking.guestEmail, "guest@example.com");
    }
  });

  it("rejects unsuccessful Paystack transactions", async () => {
    mockPaystackResponse(createTransaction({ status: "failed" }));

    const result = await verifyBooking();

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.message, "The Paystack test payment was not completed.");
  });

  it("rejects mismatched payment amounts", async () => {
    mockPaystackResponse(createTransaction({ amount: room.pricePerNight * 2 * 100 + 1 }));

    const result = await verifyBooking();

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.message, "Payment details do not match this booking.");
  });

  it("rejects transactions with the wrong currency or reference", async () => {
    mockPaystackResponse(createTransaction({ currency: "USD" }));
    const wrongCurrency = await verifyBooking();
    assert.equal(wrongCurrency.ok, false);

    mockPaystackResponse(createTransaction({ reference: "some-other-reference" }));
    const wrongReference = await verifyBooking();
    assert.equal(wrongReference.ok, false);
  });
});

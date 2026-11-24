import assert from "node:assert/strict";
import { it } from "node:test";
import { getBookingCallbackUrl } from "../src/lib/server/bookings";

it("returns Paystack to the host that started the booking", () => {
  const originalAppUrl = process.env.APP_URL;
  process.env.APP_URL = "http://localhost:3000";

  try {
    assert.equal(
      getBookingCallbackUrl(
        "https://marksonhotelandresorts.vercel.app/api/bookings/initialize",
      ),
      "https://marksonhotelandresorts.vercel.app/book/confirmation",
    );
  } finally {
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
  }
});

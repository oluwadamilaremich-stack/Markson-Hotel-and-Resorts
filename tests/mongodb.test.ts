import assert from "node:assert/strict";
import { it } from "node:test";
import { NextRequest } from "next/server";
import { GET as getAvailability } from "../src/app/api/bookings/availability/route";
import { getMongoDb } from "../src/lib/server/mongodb";

function withoutMongoUri<T>(operation: () => Promise<T>) {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  return operation().finally(() => {
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  });
}

it("reports missing MongoDB configuration without attempting a connection", async () => {
  await assert.rejects(withoutMongoUri(getMongoDb), /MONGODB_URI is not configured/);
});

it("returns an explicit service-unavailable response when MongoDB is not configured", async () => {
  const response = await withoutMongoUri(() =>
    getAvailability(
      new NextRequest("https://markson.test/api/bookings/availability?roomSlug=ocean-view-king-suite"),
    ),
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Booking availability is temporarily unavailable.",
  });
});

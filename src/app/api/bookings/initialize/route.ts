import { initializeBooking } from "@/lib/server/bookings";

export async function POST(request: Request) {
  return initializeBooking(request);
}

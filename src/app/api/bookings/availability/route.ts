import { NextRequest, NextResponse } from "next/server";
import { getBookedRangesForRoom, checkRoomAvailability } from "@/lib/server/store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomSlug = searchParams.get("roomSlug");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!roomSlug) {
    return NextResponse.json({ error: "roomSlug is required." }, { status: 400 });
  }

  // If specific dates are requested, check availability
  if (checkIn && checkOut) {
    const result = checkRoomAvailability(roomSlug, checkIn, checkOut);
    return NextResponse.json({
      roomSlug,
      checkIn,
      checkOut,
      available: result.available,
      conflictingDates: result.conflictingBooking
        ? {
            checkIn: result.conflictingBooking.checkIn,
            checkOut: result.conflictingBooking.checkOut,
            status: result.conflictingBooking.status,
          }
        : null,
    });
  }

  // Otherwise, return all booked date ranges for this room
  const bookedRanges = getBookedRangesForRoom(roomSlug);

  return NextResponse.json({
    roomSlug,
    bookedRanges,
  });
}

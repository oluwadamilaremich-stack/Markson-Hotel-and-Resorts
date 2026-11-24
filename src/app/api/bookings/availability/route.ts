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

  try {
    if (checkIn && checkOut) {
      const result = await checkRoomAvailability(roomSlug, checkIn, checkOut);
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

    const bookedRanges = await getBookedRangesForRoom(roomSlug);
    return NextResponse.json({ roomSlug, bookedRanges });
  } catch (error) {
    console.error("[Booking availability] Could not query MongoDB.", error);
    return NextResponse.json(
      { error: "Booking availability is temporarily unavailable." },
      { status: 503 },
    );
  }
}

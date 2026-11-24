import { verifyBooking } from "@/lib/server/bookings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  return verifyBooking(reference);
}

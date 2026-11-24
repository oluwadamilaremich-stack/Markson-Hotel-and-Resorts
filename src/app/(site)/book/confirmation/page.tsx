import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getRoom } from "@/lib/data";
import { formatNaira } from "@/lib/format";
import { verifyPaystackBooking, type VerifiedBooking } from "@/lib/server/paystack";
import { recordBooking } from "@/lib/server/store";
import { sendBookingAlert } from "@/lib/server/telegram";
import { sendBookingConfirmationEmail } from "@/lib/server/brevo";
import { LinkButton } from "@/components/ui/button";
import { Divider } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Booking Demo Confirmation",
  description: "Confirmation for a Markson Hotels & Resorts Paystack test booking.",
};


async function BookingConfirmationContent({
  searchParams,
}: {
  searchParams: PageProps<"/book/confirmation">["searchParams"];
}) {
  const { reference } = await searchParams;
  const ref = typeof reference === "string" ? reference : "";

  let message = "We could not match this checkout to a booking in this browser. Please start again.";
  let verifiedBooking: VerifiedBooking | null = null;

  if (/^markson_[a-f0-9]{32}$/.test(ref)) {
    const result = await verifyPaystackBooking(ref);
    if (result.ok && result.booking.reference === ref) {
      verifiedBooking = result.booking;
    } else if (!result.ok) {
      message = result.message;
    }
  }

  const room = verifiedBooking ? await getRoom(verifiedBooking.roomSlug) : null;
  if (verifiedBooking && room) {
    try {
      const isNewBooking = await recordBooking({
        reference: verifiedBooking.reference,
        roomSlug: verifiedBooking.roomSlug,
        roomName: room.name,
        checkIn: verifiedBooking.checkIn,
        checkOut: verifiedBooking.checkOut,
        nights: verifiedBooking.nights,
        guests: verifiedBooking.guests,
        amountKobo: verifiedBooking.amountKobo,
        guestName: verifiedBooking.guestName || "Guest",
        guestEmail: verifiedBooking.guestEmail || "",
        guestPhone: verifiedBooking.guestPhone || "",
        createdAt: new Date().toISOString(),
        status: "confirmed",
      });

      if (isNewBooking) {
        sendBookingAlert({
          reference: verifiedBooking.reference,
          roomName: room.name,
          checkIn: verifiedBooking.checkIn,
          checkOut: verifiedBooking.checkOut,
          nights: verifiedBooking.nights,
          guests: verifiedBooking.guests,
          amountKobo: verifiedBooking.amountKobo,
          guestName: verifiedBooking.guestName,
          guestPhone: verifiedBooking.guestPhone,
          guestEmail: verifiedBooking.guestEmail,
        }).catch((error) => console.error("[Telegram Alert] Failed to dispatch booking alert:", error));

        if (verifiedBooking.guestEmail) {
          sendBookingConfirmationEmail({
            reference: verifiedBooking.reference,
            roomName: room.name,
            checkIn: verifiedBooking.checkIn,
            checkOut: verifiedBooking.checkOut,
            nights: verifiedBooking.nights,
            guests: verifiedBooking.guests,
            amountKobo: verifiedBooking.amountKobo,
            guestName: verifiedBooking.guestName || "Guest",
            guestEmail: verifiedBooking.guestEmail,
            guestPhone: verifiedBooking.guestPhone,
          }).catch((error) => console.error("[Brevo] Failed to dispatch guest confirmation email:", error));
        }
      }
    } catch (error) {
      console.error("[Booking Confirmation] MongoDB could not save the verified booking.", error);
      message = `Payment was verified, but the booking could not be saved. Contact the hotel with reference ${verifiedBooking.reference}.`;
      verifiedBooking = null;
    }
  }

  return (
    <section className="px-site mx-auto max-w-[760px] pt-36 pb-24 md:pt-[200px] md:pb-32">
      <Divider />
      {verifiedBooking && room ? (
        <div className="py-12 text-center">
          <p className="text-tiny text-tan">TEST PAYMENT VERIFIED</p>
          <h1 className="text-h2 mt-4">Thank you, your checkout is complete.</h1>
          <p className="mx-auto mt-5 max-w-[500px]">
            Paystack verified this test transaction. It did not charge real money or create a real
            hotel reservation.
          </p>
          <dl className="mx-auto mt-10 grid max-w-[440px] gap-4 border-y border-line py-6 text-left sm:grid-cols-2">
            <div>
              <dt className="text-tiny text-tan">Room</dt>
              <dd>{room.name}</dd>
            </div>
            <div>
              <dt className="text-tiny text-tan">Guests</dt>
              <dd>{verifiedBooking.guests}</dd>
            </div>
            <div>
              <dt className="text-tiny text-tan">Check-in</dt>
              <dd>{verifiedBooking.checkIn}</dd>
            </div>
            <div>
              <dt className="text-tiny text-tan">Check-out</dt>
              <dd>{verifiedBooking.checkOut}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-tiny text-tan">Demo total</dt>
              <dd>{formatNaira(verifiedBooking.amountKobo / 100)}</dd>
            </div>
          </dl>
          <div className="mt-10 flex justify-center">
            <LinkButton href="/rooms">Explore Rooms</LinkButton>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-tiny text-tan">BOOKING DEMO</p>
          <h1 className="text-h2 mt-4">Checkout not confirmed</h1>
          <p className="mx-auto mt-5 max-w-[500px]">{message}</p>
          <div className="mt-10 flex justify-center">
            <LinkButton href="/rooms">Return to Rooms</LinkButton>
          </div>
        </div>
      )}
      <Divider />
      <p className="mt-6 text-center text-small">
        Need help? <Link href="/contact" className="underline underline-offset-4">Contact us</Link>.
      </p>
    </section>
  );
}

export default function BookingConfirmationPage(props: PageProps<"/book/confirmation">) {
  return (
    <Suspense fallback={<p className="px-site pt-36 pb-24 text-center md:pt-[200px]">Verifying test payment…</p>}>
      <BookingConfirmationContent searchParams={props.searchParams} />
    </Suspense>
  );
}

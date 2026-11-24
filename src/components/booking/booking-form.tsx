"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { formatNaira } from "@/lib/format";
import { datesOverlap } from "@/lib/booking-rules";
import type { Room } from "@/content/rooms";
import { Button } from "@/components/ui/button";

const field =
  "w-full border border-line bg-transparent px-3 py-2.5 outline-none transition-colors focus:border-ink";

function nextDate(value: string) {
  if (!value) return "";
  return new Date(Date.parse(`${value}T00:00:00.000Z`) + 86_400_000).toISOString().slice(0, 10);
}

type BookedRange = { checkIn: string; checkOut: string };

function isBookedRange(value: unknown): value is BookedRange {
  return (
    typeof value === "object" &&
    value !== null &&
    "checkIn" in value &&
    typeof value.checkIn === "string" &&
    "checkOut" in value &&
    typeof value.checkOut === "string"
  );
}

function parseBookedRanges(value: unknown): BookedRange[] | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("bookedRanges" in value) ||
    !Array.isArray(value.bookedRanges) ||
    !value.bookedRanges.every(isBookedRange)
  ) {
    return null;
  }
  return value.bookedRanges;
}

export function BookingForm({
  rooms,
  initialRoomSlug,
  today,
  layout = "page",
}: {
  rooms: Room[];
  initialRoomSlug?: string;
  today: string;
  layout?: "page" | "drawer";
}) {
  const inDrawer = layout === "drawer";
  const [roomSlug, setRoomSlug] = useState(
    rooms.some((room) => room.slug === initialRoomSlug) ? initialRoomSlug! : rooms[0].slug,
  );
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<{
    roomSlug: string;
    bookedRanges: BookedRange[];
  } | null>(null);

  const room = rooms.find((item) => item.slug === roomSlug) ?? rooms[0];
  const bookedRanges = useMemo(
    () => (availability?.roomSlug === roomSlug ? availability.bookedRanges : []),
    [availability, roomSlug],
  );

  // Fetch booked date ranges whenever the selected room changes
  useEffect(() => {
    let active = true;
    fetch(`/api/bookings/availability?roomSlug=${encodeURIComponent(roomSlug)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Availability request failed with status ${response.status}.`);
        }

        const ranges = parseBookedRanges(await response.json());
        if (!ranges) throw new Error("Availability response did not contain valid date ranges.");

        if (active) {
          setAvailability({ roomSlug, bookedRanges: ranges });
          setError("");
        }
      })
      .catch((availabilityError: unknown) => {
        if (active) {
          console.error("[Booking] Failed to load room availability:", availabilityError);
          setError("Could not check room availability. Please try again before checkout.");
        }
      });

    return () => {
      active = false;
    };
  }, [roomSlug]);

  // Check if current user-selected dates collide with any booked range
  const collision = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return null;
    for (const b of bookedRanges) {
      if (datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)) {
        return b;
      }
    }
    return null;
  }, [checkIn, checkOut, bookedRanges]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round(
      (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86_400_000,
    );
  }, [checkIn, checkOut]);

  const estimatedTotal = room.pricePerNight * nights;

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (collision) {
      setError(
        `This suite is already reserved from ${collision.checkIn} to ${collision.checkOut}. Please choose other dates.`,
      );
      return;
    }

    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/bookings/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomSlug,
          checkIn,
          checkOut,
          guests,
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
        }),
      });

      const result: { authorizationUrl?: string; error?: string } = await response.json();
      if (!response.ok || !result.authorizationUrl) {
        setError(result.error ?? "Could not start checkout. Please try again.");
        setPending(false);
        return;
      }

      window.location.assign(result.authorizationUrl);
    } catch {
      setError("Could not reach the booking service. Check your connection and try again.");
      setPending(false);
    }
  }

  if (!rooms.length) return <p>No rooms are available to book right now.</p>;

  return (
    <form
      onSubmit={submitBooking}
      className={inDrawer ? "flex min-h-0 flex-1 flex-col" : "grid gap-8 md:grid-cols-[1fr_280px]"}
    >
      <div className={inDrawer ? "grid content-start gap-5 overflow-y-auto p-5 md:p-8" : "grid gap-5 sm:grid-cols-2"}>
        {inDrawer ? (
          <div className="flex items-center gap-4 border-b border-line pb-5">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-mist">
              <Image src={room.image} alt="" fill sizes="80px" className="object-cover" />
            </div>
            <div>
              <p className="text-h4">{room.name}</p>
              <p className="mt-1 text-small">{formatNaira(room.pricePerNight)} / night</p>
            </div>
          </div>
        ) : (
          <label className="block sm:col-span-2">
            <span className="mb-2 block">Room</span>
            <select
              name="room"
              value={roomSlug}
              onChange={(event) => {
                const nextRoom = rooms.find((item) => item.slug === event.target.value);
                setRoomSlug(event.target.value);
                if (nextRoom && guests > nextRoom.maxGuests) setGuests(nextRoom.maxGuests);
              }}
              className={field}
            >
              {rooms.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="sm:col-span-2">
          <p className="text-tiny uppercase tracking-[0.14em] text-tan">Choose your dates</p>
          {bookedRanges.length > 0 && (
            <div className="mt-2 text-tiny text-ink/70">
              <span className="font-semibold text-accent">Reserved periods for this suite: </span>
              {bookedRanges.map((b, idx) => (
                <span key={idx} className="mr-2 inline-block rounded bg-mist/60 px-1.5 py-0.5">
                  {b.checkIn} → {b.checkOut}
                </span>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 block">Check-in</span>
          <input
            required
            type="date"
            name="checkIn"
            min={today}
            value={checkIn}
            onChange={(event) => {
              setCheckIn(event.target.value);
              if (checkOut && checkOut <= event.target.value) setCheckOut("");
            }}
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-2 block">Check-out</span>
          <input
            required
            type="date"
            name="checkOut"
            min={checkIn ? nextDate(checkIn) : nextDate(today)}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className={field}
          />
        </label>

        {collision && (
          <div className="sm:col-span-2 rounded border border-accent/40 bg-accent/5 p-3 text-small text-accent">
            ⚠️ <b>Dates unavailable:</b> This suite is already reserved from <b>{collision.checkIn}</b> to{" "}
            <b>{collision.checkOut}</b>. Please pick other dates.
          </div>
        )}

        <label className="block sm:col-span-2">
          <span className="mb-2 block">Guests</span>
          <select
            name="guests"
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
            className={field}
          >
            {Array.from({ length: room.maxGuests }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>

        <p className="pt-2 text-tiny uppercase tracking-[0.14em] text-tan sm:col-span-2">Guest details</p>
        <label className="block">
          <span className="mb-2 block">Full name</span>
          <input required name="name" autoComplete="name" maxLength={100} className={field} />
        </label>
        <label className="block">
          <span className="mb-2 block">Email</span>
          <input required type="email" name="email" autoComplete="email" maxLength={254} className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 block">Phone</span>
          <input required type="tel" name="phone" autoComplete="tel" maxLength={30} className={field} />
        </label>

        {error && (
          <p role="alert" className="border border-red-800/30 bg-red-50 px-4 py-3 text-small text-red-900 sm:col-span-2">
            {error}
          </p>
        )}

        {!inDrawer && (
          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="dark"
              disabled={pending || Boolean(collision)}
              className="w-full sm:w-auto"
            >
              {pending ? "Connecting to Paystack…" : collision ? "Dates Unavailable" : "Proceed to checkout"}
            </Button>
          </div>
        )}
      </div>

      {inDrawer ? (
        <div className="shrink-0 border-t border-line bg-sand px-5 py-5 shadow-[0_-10px_30px_rgba(31,58,64,0.08)] md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-tiny text-tan">
                {nights > 0
                  ? `Estimated total · ${nights} ${nights === 1 ? "night" : "nights"}`
                  : "Rate per night"}
              </p>
              <p className="text-h3 mt-1">
                {formatNaira(nights > 0 ? estimatedTotal : room.pricePerNight)}
              </p>
            </div>
            <p className="text-right text-small">{formatNaira(room.pricePerNight)} / night</p>
          </div>
          <Button
            type="submit"
            variant="dark"
            disabled={pending || Boolean(collision)}
            className="mt-5 w-full py-4"
          >
            {pending ? "Connecting to Paystack…" : collision ? "Dates Unavailable" : "Proceed to checkout"}
          </Button>
          <p className="mt-3 text-center text-tiny">
            {collision
              ? "Select unreserved dates to continue"
              : "Demo checkout only · Paystack Test Mode"}
          </p>
        </div>
      ) : (
        <aside className="h-fit border border-line p-5 md:sticky md:top-8">
          <p className="text-tiny text-tan">YOUR STAY</p>
          <h2 className="text-h4 mt-3">{room.name}</h2>
          <p className="mt-4 text-small">
            {formatNaira(room.pricePerNight)} / night
            {nights > 0 && ` × ${nights} ${nights === 1 ? "night" : "nights"}`}
          </p>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-tiny text-tan">Estimated total</p>
            <p className="text-h3 mt-1">{formatNaira(estimatedTotal)}</p>
          </div>
          {collision ? (
            <p className="mt-4 text-tiny text-accent font-medium">
              ⚠️ These dates are already booked for this room.
            </p>
          ) : (
            <p className="mt-4 text-tiny">
              Paystack test mode. Instant booking confirmation &amp; collision prevention active.
            </p>
          )}
        </aside>
      )}
    </form>
  );
}

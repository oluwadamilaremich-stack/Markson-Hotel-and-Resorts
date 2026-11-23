"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import clsx from "clsx";
import type { Room } from "@/content/rooms";
import { formatNaira } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { BookingDrawer } from "@/components/booking/booking-drawer";
import { SectionHeader } from "@/components/sections/section-header";
import { RoomSpecs } from "@/components/rooms/room-specs";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * "Stay your Way": hovering a room name only highlights it; clicking opens its details
 * and swaps the photo, and clicking again closes it.
 */
export function RoomsShowcase({ rooms }: { rooms: Room[] }) {
  const [active, setActive] = useState<number | null>(null);
  const room = active === null ? null : rooms[active];

  return (
    <section className="px-site mx-auto max-w-site py-24 md:py-28">
      <SectionHeader
        eyebrow="Rooms & Suites"
        title="Stay your Way"
        intro="From cozy beachfront rooms to luxurious oceanfront suites, each space at Markson is thoughtfully designed for comfort and style."
        action={<LinkButton href="/rooms">Explore All Rooms</LinkButton>}
      />

      {/* Desktop: interactive list + photo */}
      <div className="mt-16 hidden items-center gap-10 lg:grid lg:grid-cols-[1fr_1.15fr]">
        <ul>
          {rooms.map((r, i) => {
            const isActive = active === i;
            return (
              <li key={r.slug}>
                <button
                  type="button"
                  aria-expanded={isActive}
                  onClick={() => setActive(isActive ? null : i)}
                  className={clsx(
                    "group flex w-full items-center gap-6 py-5 text-left transition-opacity duration-500",
                    active !== null && !isActive && "opacity-35 hover:opacity-100",
                  )}
                >
                  <span
                    className={clsx(
                      "text-h3 shrink-0 transition-transform duration-500 ease-soft group-hover:translate-x-5",
                      isActive && "translate-x-5",
                    )}
                  >
                    {r.name}
                  </span>
                  <span
                    className={clsx(
                      "h-px flex-1 origin-left bg-ink/30 transition-transform duration-500 ease-soft group-hover:scale-x-100",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease }}
                      className="overflow-hidden"
                    >
                      <RoomSpecs room={r} className="pl-5 text-ink-soft" />
                      <div className="mt-5 flex items-end justify-between border-b border-ink/20 pb-5 pl-5">
                        <div>
                          <p className="text-tiny text-tan">Starting at</p>
                          <p>
                            <span className="text-h3">{formatNaira(r.pricePerNight)}</span>
                            <span className="text-h4 ml-1">/ night</span>
                          </p>
                        </div>
                        <BookingDrawer room={r} triggerLabel="Book" triggerClassName="px-5 py-2" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <div className="relative aspect-[722/600] overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={room?.slug ?? "default"}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease }}
            >
              <Image
                src={room?.image ?? "/images/home/rooms-feature.webp"}
                alt={room?.name ?? "A Markson suite overlooking the ocean"}
                fill
                sizes="55vw"
                loading="eager"
                className="object-cover"
              />
              {room && (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-6 pt-20 text-small text-white">
                  {room.tagline}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Phones and tablets: one room at a time, with arrows */}
      <RoomsCarousel rooms={rooms} />
    </section>
  );
}

/** Small-screen version: a single photo card per room; arrows or a swipe change room. */
function RoomsCarousel({ rooms }: { rooms: Room[] }) {
  const [index, setIndex] = useState(0);
  const swiped = useRef(false);
  const room = rooms[index];
  const go = (step: number) => setIndex((i) => (i + step + rooms.length) % rooms.length);

  return (
    <div className="relative mt-12 aspect-[5/4] overflow-hidden bg-ink text-white sm:aspect-[16/10] lg:hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={room.slug}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => (swiped.current = true)}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) go(1);
            else if (info.offset.x > 50) go(-1);
          }}
        >
          <Link
            href={`/rooms/${room.slug}`}
            draggable={false}
            className="absolute inset-0"
            onClick={(e) => {
              // A swipe shouldn't also count as a tap that opens the room
              if (swiped.current) e.preventDefault();
              swiped.current = false;
            }}
          >
            <Image src={room.image} alt={room.name} fill sizes="100vw" draggable={false} className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <p className="text-h3">{room.name}</p>
              <RoomSpecs room={room} className="mt-2 gap-x-4" />
              <p className="text-tiny mt-4">Starting at</p>
              <p className="pr-20">
                <span className="text-h3">{formatNaira(room.pricePerNight)}</span>
                <span className="text-h4 ml-1">/ night</span>
              </p>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="absolute right-3 bottom-4 flex sm:right-5 sm:bottom-6">
        <button type="button" onClick={() => go(-1)} aria-label="Previous room" className="p-2">
          <ArrowLeft className="size-5" strokeWidth={1.5} />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next room" className="p-2">
          <ArrowRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

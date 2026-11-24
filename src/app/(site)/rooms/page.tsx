import type { Metadata } from "next";
import { connection } from "next/server";
import { getRooms } from "@/lib/data";
import { PageHero } from "@/components/sections/page-hero";
import { PageIntro } from "@/components/sections/page-intro";
import { RoomCard } from "@/components/rooms/room-card";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Rooms & Suites",
  description:
    "From cozy beachfront rooms to luxurious oceanfront suites, each space at Markson is thoughtfully designed for comfort and style.",
};

export const instant = false;

export default async function RoomsPage() {
  await connection();
  const rooms = await getRooms();

  return (
    <>
      <PageHero image="/images/rooms/hero.webp" eyebrow="Rooms & Suites" title="Stay Your Way" pinned />

      <div className="relative z-10 bg-sand">
        <PageIntro>
          From cozy beachfront rooms to luxurious oceanfront suites, each space at Markson is
          thoughtfully designed for comfort and style.
        </PageIntro>

        <section className="px-site mx-auto grid max-w-site gap-5 pb-24 md:grid-cols-2 md:gap-10 md:pb-32">
          {rooms.map((room, i) => (
            <Reveal key={room.slug} delay={(i % 2) * 0.1}>
              <RoomCard room={room} />
            </Reveal>
          ))}
        </section>
      </div>
    </>
  );
}

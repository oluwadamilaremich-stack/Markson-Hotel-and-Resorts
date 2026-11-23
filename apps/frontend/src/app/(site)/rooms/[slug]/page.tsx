import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoom, getRooms } from "@/lib/data";
import { roomPolicies } from "@/content/hotel";
import { formatNaira } from "@/lib/format";
import { PageHero } from "@/components/sections/page-hero";
import { FaqSection } from "@/components/sections/faq-section";
import { RoomCard } from "@/components/rooms/room-card";
import { RoomSpecs } from "@/components/rooms/room-specs";
import { AmenityIcon } from "@/components/rooms/amenity-icon";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { LinkButton } from "@/components/ui/button";
import { BookingDrawer } from "@/components/booking/booking-drawer";
import { Reveal } from "@/components/ui/reveal";

export async function generateStaticParams() {
  const rooms = await getRooms();
  return rooms.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({ params }: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const room = await getRoom((await params).slug);
  return room ? { title: room.name, description: room.tagline } : {};
}

/** Heading on the left, content on the right (stacked on phones). */
function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-site mx-auto grid max-w-site gap-8 py-14 md:grid-cols-2 md:gap-10 md:py-20">
      <Reveal y={10}>
        <h2 className="text-h2 max-w-[440px]">{title}</h2>
      </Reveal>
      <div>{children}</div>
    </section>
  );
}

export default async function RoomPage({ params }: PageProps<"/rooms/[slug]">) {
  const { slug } = await params;
  const [room, rooms] = await Promise.all([getRoom(slug), getRooms()]);
  if (!room) notFound();

  // Two other rooms, starting after this one so each page suggests different rooms
  const index = rooms.findIndex((r) => r.slug === room.slug);
  const more = [1, 2].map((k) => rooms[(index + k) % rooms.length]);

  return (
    <>
      <PageHero image={room.heroImage ?? room.image} title={room.name} subtitle={room.tagline} pinned />

      <div className="relative z-10 bg-sand">
        <div className="pt-10 md:pt-20">
          <Row title="About">
            <Reveal y={20}>
              <RoomSpecs room={room} large />
            </Reveal>
            <Reveal y={20} delay={0.05} className="mt-6 border-t border-line pt-6">
              <p className="text-lead">{room.description}</p>
            </Reveal>
            <Reveal
              y={20}
              delay={0.1}
              className="mt-6 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6"
            >
              <div>
                <p className="text-tiny text-tan">Starting at</p>
                <p>
                  <span className="text-h3">{formatNaira(room.pricePerNight)}</span>
                  <span className="text-lead ml-1">/ night</span>
                </p>
              </div>
              <BookingDrawer room={room} />
            </Reveal>
          </Row>
        </div>

        <section className="py-10 md:py-16">
          <ImageCarousel images={room.gallery.map((src) => ({ src, alt: room.name }))} />
        </section>

        <Row title="Amenities">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-6 md:gap-y-10">
            {room.amenities.map((amenity, i) => (
              <li key={amenity}>
                <Reveal y={20} delay={i * 0.05} className="flex items-center gap-3">
                  <AmenityIcon name={amenity} className="size-7 shrink-0 md:size-8" />
                  {amenity}
                </Reveal>
              </li>
            ))}
          </ul>
        </Row>

        <FaqSection showEyebrow={false} title="Policies & Check-in Info" intro="" items={roomPolicies} />
        <FaqSection showEyebrow={false} intro="" />

        <section className="px-site mx-auto max-w-site pt-10 pb-24 md:pb-32">
          <div className="flex items-end justify-between gap-6">
            <Reveal y={10}>
              <h2 className="text-h2">More Rooms</h2>
            </Reveal>
            <Reveal y={20} delay={0.1}>
              <LinkButton href="/rooms">All Rooms</LinkButton>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 md:gap-10">
            {more.map((r, i) => (
              <Reveal key={r.slug} delay={i * 0.1}>
                <RoomCard room={r} />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

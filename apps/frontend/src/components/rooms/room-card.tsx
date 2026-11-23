import Image from "next/image";
import Link from "next/link";
import type { Room } from "@/content/rooms";
import { formatNaira } from "@/lib/format";
import { RoomSpecs } from "./room-specs";

/**
 * Photo card used on the Rooms page and under "More Rooms". On hover (client's video) the name
 * and specs slide up, "Starting at ₦X / night" fades in and the bottom shade deepens.
 * Touch screens have no hover, so the price is always shown there.
 */
export function RoomCard({ room, sizes = "(min-width: 768px) 45vw, 100vw" }: { room: Room; sizes?: string }) {
  return (
    <Link href={`/rooms/${room.slug}`} className="group relative block aspect-[648/533] overflow-hidden text-white">
      <Image
        src={room.image}
        alt={room.name}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-500" />
      <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent opacity-100 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
        <div className="transition-transform duration-500 ease-soft lg:translate-y-[4.9rem] lg:group-hover:translate-y-0">
          <p className="text-[20px] leading-tight md:text-h3">{room.name}</p>
          <RoomSpecs room={room} className="mt-2" />
          <div className="mt-4 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100">
            <p className="text-tiny">Starting at</p>
            <p>
              <span className="text-[20px] leading-tight md:text-h3">{formatNaira(room.pricePerNight)}</span>
              <span className="text-h4 ml-1">/ night</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

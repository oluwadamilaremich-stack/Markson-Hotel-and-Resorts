import { BedDouble, Maximize, UserRound } from "lucide-react";
import clsx from "clsx";
import type { Room } from "@/content/rooms";
import { formatSqft } from "@/lib/format";

export function RoomSpecs({
  room,
  className,
  large = false,
}: {
  room: Pick<Room, "sizeSqft" | "beds" | "guestsLabel">;
  className?: string;
  large?: boolean;
}) {
  const icon = large ? "size-5" : "size-4";
  return (
    <ul className={clsx("flex flex-wrap items-center gap-x-5 gap-y-1", large ? "text-lead" : "text-small", className)}>
      <li className="flex items-center gap-2">
        <Maximize className={icon} strokeWidth={1.25} /> {formatSqft(room.sizeSqft)}
      </li>
      <li className="flex items-center gap-2">
        <BedDouble className={icon} strokeWidth={1.25} /> {room.beds}
      </li>
      <li className="flex items-center gap-2">
        <UserRound className={icon} strokeWidth={1.25} /> {room.guestsLabel}
      </li>
    </ul>
  );
}

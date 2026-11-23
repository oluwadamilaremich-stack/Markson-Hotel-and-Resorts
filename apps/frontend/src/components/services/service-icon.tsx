import { Dumbbell, Flower2, Martini, TreePalm, UtensilsCrossed } from "lucide-react";
import type { ServiceIcon as ServiceIconName } from "@/content/hotel";

const icons = {
  spa: Flower2,
  restaurant: UtensilsCrossed,
  lounge: Martini,
  beach: TreePalm,
  fitness: Dumbbell,
} satisfies Record<ServiceIconName, unknown>;

export function ServiceIcon({ name, className }: { name: ServiceIconName; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} strokeWidth={1.25} />;
}

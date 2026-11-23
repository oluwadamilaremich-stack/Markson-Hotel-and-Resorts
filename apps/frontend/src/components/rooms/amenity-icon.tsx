import {
  Baby,
  BedDouble,
  BookOpen,
  ConciergeBell,
  Coffee,
  Croissant,
  Eye,
  Fence,
  Flower2,
  Laptop,
  Leaf,
  ShowerHead,
  Sofa,
  Sparkles,
  Sunset,
  Tv,
  Umbrella,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
  type LucideIcon,
} from "lucide-react";

// Matched on keywords so the admin can type amenities freely ("King Bed", "2 King Beds"...).
const rules: [RegExp, LucideIcon][] = [
  [/bed/i, BedDouble],
  [/shower|bath/i, ShowerHead],
  [/breakfast/i, Croissant],
  [/tv/i, Tv],
  [/tea|coffee/i, Coffee],
  [/garden|patio/i, Flower2],
  [/meditation|yoga/i, Leaf],
  [/sunset/i, Sunset],
  [/ocean|pool|beach view/i, Waves],
  [/view/i, Eye],
  [/beach/i, Umbrella],
  [/balcony|terrace/i, Fence],
  [/bar|wine/i, Wine],
  [/lounge|sofa/i, Sofa],
  [/desk|work/i, Laptop],
  [/read|loft|book/i, BookOpen],
  [/wi-?fi|internet/i, Wifi],
  [/kid|child|baby/i, Baby],
  [/butler|concierge/i, ConciergeBell],
  [/dining|kitchen/i, UtensilsCrossed],
];

export function AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = rules.find(([re]) => re.test(name))?.[1] ?? Sparkles;
  return <Icon className={className} strokeWidth={1.25} />;
}

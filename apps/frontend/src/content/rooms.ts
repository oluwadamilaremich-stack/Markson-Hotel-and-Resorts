export type Room = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  sizeSqft: number;
  beds: string;
  guestsLabel: string;
  maxGuests: number;
  /** Nightly rate in whole naira */
  pricePerNight: number;
  image: string;
  /** Top-of-page photo on the room's own page (defaults to `image`). */
  heroImage?: string;
  gallery: string[];
  amenities: string[];
};

export const rooms: Room[] = [
  {
    slug: "coastal-garden-suite",
    name: "Coastal Garden Suite",
    tagline:
      "Reconnect with nature in this tranquil suite with a garden patio and soothing ocean sounds.",
    description:
      "A peaceful 480 sq. ft. retreat featuring a private garden patio, queen bed, indoor-outdoor shower, and a serene meditation corner.",
    sizeSqft: 480,
    beds: "1 Queen Bed",
    guestsLabel: "2 Guests",
    maxGuests: 2,
    pricePerNight: 450_000,
    image: "/images/rooms/coastal-garden-suite.webp",
    heroImage: "/images/rooms/hero.webp",
    gallery: [
      "/images/rooms/detail-1.webp",
      "/images/rooms/detail-2.webp",
      "/images/rooms/detail-3.webp",
      "/images/rooms/detail-4.webp",
      "/images/rooms/detail-5.webp",
    ],
    amenities: [
      "Garden Patio",
      "Queen Bed",
      "Rain Shower",
      "Breakfast",
      "Meditation Area",
      "Smart TV",
      "Yoga Mat",
      "Tea Set",
    ],
  },
  {
    slug: "ocean-view-king-suite",
    name: "Ocean View King Suite",
    tagline:
      "Relax in seaside luxury with a private balcony, rainfall shower, and dreamy king bed.",
    description:
      "A breezy 550 sq. ft. suite with floor-to-ceiling doors opening onto a private ocean-view balcony, a canopy king bed, and a spa-inspired rainfall shower.",
    sizeSqft: 550,
    beds: "1 King Bed",
    guestsLabel: "2 Guests",
    maxGuests: 2,
    pricePerNight: 570_000,
    image: "/images/rooms/ocean-view-king-suite.webp",
    gallery: [
      "/images/rooms/ocean-view-king-suite.webp",
      "/images/rooms/ocean-view-king-suite-2.webp",
      "/images/rooms/detail-5.webp",
      "/images/home/rooms-feature.webp",
    ],
    amenities: [
      "Ocean View",
      "King Bed",
      "Private Balcony",
      "Rain Shower",
      "Breakfast",
      "Smart TV",
      "Mini Bar",
      "Tea Set",
    ],
  },
  {
    slug: "sunset-loft",
    name: "Sunset Loft",
    tagline:
      "A light-filled loft with a glass ceiling, a cozy reading nook, and golden-hour views.",
    description:
      "A 650 sq. ft. two-level loft under a sweeping glass roof, with a queen bed, a lofted reading nook, a writing desk, and front-row seats to every sunset.",
    sizeSqft: 650,
    beds: "1 Queen Bed",
    guestsLabel: "2 Guests",
    maxGuests: 2,
    pricePerNight: 645_000,
    image: "/images/rooms/sunset-loft.webp",
    gallery: [
      "/images/rooms/sunset-loft.webp",
      "/images/rooms/sunset-loft-2.webp",
      "/images/gallery/8.webp",
    ],
    amenities: [
      "Sunset View",
      "Queen Bed",
      "Reading Loft",
      "Work Desk",
      "Breakfast",
      "Smart TV",
      "Wi-Fi",
      "Tea Set",
    ],
  },
  {
    slug: "beachfront-family-suite",
    name: "Beachfront Family Suite",
    tagline:
      "Bring the whole family and enjoy beachfront comfort, space, and fun for all ages.",
    description:
      "A spacious 750 sq. ft. suite steps from the sand, with two king beds, a lounge area for the little ones, and a terrace looking straight out to the sea.",
    sizeSqft: 750,
    beds: "2 King Beds",
    guestsLabel: "4-5 Guests",
    maxGuests: 5,
    pricePerNight: 840_000,
    image: "/images/rooms/beachfront-family-suite.webp",
    gallery: [
      "/images/rooms/beachfront-family-suite.webp",
      "/images/services/beach-cabanas.webp",
      "/images/gallery/1.webp",
    ],
    amenities: [
      "Beach Access",
      "2 King Beds",
      "Lounge Area",
      "Terrace",
      "Breakfast",
      "Smart TV",
      "Kids' Amenities",
      "Mini Bar",
    ],
  },
  {
    slug: "penthouse-suite",
    name: "Penthouse Suite",
    tagline:
      "Our crown jewel: a sweeping terrace, a private plunge pool, and panoramic ocean views.",
    description:
      "A 1,200 sq. ft. top-floor residence with two king bedrooms, a wraparound terrace with a private plunge pool, and an open living and dining space made for hosting.",
    sizeSqft: 1200,
    beds: "2 King Beds",
    guestsLabel: "4-5 Guests",
    maxGuests: 5,
    pricePerNight: 1_350_000,
    image: "/images/rooms/penthouse-suite.webp",
    gallery: [
      "/images/rooms/penthouse-suite.webp",
      "/images/services/lounge.webp",
      "/images/gallery/7.webp",
    ],
    amenities: [
      "Plunge Pool",
      "2 King Beds",
      "Wraparound Terrace",
      "Butler Service",
      "Breakfast",
      "Smart TV",
      "Mini Bar",
      "Dining Area",
    ],
  },
  {
    slug: "horizon-suite",
    name: "Horizon Suite",
    tagline:
      "Floor-to-ceiling windows frame endless ocean horizons in this serene, modern suite.",
    description:
      "A calm 900 sq. ft. corner suite wrapped in glass, with a king bed, a sunken lounge, and uninterrupted views of the horizon from morning to night.",
    sizeSqft: 900,
    beds: "1 King Bed",
    guestsLabel: "2-3 Guests",
    maxGuests: 3,
    pricePerNight: 975_000,
    image: "/images/rooms/horizon-suite.webp",
    gallery: [
      "/images/rooms/horizon-suite.webp",
      "/images/home/rooms-feature.webp",
      "/images/about/banner.webp",
    ],
    amenities: [
      "Panoramic View",
      "King Bed",
      "Sunken Lounge",
      "Rain Shower",
      "Breakfast",
      "Smart TV",
      "Mini Bar",
      "Tea Set",
    ],
  },
];

export function getRoom(slug: string): Room | null {
  return rooms.find((room) => room.slug === slug) ?? null;
}

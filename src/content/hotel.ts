export const gallery = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  src: `/images/gallery/${n}.webp`,
  alt: "Moments at Markson",
}));

export const services = [
  {
    slug: "spa",
    name: "The Tide Pool Spa",
    icon: "spa",
    description:
      'Featuring seaweed wraps, hot stone massages, and our signature "Ocean Glow" facial',
    image: "/images/services/spa.webp",
  },
  {
    slug: "restaurant",
    name: "Shoreline Restaurant",
    icon: "restaurant",
    description:
      "Farm-to-table dining with rotating seasonal menus and daily catch specials",
    image: "/images/services/restaurant.webp",
  },
  {
    slug: "lounge",
    name: "Sunset Lounge",
    icon: "lounge",
    description:
      "Handcrafted cocktails and small plates with unobstructed views of the sunset",
    image: "/images/services/lounge.webp",
  },
  {
    slug: "beach",
    name: "Private Beach Access",
    icon: "beach",
    description: "Complimentary cabanas, towel service, and beach butler",
    image: "/images/services/beach-cabanas.webp",
  },
  {
    slug: "fitness",
    name: "Fitness Center",
    icon: "fitness",
    description: "24-hour access with daily yoga and fitness classes on the beach",
    image: "/images/services/fitness.webp",
  },
] as const;

export type ServiceIcon = (typeof services)[number]["icon"];

export const events = [
  {
    name: "Seaside Wedding",
    description:
      "Celebrate love with an oceanfront ceremony and curated weekend experience for you and your guests.",
    schedule: "Offered seasonally (weather dependent)",
    image: "/images/events/wedding.webp",
    thumb: "/images/events/wedding-sm.webp",
  },
  {
    name: "Welcome Cocktail",
    description:
      "Join us on the beachfront terrace for a complimentary welcome cocktail as the sun sets over the ocean.",
    schedule: "Everyday, 02:00 PM",
    image: "/images/events/cocktail.webp",
    thumb: "/images/events/cocktail-sm.webp",
  },
  {
    name: "Wellness & Yoga Mornings",
    description:
      "Start your day with sunrise yoga on the beach led by certified instructors.",
    schedule: "Every Friday, 06:00 AM - 09:00 AM",
    image: "/images/events/yoga.webp",
    thumb: "/images/events/yoga-sm.webp",
  },
  {
    name: "Beach Bonfire Nights",
    description:
      "Gather around the fire under the stars with s’mores, local storytellers, and live island-style music.",
    schedule: "Every Friday, 07:00 PM - 10:00 PM",
    image: "/images/events/bonfire.webp",
    thumb: "/images/events/bonfire-sm.webp",
  },
];

export const testimonials = [
  {
    title: "Wonderful place to stay for our first trip to Markson",
    body: "Our anniversary weekend at Markson exceeded all expectations. The sunset view from our balcony was worth every penny, and the staff remembered our names from the moment we arrived.",
    author: "Jennifer and Mark T.",
    from: "Seattle, WA",
  },
  {
    title: "A peaceful escape that truly felt like paradise!",
    body: "The staycation we didn’t know we needed. The staff went beyond accommodating, the views were unreal, and the food felt like a dream. We didn’t want to leave.",
    author: "Tolu A.",
    from: "Abuja, Nigeria",
  },
  {
    title: "Every detail was thought through",
    body: "From the welcome cocktail to the turndown notes, everything felt personal. The Coastal Garden Suite was the calmest room we have ever stayed in.",
    author: "Chiamaka and David O.",
    from: "London, UK",
  },
];

export const faqs = [
  {
    q: "What time is check-in and check-out?",
    a: "Check-in begins at 2:00 PM and check-out is at 12:00 PM. Early check-in and late check-out are available on request, subject to availability.",
  },
  {
    q: "Is parking available at the hotel?",
    a: "Yes. Complimentary secure parking is available for all guests, and our valet team is on hand around the clock.",
  },
  {
    q: "Do you allow pets?",
    a: "We welcome small, well-behaved pets in selected rooms. Please let us know when you book so we can prepare your room.",
  },
  {
    q: "Is breakfast included with the stay?",
    a: "Yes. Every stay includes a daily breakfast at Shoreline Restaurant, served from 6:30 AM to 10:30 AM.",
  },
  {
    q: "Do the rooms have ocean views?",
    a: "Most of our suites face the ocean. The Coastal Garden Suite looks onto our private gardens while still being moments from the beach.",
  },
  {
    q: "Can I cancel or change my reservation?",
    a: "Reservations can be changed or cancelled free of charge up to 48 hours before arrival. Contact our reservations team and we will take care of it.",
  },
];

export const roomPolicies = [
  {
    q: "Check-In & Check-Out",
    a: "Check-in from 2:00 PM, check-out by 12:00 PM. A valid ID is required at check-in.",
  },
  {
    q: "Cancellation Policy",
    a: "Free cancellation up to 48 hours before arrival. Cancellations within 48 hours are charged one night’s stay.",
  },
  {
    q: "Pet Policy",
    a: "Small pets are welcome in selected rooms on request. A cleaning fee may apply.",
  },
  {
    q: "Smoking Policy",
    a: "All rooms are strictly non-smoking. Designated smoking areas are available on the grounds.",
  },
];

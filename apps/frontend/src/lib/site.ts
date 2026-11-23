export const site = {
  name: "Markson Hotels & Resorts",
  shortName: "Markson",
  description:
    "Experience sun-kissed shores, luxurious stays, and unforgettable memories at Markson Hotels & Resorts.",
  location: "Lagos, Nigeria",
  address: "Lagos, Nigeria",
  phone: "(234) 812-114-1582",
  phoneHref: "tel:+2348121141582",
  emails: {
    general: "oluwadamilaremich@gmail.com",
    bookings: "oluwadamilaremich@gmail.com",
    events: "oluwadamilaremich@gmail.com",
  },
  copyrightYear: 2026,
  socials: {
    facebook: "#",
    instagram: "#",
    youtube: "#",
    tiktok: "#",
  },
} as const;

export const mainNav = [
  { label: "About", href: "/about" },
  { label: "Rooms", href: "/rooms" },
  { label: "Services", href: "/services" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = [
  {
    title: "Navigation",
    links: [
      { label: "Home", href: "/" },
      { label: "Rooms", href: "/rooms" },
      { label: "Services", href: "/services" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Pages",
    links: [
      { label: "About", href: "/about" },
      { label: "Rooms", href: "/rooms" },
      { label: "Services", href: "/services" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    title: "Pages",
    links: [
      { label: "Blog/ News", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "404", href: "/404" },
    ],
  },
] as const;

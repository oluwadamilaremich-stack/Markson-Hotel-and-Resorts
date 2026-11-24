export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  heroImage?: string;
  /** Paragraphs; a paragraph may start with a bold lead-in using "Heading|Text". */
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "top-5-hidden-gems-near-markson",
    title: "Top 5 Hidden Gems Near Markson You’ll Love",
    excerpt:
      "Skip the crowds and explore local favorites just minutes from your suite.",
    date: "2025-06-01",
    image: "/images/blog/hidden-gems.webp",
    heroImage: "/images/blog/hidden-gems-hero.webp",
    body: [
      "Markson isn’t just a destination — it’s your gateway to a stretch of coast full of character, color, and charm. While the main beaches and tourist stops have their place, we like to point our guests to the places locals actually go. Here are five of our favorite hidden spots you can reach on foot, bike, or with a short ride.",
      "1. Seaside Bluff Trail|Just a 10-minute walk from Markson’s south gate, this lesser-known trail leads to panoramic cliff views and tide pools teeming with marine life. Go at golden hour for breathtaking photos.",
      "2. Coral & Tide Bookshop|A cozy independent bookstore nestled between two cafés, Coral & Tide offers a curated selection of beach reads, handmade journals, and rare travel books. The owner, Len, often hosts impromptu poetry readings.",
      "3. Salty Jack’s Fish Tacos|You haven’t tasted the real coast until you’ve tried Salty Jack’s. Run by a local family for four generations, this tiny shack serves the best grilled mahi tacos in town — with secret sauces and ocean views.",
      "4. Drift Market|Held every Saturday morning, this artisan pop-up features handmade goods, fresh produce, beachwear, and live music. Guests often find keepsakes they couldn’t have bought anywhere else.",
      "5. Tide & Bloom Gardens|An off-the-map tropical greenhouse open to the public twice a week. Ideal for quiet walks, nature photography, or a shaded afternoon with a picnic from Markson’s kitchen.",
      "Our front desk team can provide walking maps, directions, or even arrange a cruiser bike rental. When you stay at Markson, you’re not just near the beach — you’re at the heart of a community worth discovering.",
    ],
  },
  {
    slug: "inside-our-garden-wellness-suite",
    title: "Relax, Restore, Repeat: Inside Our Garden Wellness Suite",
    excerpt:
      "Discover your new favorite retreat designed for calm, clarity, and coastal connection.",
    date: "2025-05-28",
    image: "/images/blog/wellness-suite.webp",
    body: [
      "Some rooms are made for sleeping. The Coastal Garden Suite was made for slowing down. Tucked into our gardens, it trades city noise for birdsong, sea breeze, and the soft rustle of palms.",
      "A space to breathe|Every suite comes with a dedicated meditation corner, a yoga mat, and a curated tea set, so your morning ritual starts the moment you wake up.",
      "Indoor-outdoor living|Step from your bed to a private garden patio, or rinse off under the open-air rain shower surrounded by greenery.",
      "Pair your stay with a treatment at The Tide Pool Spa or a sunrise yoga session on the beach, and you may never want to leave.",
    ],
  },
  {
    slug: "bonfire-nights-are-back",
    title: "Bonfire Nights Are Back at Markson",
    excerpt:
      "Unwind with music, stories, and s’mores under the stars — one of our most beloved traditions returns.",
    date: "2025-05-24",
    image: "/images/blog/bonfire-nights.webp",
    body: [
      "When the sun dips below the horizon every Friday, the beach comes alive with the crackle of the fire and the sound of live island-style music.",
      "What to expect|Toasted s’mores, warm drinks from the Sunset Lounge, and local storytellers sharing tales of the coast.",
      "When|Every Friday from 7:00 PM to 10:00 PM. Free for all hotel guests — just bring a sweater and an appetite.",
    ],
  },
  {
    slug: "introducing-our-coastal-brunch-menu",
    title: "Introducing Our New Coastal Brunch Menu",
    excerpt:
      "Fresh flavors, ocean views, and breezy bites — here’s what’s cooking on weekends at Markson.",
    date: "2025-05-20",
    image: "/images/blog/coastal-brunch.webp",
    body: [
      "Weekends at Shoreline Restaurant just got a little more delicious. Our chefs have created a brunch menu that celebrates the coast, from the market to your table.",
      "On the menu|Grilled catch of the day, tropical fruit platters, fluffy pancakes with local honey, and our signature palm-wine mimosa.",
      "Brunch is served every Saturday and Sunday from 10:00 AM to 2:00 PM. Reservations are recommended.",
    ],
  },
  {
    slug: "a-day-in-the-life-at-markson",
    title: "Behind the Scenes: A Day in the Life at Markson",
    excerpt:
      "From sunrise to starlight, here’s how our team brings the magic of Markson to life every day.",
    date: "2025-05-16",
    image: "/images/blog/behind-the-scenes.webp",
    body: [
      "Before the first guest wakes, our team is already at work: raking the sand, setting breakfast tables, and preparing fresh flowers for every room.",
      "Morning|Housekeeping, the kitchen, and the beach team gather for a quick briefing on every arrival and special occasion of the day.",
      "Evening|As the sun sets, turndown service begins, the lounge lights up, and the concierge team makes sure every dinner reservation goes off without a hitch.",
      "It takes many hands to make a stay feel effortless, and we wouldn’t have it any other way.",
    ],
  },
  {
    slug: "tips-for-your-first-stay",
    title: "5 Essential Tips for Your First Stay at Markson",
    excerpt:
      "Whether you're visiting Markson for a romantic getaway or a solo escape, here's how to make the most of your first coastal stay with us.",
    date: "2025-05-12",
    image: "/images/blog/first-stay-tips.webp",
    body: [
      "Your first stay with us should feel easy from the moment you arrive. Here are a few tips from our concierge team.",
      "1. Tell us what you’re celebrating|Birthdays, anniversaries, honeymoons — let us know when you book and we’ll add a special touch.",
      "2. Book spa treatments early|The Tide Pool Spa fills up fast on weekends.",
      "3. Catch the welcome cocktail|Every day at 2:00 PM on the beachfront terrace.",
      "4. Don’t miss Bonfire Nights|Every Friday from 7:00 PM.",
      "5. Ask the front desk|Our team knows every hidden gem nearby and can arrange transport for you.",
    ],
  },
];

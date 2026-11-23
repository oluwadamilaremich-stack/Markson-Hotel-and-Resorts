import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/sections/page-hero";
import { ContactCta } from "@/components/sections/contact-cta";
import { AboutIntro } from "@/components/about/about-intro";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Markson Hotels & Resorts is your beachfront sanctuary in Lagos, where the rhythms of the ocean meet warm, thoughtful hospitality.",
};

const story = [
  {
    title: "Designed with Heart",
    text: "Every corner of Markson reflects our passion for thoughtful hospitality — from curated interiors to locally sourced details.",
    image: "/images/about/story-1.webp",
  },
  {
    title: "Born from the Coast",
    text: "Markson was created with deep roots on the Lagos coast, inspired by the golden sands, ocean rhythms, and the timeless elegance of seaside living.",
    image: "/images/about/story-2.webp",
  },
  {
    title: "A Story That Continues",
    text: "We’re proud to welcome returning guests year after year. As our story evolves, so does our commitment to creating timeless, personal experiences on the edge of the Atlantic.",
    image: "/images/about/story-3.webp",
  },
];

const values = [
  {
    title: "Intentional Hospitality",
    text: "We believe great service should feel natural, never forced. Every team member is empowered to create moments that matter — from a warm greeting to a handwritten note.",
    image: "/images/about/value-1.webp",
  },
  {
    title: "Local Roots, Global Standards",
    text: "We support our region’s makers, growers, and artists. But we hold ourselves to the world’s highest standards in comfort, cleanliness, and care.",
    image: "/images/about/value-2.webp",
  },
  {
    title: "Sustainability With Soul",
    text: "We’re committed to protecting the beauty that surrounds us — with eco-conscious operations, mindful sourcing, and partnerships that uplift our environment and culture.",
    image: "/images/about/value-3.webp",
  },
];

function CenteredHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Reveal y={10} className="w-full max-w-[600px]">
        <h2 className="text-h2 w-full">{title}</h2>
      </Reveal>
      <Reveal y={10} delay={0.05} className="w-full max-w-[600px]">
        <p className="mt-5 w-full">{subtitle}</p>
      </Reveal>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        image="/images/about/hero.webp"
        eyebrow="About Markson"
        title="Your Home by the Ocean"
        pinned
        fullViewport
      />

      <div className="relative z-10 bg-sand">
        <AboutIntro
          text="Welcome to Markson, your beachfront sanctuary where the rhythms of the ocean and the warmth of our hospitality create a stay like no other."
        />

        <section className="relative mt-0 aspect-video overflow-hidden md:aspect-auto md:h-[95svh] md:min-h-[360px] xl:mt-[302px]">
          <Image
            src="/images/about/intro.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </section>

        <section className="mx-auto max-w-[1225px] px-site pt-[39px] pb-[129px] md:pt-[100px] md:pb-32 xl:pb-[263px] lg:px-0">
          <CenteredHeading title="Our Story" subtitle="From a love of the sea to a promise of serenity." />
          <div className="mt-6 grid gap-14 md:mt-40 md:grid-cols-3 md:gap-[80px]">
            {story.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className="relative aspect-[392/436] overflow-hidden">
                  <Image src={item.image} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" />
                </div>
                <h3 className="text-h3 mt-5">{item.title}</h3>
                <p className="mt-4 max-w-[360px]">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1225px] px-site pb-24 md:pb-32 lg:px-0">
          <CenteredHeading title="Our Values" subtitle="What we believe in shapes every stay." />
          <div className="mt-16 space-y-14 md:mt-[100px] md:space-y-16">
            {values.map((item) => (
              <div key={item.title} className="grid items-center gap-8 md:grid-cols-[1fr_400px]">
                <Reveal>
                  <h3 className="text-h3">{item.title}</h3>
                  <p className="mt-5 max-w-[360px]">{item.text}</p>
                </Reveal>
                <Reveal delay={0.1} className="relative aspect-[3/2] overflow-hidden">
                  <Image src={item.image} alt="" fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover" />
                </Reveal>
              </div>
            ))}
          </div>
        </section>

        <ContactCta />
      </div>
    </>
  );
}

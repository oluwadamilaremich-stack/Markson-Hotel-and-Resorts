import Image from "next/image";
import { Eyebrow, Monogram, PalmShadow } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

// Photos scroll past the pinned letter on desktop (hidden on smaller screens). Positions
// follow the Figma frame (offsets in px from the top of the 2600px-tall section, at 1440px wide).
const photos = [
  { src: "/images/home/welcome-1.webp", top: 946, side: "right-[7.2%]" },
  { src: "/images/home/welcome-2.webp", top: 1099, side: "left-[3.6%]" },
  { src: "/images/home/welcome-3.webp", top: 1489, side: "right-[3.6%]" },
  { src: "/images/home/welcome-4.webp", top: 1749, side: "left-[6.4%]" },
  { src: "/images/home/welcome-5.webp", top: 2152, side: "right-[7.2%]" },
];

export function Welcome() {
  return (
    // overflow-clip (not overflow-hidden) so the sticky letter can pin to the viewport
    <section className="relative overflow-clip py-24 lg:h-[2600px] lg:py-0">
      <PalmShadow className="-top-24 -left-48 w-[640px]" />
      <PalmShadow className="top-[30%] -right-56 w-[640px] -scale-x-100" />

      <div className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:items-center lg:justify-center">
        <Reveal className="mx-auto flex max-w-[640px] flex-col items-center px-5 text-center">
          <Monogram size={24} />
          <Eyebrow className="mt-5 text-ink">Welcome to Markson</Eyebrow>
          <h2 className="text-h2 mt-6">Where Luxury Meets the Ocean Breeze</h2>

          <div className="text-small mt-10 max-w-[460px] space-y-5">
            <p>Dear Valued Guest,</p>
            <p>
              Welcome to Markson, your beachfront sanctuary where the rhythms of the ocean and the
              warmth of our hospitality create a stay like no other.
            </p>
            <p>
              Our passion for service and attention to detail are the heart of everything we do.
              Please feel free to reach out to any member of our team — or to me personally — if
              there’s anything we can do to make your stay even more exceptional.
            </p>
            <p>
              Thank you for choosing Markson. We can’t wait to share our little piece of paradise
              with you.
            </p>
            <p className="pt-2">Warmest regards,</p>
          </div>

          <Image src="/images/brand/signature.webp" alt="" width={130} height={34} className="mt-4" />
          <p className="text-h4 mt-3">Michael Olajide</p>
          <p className="text-tiny text-tan-light">General Manager</p>
        </Reveal>
      </div>

      {photos.map((p) => (
        <div
          key={p.src}
          style={{ top: p.top }}
          className={`absolute hidden aspect-[5/6] w-[20.8%] max-w-[300px] overflow-hidden lg:block ${p.side}`}
        >
          <Image src={p.src} alt="" fill sizes="300px" className="object-cover" />
        </div>
      ))}
    </section>
  );
}

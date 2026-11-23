import { faqs } from "@/content/hotel";
import { Accordion } from "@/components/ui/accordion";
import { Eyebrow } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

export function FaqSection({
  showEyebrow = true,
  items = faqs,
  title = "Frequently Asked Questions",
  intro = "Everything you need to know for a seamless stay, from check-in to check-out and every detail in between.",
}: {
  showEyebrow?: boolean;
  items?: readonly { q: string; a: string }[];
  title?: string;
  intro?: string;
}) {
  return (
    <section className="px-site mx-auto grid max-w-site gap-12 py-24 md:grid-cols-2 md:py-32">
      <div>
        {showEyebrow && (
          <Reveal y={10}>
            <Eyebrow className="mb-5">FAQ&apos;s</Eyebrow>
          </Reveal>
        )}
        <Reveal y={10} delay={0.05}>
          <h2 className="text-h2 max-w-[440px]">{title}</h2>
          {intro && <p className="mt-5 max-w-[400px]">{intro}</p>}
        </Reveal>
      </div>
      <Accordion items={items} />
    </section>
  );
}

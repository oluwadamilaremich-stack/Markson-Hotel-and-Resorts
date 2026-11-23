import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

/** Centred opening for pages without a photo hero (Blog, Contact, Privacy...). */
export function LightPageHeader({
  eyebrow,
  title,
  intro,
  titleClassName = "text-display",
}: {
  eyebrow?: ReactNode;
  title: string;
  intro?: string;
  titleClassName?: string;
}) {
  return (
    <section className="px-site mx-auto flex max-w-site flex-col items-center pt-36 text-center md:pt-[200px]">
      {eyebrow && (
        <Reveal y={10}>
          <Eyebrow className="text-ink">{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal y={10} delay={0.05}>
        <h1 className={`${titleClassName} mt-4 max-w-[900px]`}>{title}</h1>
      </Reveal>
      {intro && (
        <Reveal y={10} delay={0.1}>
          <p className="mt-6 max-w-[400px]">{intro}</p>
        </Reveal>
      )}
    </section>
  );
}

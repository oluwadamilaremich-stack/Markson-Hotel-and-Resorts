"use client";

import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { playIntro } from "@/lib/intro";

/** "Lost in the Tides?" (layout from the reference site; not in Figma). */
export function NotFoundContent() {
  const pathname = usePathname();

  return (
    <section className="px-site flex min-h-[80svh] flex-col items-center justify-center pt-24 pb-20 text-center">
      <Reveal y={10}>
        <h1 className="text-h2">Lost in the Tides?</h1>
      </Reveal>
      <Reveal y={10} delay={0.05}>
        <p className="mt-5 max-w-[400px]">
          The page you’re looking for might have drifted out to sea. Let’s guide you back to
          shore.
        </p>
      </Reveal>
      <Reveal y={20} delay={0.1}>
        <LinkButton
          href="/"
          className="mt-8"
          onClick={(event) => {
            if (
              pathname !== "/" &&
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              playIntro();
            }
          }}
        >
          Back to Home
        </LinkButton>
      </Reveal>
    </section>
  );
}

"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { services } from "@/content/hotel";
import { LinkButton } from "@/components/ui/button";
import { SectionHeader } from "@/components/sections/section-header";
import { ServiceIcon } from "@/components/services/service-icon";

const ease = [0.22, 1, 0.36, 1] as const;

// The whole slide (photo + text) fades out, then the next one fades in sliding from the
// side it is coming from.
const slide = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 80 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export function ServicesSlider() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const service = services[index];

  const go = (step: number) => {
    setDirection(step);
    setIndex((i) => (i + step + services.length) % services.length);
  };

  return (
    <section className="px-site mx-auto max-w-site py-24 md:py-28">
      <SectionHeader
        eyebrow="Services & Amenities"
        title="Experience Paradise"
        intro="Indulge in coastal luxury with our carefully curated experiences and premier facilities designed to elevate your stay from ordinary to extraordinary."
        action={<LinkButton href="/services">Explore All Services</LinkButton>}
      />

      <div className="relative mt-16 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={service.slug}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid gap-10 md:grid-cols-2"
          >
            <div className="relative aspect-[648/480] overflow-hidden">
              <Image
                src={service.image}
                alt={service.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="md:pt-32">
              <ServiceIcon name={service.icon} className="size-9" />
              <h3 className="text-h3 mt-6 md:mt-12">{service.name}</h3>
              <p className="mt-4 max-w-[380px] md:mt-10">{service.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Load every service photo up front so each one is ready when it slides in */}
        {/* (fill + the same `sizes` so the browser picks exactly the same file as the slide) */}
        <div className="pointer-events-none absolute size-px overflow-hidden opacity-0" aria-hidden>
          {services.map((s) => (
            <Image key={s.slug} src={s.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" loading="eager" />
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-3 md:absolute md:right-0 md:bottom-0 md:mt-0">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous service"
            className="flex size-10 items-center justify-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-sand"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next service"
            className="flex size-10 items-center justify-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-sand"
          >
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

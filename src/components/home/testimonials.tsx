"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { testimonials } from "@/content/hotel";
import { Reveal } from "@/components/ui/reveal";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];
  const go = (step: number) =>
    setIndex((i) => (i + step + testimonials.length) % testimonials.length);

  return (
    <section className="px-site mx-auto max-w-site overflow-x-clip py-24 md:py-36">
      <Reveal x={60} className="flex flex-col items-center text-center">
        <Image src="/images/brand/tripadvisor.webp" alt="Tripadvisor" width={140} height={30} />

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <blockquote className="text-h2 mt-10 max-w-[720px]">“{t.title}”</blockquote>
            <div className="mt-8 flex gap-1.5 text-tan-light" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="size-5 fill-current" strokeWidth={0} />
              ))}
            </div>
            <p className="mt-8 max-w-[600px]">{t.body}</p>
            <p className="mt-5">
              {t.author}, {t.from}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous review"
            className="flex size-10 items-center justify-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-sand"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next review"
            className="flex size-10 items-center justify-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-sand"
          >
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </Reveal>
    </section>
  );
}

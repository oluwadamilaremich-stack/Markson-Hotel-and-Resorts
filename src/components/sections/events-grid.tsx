"use client";

import Image from "next/image";
import { motion } from "motion/react";
import clsx from "clsx";
import { events } from "@/content/hotel";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Alternating photo / text rows. On larger screens each row pins to the top of the
 * screen and the next row slides up over it, like a stack of cards.
 */
export function EventsGrid() {
  return (
    <section>
      {events.map((event, i) => {
        const photoFirst = i % 2 === 0;
        return (
          <div
            key={event.name}
            style={{ zIndex: i + 1 }}
            className="relative grid md:sticky md:top-0 md:h-[min(100dvh,800px)] md:grid-cols-2"
          >
            <div className={clsx("relative aspect-[9/10] overflow-hidden md:aspect-auto", !photoFirst && "md:order-2")}>
              <Image src={event.image} alt={event.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>

            <div className="flex flex-col items-center justify-center bg-mist px-8 py-20 text-center">
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                transition={{ duration: 0.9, delay: 0.2, ease }}
              >
                <h3 className="text-h3 max-w-[240px]">{event.name}</h3>
                <div className="relative mt-5 h-[220px] w-[200px] overflow-hidden">
                  <Image src={event.thumb} alt="" fill sizes="200px" className="object-cover" />
                </div>
                <p className="mt-6 max-w-[300px]">{event.description}</p>
                <p className="mt-4 text-bronze">{event.schedule}</p>
              </motion.div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

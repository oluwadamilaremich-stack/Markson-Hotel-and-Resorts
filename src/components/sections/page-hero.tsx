"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { introDelay } from "@/lib/intro";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Full-bleed photo hero used at the top of most pages.
 * `pinned`: the hero stays put while the rest of the page slides up over it like a curtain
 * (the content after it must sit in a `relative z-10` wrapper; apply `bg-sand` where the
 * curtain should become opaque).
 */
export function PageHero({
  image,
  eyebrow,
  title,
  subtitle,
  pinned = false,
  fullViewport = false,
  mobileFullViewport = false,
  children,
}: {
  image: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  pinned?: boolean;
  fullViewport?: boolean;
  mobileFullViewport?: boolean;
  children?: ReactNode;
}) {
  // On a page load that plays the intro, start the entrance as the intro fades out.
  const [wait] = useState(introDelay);

  return (
    <section
      data-photo-hero
      className={clsx(
        "relative flex items-center justify-center overflow-hidden text-center text-white",
        pinned
          ? clsx(
              "sticky top-0",
              mobileFullViewport
                ? "h-svh md:h-[max(560px,min(730px,100svh))]"
                : fullViewport
                  ? "h-[370px] md:h-svh"
                  : "h-[370px] md:h-[max(560px,min(730px,100svh))]",
            )
          : "h-[370px] md:h-[max(560px,min(730px,100svh))]",
      )}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, delay: wait, ease }}
      >
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-black/45" />

      <div className="px-site relative z-10 mx-auto flex max-w-[1180px] flex-col items-center pt-16">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: wait + 0.2, ease }}
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          className="text-display mt-3"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: wait + 0.3, ease }}
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            className="text-lead mt-5 max-w-[560px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: wait + 0.5, ease }}
          >
            {subtitle}
          </motion.p>
        )}
        {children && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: wait + 0.7, ease }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}

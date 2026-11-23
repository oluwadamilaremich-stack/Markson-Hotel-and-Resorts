"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Monogram } from "@/components/ui/section";

const photos = [
  {
    src: "/images/about/banner.webp",
    className: "right-[20px] top-[900px] xl:right-[5.6%] xl:top-[900px]",
  },
  {
    src: "/images/about/story-2.webp",
    className: "left-[20px] top-[1080px] xl:left-0 xl:top-[1053px]",
  },
  {
    src: "/images/about/story-3.webp",
    className: "right-[20px] top-[1350px] xl:right-0 xl:top-[1443px]",
  },
  {
    src: "/images/about/story-1.webp",
    className: "left-[20px] top-[1620px] xl:left-[3%] xl:top-[1703px]",
  },
  {
    src: "/images/about/value-2.webp",
    className: "right-[20px] top-[1890px] xl:right-[5.6%] xl:top-[2106px]",
  },
];

export function AboutIntro({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const y = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : -360, 0]);

  return (
    <section
      ref={ref}
      className="relative flex h-[300px] items-center justify-center overflow-x-clip px-site xl:block xl:h-[2172px] xl:flow-root"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden h-full max-w-[1515px] xl:block">
        {photos.map((photo) => (
          <motion.div
            key={photo.src}
            style={{ y }}
            className={`absolute aspect-[5/6] w-[min(42vw,160px)] overflow-hidden md:w-[min(35vw,220px)] xl:w-[300px] ${photo.className}`}
          >
            <Image src={photo.src} alt="" fill sizes="(min-width: 1280px) 300px, 80vw" className="object-cover" />
          </motion.div>
        ))}
      </div>

      <div className="mx-auto flex w-[min(400px,100%)] flex-col items-center text-center xl:sticky xl:top-[368px] xl:mt-[368px]">
        <Monogram size={32} className="xl:h-[39px] xl:w-10" />
        <p className="mt-8 max-w-[250px] text-tiny md:max-w-[400px] md:text-small xl:mt-12 xl:text-base">{text}</p>
      </div>
    </section>
  );
}

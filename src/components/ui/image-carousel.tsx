"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

/**
 * Photo slider shared by the home gallery and room pages: autoplay, drag/swipe, arrows, dots,
 * and mouse wheel / trackpad over it moves the photos.
 */
export function ImageCarousel({ images }: { images: readonly { src: string; alt: string }[] }) {
  // No loop, so the wheel has a first and last photo to hand control back to the page.
  const [emblaRef, embla] = useEmblaCarousel({ align: "center" }, [
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  // Mouse wheel / trackpad over the gallery moves the photos. At the first or last
  // photo the event is left alone, so the page carries on scrolling as normal.
  useEffect(() => {
    if (!embla) return;
    const root = embla.rootNode();
    let locked = false;
    let unlockTimer: ReturnType<typeof setTimeout>;

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      const forward = delta > 0;
      if (forward ? !embla.canScrollNext() : !embla.canScrollPrev()) return;

      e.preventDefault();
      if (locked || Math.abs(delta) < 4) return;
      locked = true;
      if (forward) embla.scrollNext();
      else embla.scrollPrev();
      // One photo per wheel gesture; trackpads fire many small events per swipe.
      unlockTimer = setTimeout(() => (locked = false), 650);
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      root.removeEventListener("wheel", onWheel);
      clearTimeout(unlockTimer);
    };
  }, [embla]);

  const prev = useCallback(() => {
    if (!embla) return;
    if (embla.canScrollPrev()) embla.scrollPrev();
    else embla.scrollTo(embla.scrollSnapList().length - 1);
  }, [embla]);
  const next = useCallback(() => {
    if (!embla) return;
    if (embla.canScrollNext()) embla.scrollNext();
    else embla.scrollTo(0);
  }, [embla]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {images.map((img, i) => (
            <div
              key={img.src}
              className="relative aspect-[4/3] min-w-0 flex-[0_0_100%] overflow-hidden md:ml-10 md:aspect-[5/4] md:flex-[0_0_60%] lg:flex-[0_0_41.6%]"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 1024px) 42vw, 82vw"
                className={clsx(
                  "object-cover transition-transform duration-[1.2s] ease-soft",
                  selected === i ? "scale-100" : "scale-110",
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={prev}
        aria-label="Previous photo"
        className="absolute top-1/2 left-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition-colors hover:bg-ink md:left-5 md:size-10 md:bg-ink/50"
      >
        <ArrowLeft className="size-4 md:size-5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next photo"
        className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition-colors hover:bg-ink md:right-5 md:size-10 md:bg-ink/50"
      >
        <ArrowRight className="size-4 md:size-5" strokeWidth={1.5} />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 md:bottom-6">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            aria-label={`Go to photo ${i + 1}`}
            onClick={() => embla?.scrollTo(i)}
            className={clsx(
              "size-2 rounded-full transition-colors",
              selected === i ? "bg-white" : "bg-white/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}

import Image from "next/image";
import clsx from "clsx";
import type { ReactNode } from "react";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("text-teal", className)}>{children}</p>;
}

/** Thin rule with a small diamond in the middle, used between home sections. */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={clsx("px-site relative mx-auto max-w-site", className)} aria-hidden>
      <div className="h-px bg-linear-to-r from-transparent via-line to-transparent" />
      <span className="absolute top-1/2 left-1/2 size-3 -translate-1/2 rotate-45 border border-line bg-sand" />
    </div>
  );
}

export function Monogram({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/images/brand/monogram.webp"
      alt=""
      width={size}
      height={Math.round((size * 110) / 114)}
      className={className}
    />
  );
}

/** Soft blurred palm-leaf shadow that sits behind light sections. */
export function PalmShadow({ className }: { className?: string }) {
  return (
    <Image
      src="/images/brand/palm-shadow.webp"
      alt=""
      width={803}
      height={674}
      aria-hidden
      className={clsx("pointer-events-none absolute opacity-[0.12] select-none", className)}
    />
  );
}

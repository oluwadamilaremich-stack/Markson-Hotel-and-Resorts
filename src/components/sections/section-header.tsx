import clsx from "clsx";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

/**
 * Eyebrow + heading + intro, with an optional action on the right (or below when centered).
 * `align="center-md"` is left-aligned on phones and centered from tablets up.
 */
export function SectionHeader({
  eyebrow,
  title,
  intro,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  action?: ReactNode;
  align?: "left" | "center" | "center-md";
  className?: string;
}) {
  const centered = align !== "left";
  const md = align === "center-md";

  return (
    <div
      className={clsx(
        "flex gap-8",
        !centered && "flex-col md:flex-row md:items-end md:justify-between",
        align === "center" && "flex-col items-center text-center",
        md && "flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div
        className={clsx(
          align === "center" && "flex flex-col items-center",
          md && "md:flex md:flex-col md:items-center",
        )}
      >
        {eyebrow && (
          <Reveal y={10}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
        )}
        <Reveal y={10} delay={0.05}>
          <h2 className={clsx("text-h2 mt-5", centered && "max-w-[600px]")}>{title}</h2>
          {intro && (
            <p className={clsx("mt-5", centered ? "max-w-[420px]" : "max-w-[400px]")}>{intro}</p>
          )}
        </Reveal>
      </div>
      {action && (
        <Reveal y={20} delay={0.1} className="shrink-0">
          {action}
        </Reveal>
      )}
    </div>
  );
}

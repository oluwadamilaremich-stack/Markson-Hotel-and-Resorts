import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "outline" | "light" | "dark";

// `hover` is the fill that fades in behind the label (none for light buttons, which keep their color).
const variants: Record<Variant, { base: string; hover?: string; hoverText?: string }> = {
  outline: { base: "border border-ink text-ink", hover: "bg-ink", hoverText: "text-sand" },
  light: { base: "bg-sand text-ink" },
  dark: { base: "bg-ink text-sand", hover: "bg-teal" },
};

export function buttonClasses(variant: Variant = "outline", className?: string) {
  return clsx(
    "group relative inline-flex items-center justify-center overflow-hidden px-6 py-3 text-lead disabled:pointer-events-none disabled:opacity-50",
    variants[variant].base,
    className,
  );
}

/**
 * Hover (as on the reference site): the label slides up and fades out while a copy rises from
 * below and fades in; outline buttons also fade to a dark fill.
 */
function ButtonInner({ variant = "outline", children }: { variant?: Variant; children: ReactNode }) {
  const v = variants[variant];
  const move = "flex items-center gap-2 transition-[translate,opacity] duration-300 ease-soft";
  return (
    <>
      {v.hover && (
        <span
          aria-hidden
          className={clsx(
            "absolute inset-0 opacity-0 transition-opacity duration-300 ease-soft group-hover:opacity-100 group-focus-visible:opacity-100",
            v.hover,
          )}
        />
      )}
      <span className="relative inline-flex">
        <span className={clsx(move, "group-hover:-translate-y-full group-hover:opacity-0 group-focus-visible:-translate-y-full group-focus-visible:opacity-0")}>
          {children}
        </span>
        <span
          aria-hidden
          className={clsx(
            move,
            "absolute inset-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
            v.hoverText,
          )}
        >
          {children}
        </span>
      </span>
    </>
  );
}

export function LinkButton({
  variant,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link className={buttonClasses(variant, className)} {...props}>
      <ButtonInner variant={variant}>{children}</ButtonInner>
    </Link>
  );
}

export function Button({
  variant,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button className={buttonClasses(variant, className)} {...props}>
      <ButtonInner variant={variant}>{children}</ButtonInner>
    </button>
  );
}

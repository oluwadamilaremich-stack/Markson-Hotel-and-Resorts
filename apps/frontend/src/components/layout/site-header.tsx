"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { mainNav, site } from "@/lib/site";
import { HomeIntroLink } from "./home-intro-link";
import { playIntro } from "@/lib/intro";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Hide while scrolling down, bring back as soon as the visitor scrolls up.
      setHidden(y > 240 && y > lastY);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  // Only pages with a full-bleed photo hero require white text at the top
  const pagesWithHero = ["/", "/rooms", "/about", "/events", "/services"];
  const hasPhotoHero =
    pagesWithHero.includes(pathname) || pathname.startsWith("/rooms/");

  const isOverHero = hasPhotoHero && !scrolled && !menuOpen;

  return (
    <>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 border-b transition-[translate,background-color,color,border-color] duration-500 ease-soft",
          isOverHero
            ? "border-transparent bg-transparent text-white"
            : "border-line bg-sand text-ink",
          menuOpen && "border-transparent bg-sand text-ink",
          hidden && !menuOpen && "-translate-y-full",
        )}
      >
        <div className="px-site mx-auto grid h-[76px] max-w-site grid-cols-[1fr_auto_1fr] items-center gap-6">
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100",
                  pathname.startsWith(item.href) && "after:scale-x-100",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <span className="lg:hidden" />

          <HomeIntroLink
            aria-label={`${site.name} home`}
            onClick={() => setMenuPath(null)}
            className="relative z-10 block h-9 w-[132px]"
          >
            <Image
              src="/images/brand/logo-light.webp"
              alt=""
              fill
              priority
              sizes="132px"
              className={clsx(
                "object-contain transition-opacity duration-500",
                isOverHero ? "opacity-100" : "opacity-0",
              )}
            />
            <Image
              src="/images/brand/logo-dark.webp"
              alt=""
              fill
              priority
              sizes="132px"
              className={clsx(
                "object-contain transition-opacity duration-500",
                isOverHero ? "opacity-0" : "opacity-100",
              )}
            />
          </HomeIntroLink>

          <div className="flex items-center justify-end">
            <span className="hidden items-center gap-2 xl:flex">
              <MapPin className="size-4 fill-current stroke-transparent" />
              {site.location}
            </span>
            <span className="mx-8 hidden h-7 w-px bg-current opacity-20 xl:block" />
            <a href={site.phoneHref} className="hidden items-center gap-2 lg:flex" aria-label={`Call ${site.phone}`}>
              <Phone className="size-4 fill-current stroke-transparent" />
              {site.phone}
            </a>

            <button
              type="button"
              className="-mr-2 p-2 lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuPath(menuOpen ? null : pathname)}
            >
              {menuOpen ? <X className="size-7" strokeWidth={1} /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-sand pt-[76px] lg:hidden"
          >
            <nav className="px-site flex flex-col gap-2 py-10" aria-label="Mobile">
              {[{ label: "Home", href: "/" }, ...mainNav].map((item, i) => {
                const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                  >
                    {/* Same hover as the "Stay your Way" room names (also on tap): nudge right + a line draws out */}
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className="group flex items-center gap-6 py-2"
                      onClick={(event) => {
                        if (
                          item.href === "/" &&
                          pathname !== "/" &&
                          event.button === 0 &&
                          !event.metaKey &&
                          !event.ctrlKey &&
                          !event.shiftKey &&
                          !event.altKey
                        ) {
                          playIntro();
                        }
                        setMenuPath(null);
                      }}
                    >
                      <span
                        className={clsx(
                          "text-h3 shrink-0 transition-transform duration-500 ease-soft group-hover:translate-x-5 group-active:translate-x-5",
                          current && "translate-x-5",
                        )}
                      >
                        {item.label}
                      </span>
                      <span
                        className={clsx(
                          "h-px flex-1 origin-left bg-ink/30 transition-transform duration-500 ease-soft group-hover:scale-x-100 group-active:scale-x-100",
                          current ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Two thin lines, as in the reference's phone header. */
function MenuIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden>
      <path d="M4 12h24M4 20h24" />
    </svg>
  );
}

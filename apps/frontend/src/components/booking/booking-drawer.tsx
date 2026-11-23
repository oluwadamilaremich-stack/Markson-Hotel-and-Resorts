"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Room } from "@/content/rooms";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking/booking-form";
import { Monogram } from "@/components/ui/section";

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function BookingDrawer({
  room,
  triggerLabel = "Book a Stay",
  triggerClassName,
}: {
  room: Room;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeToMount, getClientSnapshot, getServerSnapshot);
  const [today, setToday] = useState("");
  const [formSession, setFormSession] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  function showDrawer() {
    setToday(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date()));
    setFormSession((session) => session + 1);
    setOpen(true);
  }

  function hideDrawer() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousRootOverscroll = root.style.overscrollBehavior;
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        hideDrawer();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      root.style.overflow = previousRootOverflow;
      root.style.overscrollBehavior = previousRootOverscroll;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  return (
    <>
      <Button type="button" onClick={showDrawer} className={triggerClassName}>
        {triggerLabel}
      </Button>

      {mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-[70] overscroll-contain transition-[opacity,visibility] duration-500 ${
              open ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
            }`}
            aria-hidden={!open}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) hideDrawer();
            }}
          >
            <div className="absolute inset-0 bg-ink/35 backdrop-blur-sm" />
            <section
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-drawer-title"
              className={`absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col overscroll-contain bg-sand shadow-2xl transition-transform duration-500 ease-soft ${
                open ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <header className="flex shrink-0 items-center justify-between bg-ink px-5 py-5 text-sand md:px-8 md:py-6">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-sand">
                    <Monogram size={27} />
                  </span>
                  <div>
                    <h2 id="booking-drawer-title" className="text-h4">Your Stay</h2>
                    <p className="text-tiny uppercase tracking-[0.18em] text-tan-light">Booking summary</p>
                  </div>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={hideDrawer}
                  aria-label="Close booking summary"
                  className="flex size-11 items-center justify-center rounded-full border border-sand/20 transition-colors hover:bg-sand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
                >
                  <X className="size-5" strokeWidth={1.5} />
                </button>
              </header>

              <BookingForm
                key={formSession}
                rooms={[room]}
                initialRoomSlug={room.slug}
                today={today}
                layout="drawer"
              />
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { PageIntro } from "@/components/sections/page-intro";
import { EventsGrid } from "@/components/sections/events-grid";

export const metadata: Metadata = {
  title: "Special Events",
  description:
    "Seaside weddings, welcome cocktails, sunrise yoga and beach bonfire nights at Markson Hotels & Resorts.",
};

export default function EventsPage() {
  return (
    <>
      <PageHero image="/images/events/hero.webp" eyebrow="Special Events" title="Celebrate by the Sea" pinned />

      <div className="relative z-10 bg-sand">
        <PageIntro>
          Create unforgettable moments against the backdrop of sweeping ocean views and impeccable
          service, perfect for celebrations of every scale.
        </PageIntro>
        <EventsGrid />
      </div>
    </>
  );
}

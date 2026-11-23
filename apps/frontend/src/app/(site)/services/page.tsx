import type { Metadata } from "next";
import Image from "next/image";
import clsx from "clsx";
import { services } from "@/content/hotel";
import { PageHero } from "@/components/sections/page-hero";
import { PageIntro } from "@/components/sections/page-intro";
import { ServiceIcon } from "@/components/services/service-icon";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Services & Amenities",
  description:
    "Spa treatments, oceanfront dining, sunset cocktails, private beach access and a 24-hour fitness centre at Markson Hotels & Resorts.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        image="/images/services/hero.webp"
        eyebrow="Services & Amenities"
        title="Experience Paradise"
        pinned
      />

      <div className="relative z-10 bg-sand">
        <PageIntro>
          Indulge in coastal luxury with our carefully curated experiences and premier facilities
          designed to elevate your stay from ordinary to extraordinary.
        </PageIntro>

        <section className="px-site mx-auto max-w-site space-y-14 pb-24 md:space-y-10 md:pb-32">
          {services.map((service, i) => {
            const imageRight = i % 2 === 1;
            return (
              <div key={service.slug} className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
                <Reveal className={clsx("relative aspect-[648/480] overflow-hidden", imageRight && "md:order-2")}>
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </Reveal>
                <Reveal delay={0.1} className={clsx(imageRight ? "md:pl-10" : "md:pl-0")}>
                  <ServiceIcon name={service.icon} className="size-9" />
                  <h2 className="text-h3 mt-6 md:mt-10">{service.name}</h2>
                  <p className="mt-4 max-w-[380px] md:mt-8">{service.description}</p>
                </Reveal>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}

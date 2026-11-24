import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { LightPageHeader } from "@/components/sections/light-page-header";
import { FaqSection } from "@/components/sections/faq-section";
import { ContactForm } from "@/components/contact/contact-form";
import { Divider } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reservations, events and guest services at Markson Hotels & Resorts, Lagos.",
};

const groups = [
  {
    title: "Location",
    Icon: MapPin,
    items: [
      {
        label: null,
        value: site.address,
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.name}, ${site.address}`)}`,
      },
    ],
  },
  {
    title: "Phone",
    Icon: Phone,
    items: [
      { label: "Reservations & Inquiries:", value: site.phone, href: site.phoneHref },
      { label: "Concierge & Guest Services:", value: site.phone, href: site.phoneHref },
    ],
  },
  {
    title: "Email",
    Icon: Mail,
    items: [
      { label: "General Info", value: site.emails.general, href: `mailto:${site.emails.general}` },
      { label: "Bookings", value: site.emails.bookings, href: `mailto:${site.emails.bookings}` },
      { label: "Events", value: site.emails.events, href: `mailto:${site.emails.events}` },
    ],
  },
];

export default function ContactPage() {
  return (
    <>
      <LightPageHeader
        eyebrow="Contact Us"
        title="Get In Touch"
        intro="Your perfect beachside escape is just a message away – our dedicated team is standing by to craft your personalized coastal experience."
      />

      <Divider className="mt-20 md:mt-24" />

      <section className="px-site mx-auto grid max-w-site gap-14 py-20 md:grid-cols-2 md:gap-10 md:py-24">
        <div>
          <Reveal y={10}>
            <h2 className="text-h2 max-w-[460px]">{site.name}</h2>
          </Reveal>
          <div className="mt-10 space-y-8">
            {groups.map(({ title, Icon, items }, i) => (
              <Reveal key={title} y={20} delay={0.05 * i}>
                <p className="text-lead flex items-center gap-2">
                  <Icon className="size-4" strokeWidth={1.25} /> {title}
                </p>
                <ul className="mt-3 space-y-3">
                  {items.map((item) => (
                    <li key={item.label ?? item.value}>
                      {item.label && <p>{item.label}</p>}
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                        className="inline-flex items-center gap-1 break-all underline-offset-4 hover:text-teal hover:underline"
                      >
                        {item.value}
                        <ArrowUpRight className="size-3.5 shrink-0" strokeWidth={1.25} />
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="border border-line p-6 md:p-16">
          <ContactForm />
        </Reveal>
      </section>

      <Divider />
      <FaqSection showEyebrow={false} />
    </>
  );
}

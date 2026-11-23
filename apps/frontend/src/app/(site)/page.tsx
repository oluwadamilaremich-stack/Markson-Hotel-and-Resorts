import { getPosts, getRooms } from "@/lib/data";
import { LinkButton } from "@/components/ui/button";
import { Divider } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeader } from "@/components/sections/section-header";
import { EventsGrid } from "@/components/sections/events-grid";
import { FaqSection } from "@/components/sections/faq-section";
import { ContactCta } from "@/components/sections/contact-cta";
import { Welcome } from "@/components/home/welcome";
import { PhotoGallery } from "@/components/home/photo-gallery";
import { RoomsShowcase } from "@/components/home/rooms-showcase";
import { ServicesSlider } from "@/components/home/services-slider";
import { Testimonials } from "@/components/home/testimonials";
import { BlogCard } from "@/components/blog/blog-card";

export default async function HomePage() {
  const [rooms, posts] = await Promise.all([getRooms(), getPosts()]);

  return (
    <>
      <PageHero
        image="/images/home/hero.webp"
        title="Your Home By The Ocean"
        subtitle="Experience sun-kissed shores, luxurious stays, and unforgettable memories at Markson"
        pinned
        mobileFullViewport
      >
        <LinkButton href="/rooms" variant="light">
          Explore Rooms
        </LinkButton>
      </PageHero>

      {/* Everything below slides up over the pinned hero */}
      <div className="relative z-10 bg-sand">
        <Welcome />
        <PhotoGallery />
        <RoomsShowcase rooms={rooms} />
        <Divider />
        <ServicesSlider />
        <Divider />

        <section className="pt-24 md:pt-32">
          <SectionHeader
            align="center-md"
            eyebrow="Special Events"
            title="Celebrate by the Sea"
            intro="Create unforgettable moments against the backdrop of sweeping ocean views and impeccable service, perfect for celebrations of every scale."
            action={<LinkButton href="/events">Explore All Events</LinkButton>}
            className="px-site mb-16 md:mb-24"
          />
          <EventsGrid />
        </section>

        <Testimonials />
        <Divider />

        <section className="px-site mx-auto max-w-site py-24 md:py-28">
          <SectionHeader
            eyebrow="Blog / News"
            title="Markson Stories"
            intro="Stay updated with seasonal offers, local tips, and coastal luxury highlights."
            action={<LinkButton href="/blog">Read All</LinkButton>}
          />
          <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {posts.slice(0, 3).map((post, i) => (
              <Reveal key={post.slug} delay={i * 0.1}>
                <BlogCard post={post} />
              </Reveal>
            ))}
          </div>
        </section>

        <Divider />
        <FaqSection />
        <ContactCta />
      </div>
    </>
  );
}

import { gallery } from "@/content/hotel";
import { SectionHeader } from "@/components/sections/section-header";
import { ImageCarousel } from "@/components/ui/image-carousel";

export function PhotoGallery() {
  return (
    <section className="py-24 md:py-28">
      <SectionHeader
        align="center-md"
        eyebrow="Photo Gallery"
        title="Markson Moments Captured"
        className="px-site"
      />
      <div className="mt-10 md:mt-16">
        <ImageCarousel images={gallery} />
      </div>
    </section>
  );
}

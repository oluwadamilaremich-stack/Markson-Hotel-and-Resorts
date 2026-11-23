import Image from "next/image";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function ContactCta() {
  return (
    <section className="relative flex min-h-[440px] items-center md:min-h-[600px] justify-center overflow-hidden text-center text-white">
      <Image src="/images/home/contact-bg.webp" alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-black/25" />
      <Reveal className="relative flex flex-col items-center px-6">
        <h2 className="text-display">Get In Touch</h2>
        <p className="mt-5 max-w-[400px]">
          Your perfect beachside escape is just a message away – our dedicated team is standing
          by to craft your personalized coastal experience.
        </p>
        <LinkButton href="/contact" variant="light" className="mt-8">
          Contact Us
        </LinkButton>
      </Reveal>
    </section>
  );
}

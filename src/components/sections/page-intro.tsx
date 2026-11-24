import { Reveal } from "@/components/ui/reveal";

/** Short centred paragraph that opens a page, right below its hero. */
export function PageIntro({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-site py-24 md:py-[100px]">
      <Reveal y={10} className="mx-auto max-w-[400px] text-center">
        <p>{children}</p>
      </Reveal>
    </section>
  );
}

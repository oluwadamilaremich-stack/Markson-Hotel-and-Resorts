import Image from "next/image";
/**
 * Loading intro (as on the reference site): a line draws across, the monogram and wordmark
 * rise in, the lockup shrinks away, then the cream screen fades to reveal the page.
 */
export function IntroScreen() {
  return (
    <>
      {/* Whether it plays is decided by introScript (lib/intro.ts), run from the root layout's <head> */}
      <div id="intro" aria-hidden className="intro-screen fixed inset-0 z-[100] flex items-center justify-center bg-sand">
        <div className="intro-lockup flex flex-col items-center">
          <Image
            src="/images/brand/monogram.webp"
            alt=""
            width={36}
            height={35}
            priority
            className="intro-monogram"
          />
          <span className="intro-line mt-4 h-px w-40 bg-ink/60" />
          <Image
            src="/images/brand/logo-dark.webp"
            alt=""
            width={128}
            height={30}
            priority
            className="intro-wordmark mt-4"
          />
        </div>
      </div>
    </>
  );
}

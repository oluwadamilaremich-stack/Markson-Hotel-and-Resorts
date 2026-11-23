import Image from "next/image";
import Link from "next/link";
import { footerNav, site } from "@/lib/site";
import { Monogram, PalmShadow } from "@/components/ui/section";
import { NewsletterForm } from "./newsletter-form";
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from "./social-icons";
import { HomeIntroLink } from "./home-intro-link";

const socials = [
  { label: "Facebook", href: site.socials.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: site.socials.instagram, Icon: InstagramIcon },
  { label: "YouTube", href: site.socials.youtube, Icon: YouTubeIcon },
  { label: "TikTok", href: site.socials.tiktok, Icon: TikTokIcon },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-line">
      {/* Only the palm shadows are clipped; the badge must overlap the section above. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <PalmShadow className="-bottom-40 -left-40 w-[560px] rotate-12" />
        <PalmShadow className="-right-40 -bottom-56 w-[560px] -scale-x-100" />
      </div>
      <div className="absolute top-0 left-1/2 z-10 flex size-20 -translate-1/2 items-center justify-center rounded-full border border-line bg-sand">
        <Monogram size={30} />
      </div>

      <div className="relative mx-auto max-w-site px-5 pt-24 sm:px-10">
        <HomeIntroLink className="mx-auto block w-fit" aria-label={`${site.name} home`}>
          <Image src="/images/brand/logo-dark.webp" alt={site.name} width={194} height={45} />
        </HomeIntroLink>

        <div className="mt-20 grid grid-cols-3 gap-x-4 gap-y-14 md:grid-cols-[1fr_1fr_1fr_1.3fr] md:gap-x-6">
          {footerNav.map((col, i) => (
            <div key={i}>
              <p className="text-tiny text-tan">{col.title}</p>
              <ul className="mt-6 space-y-5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-teal">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-3 md:col-span-1">
            <p className="text-tiny text-tan">Stay up to date</p>
            <ul className="mt-5 flex gap-6">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} aria-label={label} className="block transition-colors hover:text-teal">
                    <Icon className="size-6" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-14 text-tiny text-tan">Subscribe to Newsletter</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-20 border-t border-line py-10 text-center">
          {site.copyrightYear} © All right reserved
        </div>
      </div>
    </footer>
  );
}

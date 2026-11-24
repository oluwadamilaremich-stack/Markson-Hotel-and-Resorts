import type { Metadata } from "next";
import { Bricolage_Grotesque, Playfair_Display } from "next/font/google";
import { site } from "@/lib/site";
import { introScript } from "@/lib/intro";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://marksonhotel.com"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: `${site.name} | ${site.location}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: site.name,
    title: `${site.name} | ${site.location}`,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.location}`,
    description: site.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the intro script sets data-intro on <html> before React hydrates
    <html lang="en" className={`${playfair.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        {/* Decides before the first paint whether the loading intro plays (see lib/intro.ts) */}
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

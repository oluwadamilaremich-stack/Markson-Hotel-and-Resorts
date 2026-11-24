import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NotFoundContent } from "@/components/sections/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

// Any address that doesn't match a page. It sits outside the (site) group, so it brings
// the header and footer itself.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}

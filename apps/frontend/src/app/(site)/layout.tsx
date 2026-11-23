import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { IntroScreen } from "@/components/layout/intro-screen";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={null}>
        <IntroScreen />
      </Suspense>
      <Suspense fallback={<header className="h-20" />}>
        <SiteHeader />
      </Suspense>
      <main>{children}</main>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </>
  );
}

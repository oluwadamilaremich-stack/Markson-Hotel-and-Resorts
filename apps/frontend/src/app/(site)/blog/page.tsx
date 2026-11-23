import type { Metadata } from "next";
import { getPosts } from "@/lib/data";
import { LightPageHeader } from "@/components/sections/light-page-header";
import { BlogList } from "@/components/blog/blog-list";

export const metadata: Metadata = {
  title: "Blog & News",
  description:
    "Seasonal offerings, local insights, and behind-the-scenes glimpses into coastal luxury at Markson.",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <LightPageHeader
        eyebrow="Blog / News"
        title="Markson Stories"
        intro="Stay current with seasonal offerings, local insights, and behind-the-scenes glimpses into coastal luxury at its finest."
      />
      <section className="px-site mx-auto max-w-site py-20 md:py-24">
        <BlogList posts={posts} />
      </section>
    </>
  );
}

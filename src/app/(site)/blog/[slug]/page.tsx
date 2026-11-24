import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { LightPageHeader } from "@/components/sections/light-page-header";
import { LinkButton } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  return (
    <article>
      <LightPageHeader
        eyebrow={<span className="text-tan">{formatDate(post.date)}</span>}
        title={post.title}
        intro={post.excerpt}
        titleClassName="text-h2 md:text-[64px] md:leading-[1.2]"
      />

      <Reveal className="px-site mx-auto mt-14 max-w-[1240px] md:mt-16">
        <div className="relative aspect-[1136/634] overflow-hidden">
          <Image
            src={post.heroImage ?? post.image}
            alt=""
            fill
            priority
            sizes="(min-width: 1240px) 1136px, 100vw"
            className="object-cover"
          />
        </div>
      </Reveal>

      <div className="px-site mx-auto max-w-[800px] space-y-6 py-16 md:py-20">
        {post.body.map((paragraph) => {
          // "Heading|Text" paragraphs get a bold lead-in line
          const [lead, text] = paragraph.includes("|") ? paragraph.split("|") : [null, paragraph];
          return (
            <Reveal key={paragraph} y={20}>
              <p>
                {lead && (
                  <>
                    <strong className="font-semibold">{lead}</strong>
                    <br />
                  </>
                )}
                {text}
              </p>
            </Reveal>
          );
        })}

        <div className="flex justify-center pt-10">
          <LinkButton href="/blog">All Articles</LinkButton>
        </div>
      </div>
    </article>
  );
}

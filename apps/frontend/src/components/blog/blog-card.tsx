import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Post } from "@/content/posts";
import { formatDate } from "@/lib/format";

export function BlogCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="text-h4 mt-6 transition-colors group-hover:text-teal">{post.title}</h3>
      <p className="mt-4">{post.excerpt}</p>
      <p className="text-small mt-4 flex items-center gap-2">
        <CalendarDays className="size-4" strokeWidth={1.25} />
        {formatDate(post.date)}
      </p>
    </Link>
  );
}

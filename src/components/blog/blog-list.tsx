"use client";

import { useState } from "react";
import type { Post } from "@/content/posts";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { BlogCard } from "./blog-card";

const PAGE = 6;

/** Article grid with a "Show More" button once there are more than six posts. */
export function BlogList({ posts }: { posts: Post[] }) {
  const [count, setCount] = useState(PAGE);

  return (
    <>
      <div className="grid gap-12 md:grid-cols-3 md:gap-x-10 md:gap-y-16">
        {posts.slice(0, count).map((post, i) => (
          <Reveal key={post.slug} delay={(i % 3) * 0.1}>
            <BlogCard post={post} />
          </Reveal>
        ))}
      </div>
      {count < posts.length && (
        <div className="mt-16 flex justify-center">
          <Button onClick={() => setCount((c) => c + PAGE)}>Show More</Button>
        </div>
      )}
    </>
  );
}

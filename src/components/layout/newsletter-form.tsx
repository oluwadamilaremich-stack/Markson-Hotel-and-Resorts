"use client";

import { useState, type FormEvent } from "react";

export function NewsletterForm() {
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = event.currentTarget;
    const input = form.elements.namedItem("newsletter-email") as HTMLInputElement | null;
    const email = input?.value?.trim();

    if (!email) {
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setDone(true);
      }
    } catch (error) {
      console.error("[Newsletter] Subscription error:", error);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <p className="mt-4 text-teal">Thank you for subscribing!</p>;
  }

  return (
    <form className="mt-4 flex" onSubmit={handleSubscribe}>
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="newsletter-email"
        type="email"
        required
        disabled={pending}
        placeholder="Enter your email"
        className="min-w-0 flex-1 border border-ink bg-transparent px-3 py-2.5 text-small outline-none placeholder:text-ink/40 focus:border-teal disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-6 text-sand transition-colors hover:bg-teal disabled:opacity-50"
      >
        {pending ? "…" : "Subscribe"}
      </button>
    </form>
  );
}

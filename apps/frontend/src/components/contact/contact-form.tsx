"use client";

import { ChevronDown } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export const contactSubjects = [
  "Reservations",
  "Events & Weddings",
  "Spa & Dining",
  "General Inquiry",
  "Feedback",
] as const;

const field =
  "w-full border border-line bg-transparent px-3 py-2.5 outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not send your message. Please try again.");
        setPending(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
        <p className="text-h3">Thank you!</p>
        <p className="mt-3 max-w-[320px]">
          Your message has been received by our reservations team. We will get back to you promptly.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block">Name</span>
        <input name="name" required autoComplete="name" placeholder="Enter your name" className={field} />
      </label>
      <label className="block">
        <span className="mb-2 block">Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="Enter your email" className={field} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block">Subjects</span>
        <span className="relative block">
          <select name="subject" required defaultValue="" className={`${field} appearance-none pr-10 invalid:text-ink/35`}>
            <option value="" disabled>
              Select…
            </option>
            {contactSubjects.map((s) => (
              <option key={s} value={s} className="text-ink">
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" strokeWidth={1.25} />
        </span>
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block">Message</span>
        <textarea name="message" required rows={3} placeholder="Message" className={`${field} resize-y`} />
      </label>

      {error && (
        <p role="alert" className="border border-red-800/30 bg-red-50 px-4 py-3 text-small text-red-900 sm:col-span-2">
          {error}
        </p>
      )}

      <div className="flex justify-center pt-4 sm:col-span-2">
        <Button type="submit" variant="dark" disabled={pending} className="min-w-[200px] py-2.5">
          {pending ? "Sending…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}

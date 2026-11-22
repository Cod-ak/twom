"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/actions/newsletter";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.set("email", email);

    startTransition(async () => {
      const res = await subscribeNewsletter(formData);
      if (res.error) {
        setFeedback({ error: res.error });
      } else {
        setFeedback({ success: res.message });
        setEmail("");
      }
    });
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch gap-3"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={isPending}
          className="bg-transparent border border-twom-border px-4 py-3 text-xs sm:text-sm text-twom-title placeholder:text-twom-muted/60 focus:outline-none focus:border-twom-title flex-1 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !email}
          className="bg-twom-dark text-white px-6 py-3 text-xs uppercase tracking-[0.2em] font-mono hover:bg-twom-muted transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isPending ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {feedback?.error && (
        <p className="text-xs text-rose-600 mt-2 font-mono">
          {feedback.error}
        </p>
      )}

      {feedback?.success && (
        <p className="text-xs text-emerald-700 mt-2 font-mono flex items-center gap-1.5 animate-fadeIn">
          <span>✓</span> {feedback.success}
        </p>
      )}
    </div>
  );
}

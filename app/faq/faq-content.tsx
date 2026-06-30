"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { site } from "@/lib/constants";
import { faqs, sections } from "./faq-data";

export function FAQContent() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <p>
        Answers to the most common questions about selling and buying digital products on Keevan Store. If you do not find what you are looking for, reach out via WhatsApp.
      </p>
      <div className="relative mt-6">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search FAQ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-sm focus:border-brand-green focus:outline-none"
        />
      </div>
      {filtered ? (
        <div className="mt-6 grid gap-4">
          <p className="text-sm text-neutral-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.map(({ q, a }) => (
            <section key={q} className="rounded-lg border border-neutral-200 p-5">
              <h3 className="text-xl font-bold text-brand-black">{q}</h3>
              <p className="mt-2">{a}</p>
            </section>
          ))}
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="text-2xl font-bold text-brand-black">{section.title}</h2>
            <div className="mt-4 grid gap-4">
              {faqs.slice(section.slice[0], section.slice[1]).map(({ q, a }) => (
                <section key={q} className="rounded-lg border border-neutral-200 p-5">
                  <h3 className="text-xl font-bold text-brand-black">{q}</h3>
                  <p className="mt-2">{a}</p>
                </section>
              ))}
            </div>
          </section>
        ))
      )}
      <section className="mt-12 rounded-lg bg-brand-green p-8 text-white text-center">
        <h2 className="text-2xl font-bold">Still have questions?</h2>
        <p className="mt-2 text-neutral-100">Our support team is ready to help you get started.</p>
        <div className="mt-6 flex justify-center gap-4">
          <ButtonLink href={site.supportWhatsApp} variant="dark">Chat on WhatsApp</ButtonLink>
          <ButtonLink href="/signup" variant="dark" icon>Create Your Free Store</ButtonLink>
        </div>
      </section>
    </>
  );
}

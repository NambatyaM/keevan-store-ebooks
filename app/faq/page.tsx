import { SimplePage } from "@/components/simple-page";

const faqs = [
  ["Do buyers need accounts?", "No. Buyers can pay and download securely without creating a Keevan Store account."],
  ["How do creators get paid?", "Keevan Store collects payments, records creator earnings, and creators request manual withdrawals."],
  ["What is the minimum withdrawal?", "The minimum withdrawal request is 50,000 UGX."],
  ["Which file formats are supported?", "PDF, EPUB, MOBI, and ZIP files are supported for digital products."]
];

export default function FAQPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer }
    }))
  };

  return (
    <SimplePage title="FAQ" eyebrow="Answers">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="grid gap-4">
        {faqs.map(([question, answer]) => (
          <section key={question} className="rounded-lg border border-neutral-200 p-5">
            <h2 className="text-xl font-bold text-brand-black">{question}</h2>
            <p className="mt-2">{answer}</p>
          </section>
        ))}
      </div>
    </SimplePage>
  );
}

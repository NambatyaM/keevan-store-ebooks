import { CheckCircle2 } from "lucide-react";
import { SimplePage } from "@/components/simple-page";

const items = [
  "Creator-owned store URLs and shareable product URLs",
  "PDF, EPUB, MOBI, and ZIP digital product uploads",
  "Pesapal checkout with automatic payment verification",
  "Secure signed download links after confirmed payment",
  "Creator analytics for views, purchases, revenue, and downloads",
  "Admin moderation, creator management, and withdrawal review"
];

export default function FeaturesPage() {
  return (
    <SimplePage title="Features" eyebrow="Built for direct e-book sales">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg border border-neutral-200 p-4">
            <CheckCircle2 className="mt-1 shrink-0 text-brand-green" size={19} aria-hidden />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}

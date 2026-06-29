import { MessageCircle } from "lucide-react";
import { site } from "@/lib/constants";

export function WhatsAppButton() {
  return (
    <a
      href={site.supportWhatsApp}
      className="focus-ring fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand-green text-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:bg-[#006f43] hover:shadow-lift animate-fade-in"
      aria-label="Contact Keevan Store on WhatsApp"
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={24} aria-hidden />
    </a>
  );
}

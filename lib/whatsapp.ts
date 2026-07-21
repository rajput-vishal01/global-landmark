import { COMPANY } from "@/lib/data";

// Env override for launch; falls back to the agency's real primary number
// from lib/data.ts — never a fake placeholder that could message a stranger.
const NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || COMPANY.phoneHref.replace(/\D/g, "");

export function whatsAppHref(message = "Hi"): string {
  return `https://wa.me/${NUMBER}?text=${encodeURIComponent(message)}`;
}

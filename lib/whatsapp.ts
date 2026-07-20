// ponytail: number comes from env with a placeholder default — replace
// NEXT_PUBLIC_WHATSAPP_NUMBER before launch.
const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890";

export function whatsAppHref(message = "Hi"): string {
  return `https://wa.me/${NUMBER}?text=${encodeURIComponent(message)}`;
}

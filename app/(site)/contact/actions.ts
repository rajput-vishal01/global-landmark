"use server";

import { headers } from "next/headers";
import { sendContactEmails, type InquiryData } from "@/lib/email";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { COMPANY } from "@/lib/data";

export type InquiryState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

const INTERESTS = new Set(["buy", "sell", "valuation", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  // Honeypot: real users never fill this hidden field.
  if (formData.get("company")) return { status: "sent" };

  // The form sends branded email to any address typed in — throttled per
  // connection, with a global cap that header spoofing cannot escape.
  if (isRateLimited("contact", clientIp(await headers()), 5, 100)) {
    return {
      status: "error",
      message:
        `Too many inquiries from this connection. Please try again later or email us directly at ${COMPANY.email}.`,
    };
  }

  const data: InquiryData = {
    name: String(formData.get("name") ?? "").trim().slice(0, 200),
    email: String(formData.get("email") ?? "").trim().slice(0, 200),
    phone: String(formData.get("phone") ?? "").trim().slice(0, 50),
    interest: String(formData.get("interest") ?? "other").trim(),
    message: String(formData.get("message") ?? "").trim().slice(0, 5000),
  };

  if (!data.name || !data.message || !EMAIL_RE.test(data.email)) {
    return {
      status: "error",
      message: "Please fill in your name, a valid email, and a message.",
    };
  }
  if (!INTERESTS.has(data.interest)) data.interest = "other";

  try {
    const sent = await sendContactEmails(data);
    if (!sent) {
      return {
        status: "error",
        message:
          `Our mail service is temporarily unavailable. Please email us directly at ${COMPANY.email}.`,
      };
    }
    return { status: "sent" };
  } catch (err) {
    console.error("Inquiry email failed:", err);
    return {
      status: "error",
      message:
        `Something went wrong sending your message. Please try again, or email us directly at ${COMPANY.email}.`,
    };
  }
}

"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { sendContactEmails, type InquiryData } from "@/lib/email";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { COMPANY } from "@/lib/data";

export type SellInquiryState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitSellInquiry(
  _prev: SellInquiryState,
  formData: FormData
): Promise<SellInquiryState> {
  // Honeypot: real users never fill this hidden field.
  if (formData.get("company")) return { status: "sent" };

  if (isRateLimited("sell", clientIp(await headers()), 5, 100)) {
    return {
      status: "error",
      message:
        `Too many submissions from this connection. Please try again later or email us directly at ${COMPANY.email}.`,
    };
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 50);
  const propertyType = String(formData.get("propertyType") ?? "").trim().slice(0, 200);
  const locality = String(formData.get("locality") ?? "").trim().slice(0, 200);
  const area = String(formData.get("area") ?? "").trim().slice(0, 100);
  const expectedPrice = String(formData.get("expectedPrice") ?? "").trim().slice(0, 100);
  const alreadyListed = formData.get("alreadyListed") === "on";
  const note = String(formData.get("message") ?? "").trim().slice(0, 5000);

  if (!name || !phone || !EMAIL_RE.test(email) || !propertyType || !locality) {
    return {
      status: "error",
      message: "Please fill in your name, phone, a valid email, property type, and locality.",
    };
  }

  // No dedicated columns for these on `leads` — fold into `message` as
  // formatted text so the admin sees the full picture in one field.
  const message = [
    `Property type: ${propertyType}`,
    `Locality: ${locality}`,
    area && `Approximate area: ${area}`,
    expectedPrice && `Expected price: ${expectedPrice}`,
    `Already listed elsewhere: ${alreadyListed ? "Yes" : "No"}`,
    note && `Message: ${note}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await db.insert(leads).values({
      name,
      email,
      phone,
      interest: "sell",
      message,
      source: "sell-page",
    });
  } catch (err) {
    console.error("Sell inquiry: lead persistence failed:", err);
    return {
      status: "error",
      message: "Something went wrong saving your submission. Please try again.",
    };
  }

  const data: InquiryData = { name, email, phone, interest: "sell", message };
  try {
    const sent = await sendContactEmails(data);
    if (!sent) {
      return {
        status: "error",
        message:
          "Your submission was received. Our mail service is temporarily unavailable, so we could not send a confirmation — we'll still be in touch.",
      };
    }
    return { status: "sent" };
  } catch (err) {
    console.error("Sell inquiry email failed (lead already saved):", err);
    return {
      status: "error",
      message: "Your submission was received, but the confirmation email failed to send.",
    };
  }
}

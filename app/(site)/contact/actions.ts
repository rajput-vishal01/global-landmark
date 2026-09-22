"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, properties } from "@/lib/db/schema";
import { sendContactEmails, type InquiryData } from "@/lib/email";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { COMPANY } from "@/lib/data";

export type InquiryState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

const INTERESTS = new Set(["buy", "sell", "valuation", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** IDs from the enquiry cart's hidden field — malformed input just means no properties, not an error. */
function parsePropertyIds(json: string): number[] {
  try {
    const raw: unknown = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function parseUtm(formData: FormData): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = String(formData.get(key) ?? "").trim().slice(0, 200);
    if (value) utm[key] = value;
  }
  return utm;
}

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

  // Phone, not email, is the required channel: email is optional on every
  // public form now, and a lead with neither is a lead nobody can answer.
  // An address that IS given still has to be a real one — a typo'd address
  // is worse than none, because it looks answerable and is not.
  if (!data.name || !data.phone || !data.message) {
    return {
      status: "error",
      message: "Please fill in your name, phone number, and a message.",
    };
  }
  if (data.email && !EMAIL_RE.test(data.email)) {
    return {
      status: "error",
      message: "That email address does not look right. Correct it or leave it blank.",
    };
  }
  if (!INTERESTS.has(data.interest)) data.interest = "other";

  // R-05's separate "cart path needs a phone" guard is gone: phone is now
  // required on every submission, so the cart case is covered by the check
  // above rather than by a second rule that could drift from it.
  const propertyIds = parsePropertyIds(String(formData.get("propertyIdsJson") ?? "[]"));
  const pageUrl = String(formData.get("pageUrl") ?? "").trim().slice(0, 500) || null;
  const source = String(formData.get("source") ?? "").trim().slice(0, 100) || null;
  const utm = parseUtm(formData);

  // Ref codes are internal (R-07) — this lookup runs server-side only, for
  // the transactional email's content, never returned to the client.
  if (propertyIds.length) {
    try {
      data.properties = await db
        .select({ refCode: properties.refCode, title: properties.title })
        .from(properties)
        .where(inArray(properties.id, propertyIds));
    } catch (err) {
      console.error("Inquiry: could not resolve shortlisted properties:", err);
    }
  }

  // Persist BEFORE sending mail — an SMTP outage must never lose a lead
  // (R-32). A failed insert is the one thing that still has to surface as
  // an error, since without a row there is genuinely no record at all.
  try {
    await db.insert(leads).values({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      interest: data.interest,
      message: data.message,
      propertyIds: propertyIds.length ? propertyIds : null,
      pageUrl,
      source,
      utm: Object.keys(utm).length ? utm : null,
    });
  } catch (err) {
    console.error("Inquiry: lead persistence failed:", err);
    return {
      status: "error",
      message: "Something went wrong saving your inquiry. Please try again.",
    };
  }

  // The saved lead is the record, so the visitor gets their answer now and
  // the mail goes out after the response: waiting on two Gmail sessions
  // held this form for 11s. A skip or failure is a `[mail]` log line.
  after(() => sendContactEmails(data));
  return { status: "sent" };
}

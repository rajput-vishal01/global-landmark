import nodemailer from "nodemailer";
import { resolveCompany } from "@/lib/site-settings";
import { SITE_URL } from "@/lib/seo";

type ResolvedCompany = Awaited<ReturnType<typeof resolveCompany>>;

export type InquiryData = {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  /** Set when the inquiry came from the enquiry cart (R-05) — every shortlisted property, ref code included. */
  properties?: { refCode: string | null; title: string }[];
};

const BRAND = {
  navy: "#14213d",
  gold: "#c9992e",
  goldDeep: "#8a5a22",
  cream: "#faf9f6",
  ink: "#141414",
  muted: "#646464",
  border: "#e2e0db",
};

function getTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Shared shell: cream background, navy header with serif wordmark, card body. */
function shell(bodyHtml: string, company: ResolvedCompany) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:${BRAND.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background-color:${BRAND.navy};padding:28px 32px;text-align:center;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:4px;color:${BRAND.cream};text-transform:uppercase;">${company.name}</span><br/>
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;color:${BRAND.gold};text-transform:uppercase;">${company.tagline}</span>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border:1px solid ${BRAND.border};border-top:none;padding:36px 32px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;text-align:center;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND.muted};">
              ${company.legalName} · ${company.addressLines.join(", ")}
            </span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailRows(data: InquiryData) {
  const rows: [string, string][] = [
    ["Name", data.name],
    ["Email", data.email || "Not provided"],
    ["Phone", data.phone || "Not provided"],
    ["Looking to", data.interest],
    ["Message", data.message],
  ];
  return rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.muted};padding:14px 0 4px;border-top:1px solid ${BRAND.border};">${label}</td>
      </tr>
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.ink};padding:0 0 14px;">${escapeHtml(value).replaceAll("\n", "<br/>")}</td>
      </tr>`
    )
    .join("");
}

function propertiesList(data: InquiryData) {
  if (!data.properties?.length) return "";
  const rows = data.properties
    .map(
      (p) => `
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};padding:6px 0;border-top:1px solid ${BRAND.border};">
          ${escapeHtml(p.title)}${p.refCode ? ` <span style="color:${BRAND.muted};">(${escapeHtml(p.refCode)})</span>` : ""}
        </td>
      </tr>`
    )
    .join("");
  return `
    <tr>
      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.muted};padding:14px 0 4px;border-top:1px solid ${BRAND.border};">
        Shortlisted properties (${data.properties.length})
      </td>
    </tr>
    ${rows}`;
}

function renderAdminEmail(data: InquiryData, company: ResolvedCompany) {
  // Email is optional on every public form, so the reply button follows
  // whichever channel the enquirer actually left. A bare `mailto:` would
  // otherwise open an empty compose window addressed to nobody.
  const reply = data.email
    ? { href: `mailto:${escapeHtml(data.email)}`, label: `Reply to ${escapeHtml(data.name)}` }
    : data.phone
      ? { href: `tel:${escapeHtml(data.phone.replace(/[^\d+]/g, ""))}`, label: `Call ${escapeHtml(data.name)}` }
      : null;
  return shell(
    `
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${BRAND.ink};margin:0 0 8px;">New inquiry</h1>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0 0 24px;">
      Submitted through the website contact form.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(data)}${propertiesList(data)}</table>
    ${
      reply
        ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background-color:${BRAND.navy};">
        <a href="${reply.href}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.cream};text-decoration:none;">${reply.label}</a>
      </td></tr>
    </table>`
        : ""
    }
  `,
    company
  );
}

function renderThanksEmail(data: InquiryData, company: ResolvedCompany) {
  return shell(
    `
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${BRAND.ink};margin:0 0 8px;">Thank you for reaching out</h1>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};margin:0 0 16px;">
      Dear ${escapeHtml(data.name)},
    </p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};margin:0 0 16px;">
      Your inquiry has reached us. A senior member of the group reads every
      message personally, and you will hear from us within one business day.
    </p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.muted};margin:0 0 24px;">
      For your records, a copy of what you sent is below.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(data)}${propertiesList(data)}</table>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};margin:24px 0 0;">
      With regards,<br/>
      <span style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.goldDeep};">${company.legalName}</span>
    </p>
  `,
    company
  );
}

/**
 * Sends the admin notification and the confirmation to the submitter.
 * Returns false when SMTP is not configured so the caller can respond
 * gracefully instead of throwing.
 */
export async function sendContactEmails(data: InquiryData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("Gmail env vars missing; inquiry not emailed:", data.email);
    return false;
  }

  const company = await resolveCompany();

  // Gmail sends from the authenticated account; it also receives the
  // admin notification.
  const from = process.env.GMAIL_USER!;
  const admin = process.env.GMAIL_USER!;

  await transporter.sendMail({
    from: `"${company.name} Website" <${from}>`,
    to: admin,
    // Email is optional on every public form, so replyTo is only set when
    // there is an address to reply to — nodemailer would otherwise put an
    // empty header on the notification.
    ...(data.email ? { replyTo: data.email } : {}),
    subject: `New inquiry from ${data.name}`,
    html: renderAdminEmail(data, company),
  });

  // Confirmation is best-effort: once the admin has the inquiry, a failed
  // courtesy email must not make the submitter retry (and double-notify).
  // No address given means there is simply nobody to confirm to — the
  // enquiry still reached the agency, which is what matters.
  if (!data.email) return true;

  try {
    await transporter.sendMail({
      from: `"${company.legalName}" <${from}>`,
      to: data.email,
      subject: `Thank you for reaching out to ${company.name}`,
      html: renderThanksEmail(data, company),
    });
  } catch (err) {
    console.error("Confirmation email failed (inquiry already delivered):", err);
  }

  return true;
}

export type TourEmailData = {
  name: string;
  phone: string;
  email: string | null;
  property: { title: string; refCode: string | null; slug: string } | null;
  tourType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
};

function tourRows(data: TourEmailData): string {
  const when = [data.preferredDate, data.preferredTime].filter(Boolean).join(", ");
  const rows: [string, string][] = [
    [
      "Property",
      data.property
        ? `${data.property.title}${data.property.refCode ? ` (${data.property.refCode})` : ""}`
        : "Not linked to a listing",
    ],
    ["Name", data.name],
    ["Phone", data.phone],
    ["Email", data.email || "Not provided"],
    ["Visit", data.tourType ?? "In person or video call"],
    ["Preferred time", when || "Any time"],
    ...(data.message ? ([["Message", data.message]] as [string, string][]) : []),
  ];
  return rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.muted};padding:14px 0 4px;border-top:1px solid ${BRAND.border};">${label}</td>
      </tr>
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.ink};padding:0 0 14px;">${escapeHtml(value).replaceAll("\n", "<br/>")}</td>
      </tr>`
    )
    .join("");
}

/**
 * A visitor asked to see a property. The office gets the request with a
 * call button (a tour is arranged by phone); the visitor, if they left an
 * email, gets a short confirmation. Same contract as sendContactEmails:
 * false only when mail is not configured, and the confirmation is
 * best-effort once the office has it.
 */
export async function sendTourEmails(data: TourEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("Gmail env vars missing; tour request not emailed:", data.phone);
    return false;
  }
  const company = await resolveCompany();
  const from = process.env.GMAIL_USER!;
  const listingLink = data.property
    ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:16px 0 0;"><a href="${escapeHtml(`${SITE_URL}/properties/${data.property.slug}`)}" style="color:${BRAND.goldDeep};">View the listing</a></p>`
    : "";

  await transporter.sendMail({
    from: `"${company.name} Website" <${from}>`,
    to: from,
    ...(data.email ? { replyTo: data.email } : {}),
    subject: `Tour request: ${data.property?.title ?? "a property"} — ${data.name}`,
    html: shell(
      `
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${BRAND.ink};margin:0 0 8px;">New tour request</h1>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0 0 24px;">
        Someone wants to visit a property. It is also waiting in Admin → Tour Requests.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tourRows(data)}</table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr><td style="background-color:${BRAND.navy};">
          <a href="tel:${escapeHtml(data.phone.replace(/[^\d+]/g, ""))}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.cream};text-decoration:none;">Call ${escapeHtml(data.name)}</a>
        </td></tr>
      </table>
      ${listingLink}
    `,
      company
    ),
  });

  if (!data.email) return true;
  try {
    await transporter.sendMail({
      from: `"${company.legalName}" <${from}>`,
      to: data.email,
      subject: `Your visit request — ${company.name}`,
      html: shell(
        `
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${BRAND.ink};margin:0 0 8px;">We have your visit request</h1>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};margin:0 0 16px;">
          Dear ${escapeHtml(data.name)}, thank you. We will call you on ${escapeHtml(data.phone)} to fix a time that suits you.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tourRows(data)}</table>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};margin:24px 0 0;">
          With regards,<br/>
          <span style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.goldDeep};">${company.legalName}</span>
        </p>
      `,
        company
      ),
    });
  } catch (err) {
    console.error("Tour confirmation email failed (request already delivered):", err);
  }
  return true;
}

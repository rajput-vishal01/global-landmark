import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";
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

type Mailer = { transporter: Transporter; from: string };

/**
 * The Gmail transport, or null when mail is not configured. Null used to be
 * silent; now it is one `[mail]` log line naming the missing variable (never
 * a value), so `pm2 logs | grep mail` says why nothing arrived.
 * scripts/mail-test.mjs builds the same transport — keep the two in step.
 */
function getMailer(what: string): Mailer | null {
  // trim() drops a stray \r from an env file saved on Windows. The password
  // loses ALL whitespace: Google shows an App Password as four groups of
  // four, and the spaces are not part of it.
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) {
    const missing = [!user && "GMAIL_USER", !pass && "GMAIL_APP_PASSWORD"].filter(Boolean);
    console.error(`[mail] ${what} not emailed: ${missing.join(" and ")} not set in the server environment`);
    return null;
  }
  return {
    from: user,
    transporter: nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      // nodemailer waits two minutes for a connection by default: a host
      // that blocks outbound SMTP held the visitor's form that long.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    }),
  };
}

/**
 * Sends one message; false on failure, logged as ONE line with nodemailer's
 * code, the SMTP step and Google's reply (`code=EAUTH command=AUTH PLAIN
 * response=535-5.7.8 Username and Password not accepted …`). No secrets:
 * `command` is the step's name, never the line that was sent.
 */
async function deliver(mailer: Mailer, what: string, message: SendMailOptions): Promise<boolean> {
  try {
    await mailer.transporter.sendMail(message);
    return true;
  } catch (err) {
    const e = (err ?? {}) as { code?: string; command?: string; response?: string; message?: string };
    const reply = String(e.response ?? e.message ?? err).replace(/\s+/g, " ");
    console.error(`[mail] ${what} failed: code=${e.code ?? "-"} command=${e.command ?? "-"} response=${reply}`);
    return false;
  }
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
  return rowsHtml([
    ["Name", data.name],
    ["Email", data.email || "Not provided"],
    ["Phone", data.phone || "Not provided"],
    ["Looking to", data.interest],
    ["Message", data.message],
  ]);
}

/** Label/value rows, the same markup in every template. Values are escaped here. */
function rowsHtml(rows: [string, string][]): string {
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
 * False when the office was not notified — mail not configured or the send
 * failed, the reason already logged — so the caller can respond gracefully.
 */
export async function sendContactEmails(data: InquiryData): Promise<boolean> {
  const mailer = getMailer("inquiry");
  if (!mailer) return false;

  const company = await resolveCompany();

  // Gmail sends from the authenticated account; it also receives the
  // admin notification.
  const from = mailer.from;

  const delivered = await deliver(mailer, "inquiry: office notification", {
    from: `"${company.name} Website" <${from}>`,
    to: from,
    // Email is optional on every public form, so replyTo is only set when
    // there is an address to reply to — nodemailer would otherwise put an
    // empty header on the notification.
    ...(data.email ? { replyTo: data.email } : {}),
    subject: `New inquiry from ${data.name}`,
    html: renderAdminEmail(data, company),
  });
  if (!delivered) return false;

  // Confirmation is best-effort: once the admin has the inquiry, a failed
  // courtesy email must not make the submitter retry (and double-notify).
  // No address given means there is simply nobody to confirm to — the
  // enquiry still reached the agency, which is what matters.
  if (!data.email) return true;

  await deliver(mailer, "inquiry: confirmation to the enquirer", {
    from: `"${company.legalName}" <${from}>`,
    to: data.email,
    subject: `Thank you for reaching out to ${company.name}`,
    html: renderThanksEmail(data, company),
  });

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
  return rowsHtml(rows);
}

/**
 * A visitor asked to see a property. The office gets the request with a
 * call button (a tour is arranged by phone); the visitor, if they left an
 * email, gets a short confirmation. Same contract as sendContactEmails:
 * false when the office was not notified, and the confirmation is
 * best-effort once the office has it.
 */
export async function sendTourEmails(data: TourEmailData): Promise<boolean> {
  const mailer = getMailer("tour request");
  if (!mailer) return false;
  const company = await resolveCompany();
  const from = mailer.from;
  const listingLink = data.property
    ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:16px 0 0;"><a href="${escapeHtml(`${SITE_URL}/properties/${data.property.slug}`)}" style="color:${BRAND.goldDeep};">View the listing</a></p>`
    : "";

  const delivered = await deliver(mailer, "tour request: office notification", {
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
  if (!delivered) return false;

  if (!data.email) return true;
  await deliver(mailer, "tour request: confirmation to the visitor", {
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
  return true;
}

export type SubmissionEmailData = {
  title: string;
  location: string;
  ownerName: string;
  mobile: string;
  email: string | null;
  photos: number;
};

/**
 * A seller listed a property through /sell. Office only: the listing is a
 * draft until someone reviews it, and the seller already saw the on-page
 * thank-you. Same shell and rows as the tour email.
 */
export async function sendSubmissionEmail(data: SubmissionEmailData): Promise<boolean> {
  const mailer = getMailer("property submission");
  if (!mailer) return false;
  const company = await resolveCompany();

  return deliver(mailer, "property submission: office notification", {
    from: `"${company.name} Website" <${mailer.from}>`,
    to: mailer.from,
    ...(data.email ? { replyTo: data.email } : {}),
    subject: `Property submission: ${data.title} — ${data.ownerName}`,
    html: shell(
      `
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${BRAND.ink};margin:0 0 8px;">New property submission</h1>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0 0 24px;">
        An owner listed a property on the website. It stays a draft, off the site, until it is reviewed in Admin → Submissions.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml([
        ["Property", data.title],
        ["Location", data.location || "Not given"],
        ["Owner", data.ownerName],
        ["Phone", data.mobile],
        ["Email", data.email || "Not provided"],
        ["Photos", String(data.photos)],
      ])}</table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr><td style="background-color:${BRAND.navy};">
          <a href="${escapeHtml(`${SITE_URL}/admin/submissions`)}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.cream};text-decoration:none;">Review the submission</a>
        </td></tr>
      </table>
    `,
      company
    ),
  });
}

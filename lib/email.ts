import nodemailer from "nodemailer";

export type InquiryData = {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
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
function shell(bodyHtml: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:${BRAND.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background-color:${BRAND.navy};padding:28px 32px;text-align:center;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:4px;color:${BRAND.cream};text-transform:uppercase;">Global Landmark</span><br/>
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;color:${BRAND.gold};text-transform:uppercase;">Realty Group</span>
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
              Global Landmark Realty Group · One Meridian Plaza, Suite 4400, New York, NY 10001
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
    ["Email", data.email],
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

export function renderAdminEmail(data: InquiryData) {
  return shell(`
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${BRAND.ink};margin:0 0 8px;">New inquiry</h1>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0 0 24px;">
      Submitted through the website contact form.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(data)}</table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background-color:${BRAND.navy};">
        <a href="mailto:${escapeHtml(data.email)}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.cream};text-decoration:none;">Reply to ${escapeHtml(data.name)}</a>
      </td></tr>
    </table>
  `);
}

export function renderThanksEmail(data: InquiryData) {
  return shell(`
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(data)}</table>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};margin:24px 0 0;">
      With regards,<br/>
      <span style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.goldDeep};">Global Landmark Realty Group</span>
    </p>
  `);
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

  // Gmail sends from the authenticated account; it also receives the
  // admin notification.
  const from = process.env.GMAIL_USER!;
  const admin = process.env.GMAIL_USER!;

  await transporter.sendMail({
    from: `"Global Landmark Website" <${from}>`,
    to: admin,
    replyTo: data.email,
    subject: `New inquiry from ${data.name}`,
    html: renderAdminEmail(data),
  });

  await transporter.sendMail({
    from: `"Global Landmark Realty Group" <${from}>`,
    to: data.email,
    subject: "Thank you for reaching out to Global Landmark",
    html: renderThanksEmail(data),
  });

  return true;
}

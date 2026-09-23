#!/usr/bin/env node
/**
 * Can this machine send the website's mail?
 *
 *   node scripts/mail-test.mjs                  config + Gmail login only, sends nothing
 *   node scripts/mail-test.mjs you@example.com  also sends one short test email
 *
 * On the server, run it from the app root with the env loaded the way the
 * deploy loads it, so it sees what the running app sees:
 *   (set -a; . ./.env; set +a; node scripts/mail-test.mjs you@example.com)
 *
 * Prints whether each variable is set and the password's length — never a
 * value. Exit code 1 on any failure. Needs only nodemailer, a production
 * dependency, so it runs on the server as deployed.
 */
import nodemailer from "nodemailer";

try {
  process.loadEnvFile();
} catch {
  // no .env here — rely on the real environment
}

// Same transport as getMailer() in lib/email.ts — keep the two in step.
const user = process.env.GMAIL_USER?.trim();
const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

console.log(`GMAIL_USER set: ${Boolean(user)} (ends in @gmail.com: ${/@gmail\.com$/i.test(user ?? "")})`);
console.log(`GMAIL_APP_PASSWORD set: ${Boolean(pass)} (length without spaces: ${pass?.length ?? 0}; an App Password is 16)`);
if (!user || !pass) {
  console.error("FAIL: both must be set in the env file the app is started with.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

const UNREACHABLE = "Could not reach smtp.gmail.com:465 from this machine. Outbound SMTP is probably blocked (firewall or hosting provider).";
const HINTS = {
  EAUTH: "Gmail refused the login. GMAIL_USER must be the full Gmail address, GMAIL_APP_PASSWORD a 16-letter App Password (needs 2-Step Verification), not the account password.",
  ETIMEDOUT: UNREACHABLE,
  ECONNECTION: UNREACHABLE,
  ESOCKET: UNREACHABLE,
  EDNS: "Could not look up smtp.gmail.com. Check DNS on this machine.",
};

function fail(step, err) {
  console.error(`FAIL at ${step}`);
  console.error(`  code:     ${err?.code ?? "-"}`);
  console.error(`  command:  ${err?.command ?? "-"}`);
  console.error(`  response: ${err?.response ?? err?.message ?? err}`);
  if (HINTS[err?.code]) console.error(`  hint:     ${HINTS[err.code]}`);
  process.exit(1);
}

try {
  await transporter.verify();
  console.log("verify: OK (smtp.gmail.com:465 reachable, login accepted)");
} catch (err) {
  fail("verify", err);
}

const to = process.argv[2];
if (!to) {
  console.log("No address given, so nothing was sent.");
  process.exit(0);
}
// Catch the copied-placeholder case here: nodemailer would otherwise get as
// far as the send and answer "EENVELOPE: No recipients defined", which reads
// like a fault in the mail setup rather than a typo in the argument.
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
  console.error(`"${to}" is not an email address. Pass a real one:`);
  console.error("  node scripts/mail-test.mjs you@example.com");
  process.exit(1);
}

try {
  const info = await transporter.sendMail({
    from: user,
    to,
    subject: "Mail test from the Global Landmark website",
    text: `Sent by scripts/mail-test.mjs at ${new Date().toISOString()}. If this arrived, the website can send mail.`,
  });
  console.log(`sent: messageId ${info.messageId}`);
  console.log(`server said: ${info.response}`);
} catch (err) {
  fail("send", err);
}

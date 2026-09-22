/**
 * CSV field escaping for the admin exports.
 *
 * Two separate jobs, and the second one is easy to forget:
 *
 * 1. RFC 4180 quoting, so a comma or newline inside a message does not
 *    shift every later column.
 * 2. Formula neutering. Excel, LibreOffice and Sheets treat a cell opening
 *    with = + - @ (or tab/CR) as a formula and RUN it. The rows here carry
 *    a lead's name, email, phone and message, all typed by an anonymous
 *    visitor into a public form — so a lead named
 *    `=HYPERLINK("http://evil","Invoice")` becomes a live link the moment
 *    the client double-clicks leads.csv. Quoting alone does not stop it;
 *    the value has to stop being a formula.
 *
 * The neutering prefix is an apostrophe, which spreadsheets consume as
 * "treat the rest as text" rather than displaying it.
 */

/** Digits, optional sign/decimal/exponent — a real number, not a formula. */
const PLAIN_NUMBER = /^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/;

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvField(value: unknown): string {
  let s = String(value ?? "");

  // A negative number is not an attack, and prefixing it would turn a
  // numeric column into text in the client's spreadsheet.
  if (FORMULA_START.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;

  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

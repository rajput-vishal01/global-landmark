#!/usr/bin/env node
/**
 * Form rules — each one is a bug that shipped, turned into a build failure.
 *
 * 1. `useActionState` only inside lib/use-action-form.ts.
 *    React 19 resets a <form action={dispatch}> whenever the action returns,
 *    even with a validation error. On the property form that wiped the
 *    broker's input AND the autosaved row id, so the retry inserted duplicate
 *    listings. useActionForm submits without the reset; nothing else may wire
 *    a dispatcher to a form by hand.
 *
 * 2. No typed input inside a plain `<form action={serverAction}>`.
 *    A form with no result state cannot show an error. The two that existed
 *    caught a failed insert, logged it, and redirected as if it had saved.
 *    Hidden-id + button forms (duplicate, convert) are fine: nothing typed is
 *    lost and there is nothing to validate.
 *
 * 3. No `Number(formData.get("…id"))`.
 *    An empty id is Number("") === 0, which passes Number.isInteger, so an
 *    update matched `where id = 0` and reported success on a save that never
 *    happened. Read ids with idField() from lib/admin/form-fields.ts.
 *
 * 4. A `*` means required, and required means a `*`.
 *    For native inputs, a label's unconditional <Req /> must pair with a
 *    `required` field, and a `required` field must carry a <Req /> in its
 *    label. Conditional stars (`cond && <Req />`) mark fields the server needs
 *    only in some states — a property's publish gate — and are left to the
 *    code that computes them. Custom widgets like <Select> always hold a
 *    value, so a star on one is not checked against `required`.
 *
 * 5. Creating a property has one writer and one insert per form.
 *    Autosave may only update an existing listing, and Create claims a
 *    one-time key after validation. Autosave used to insert its own draft,
 *    racing Create: brokers saw "already exists" plus a duplicate listing.
 *
 * Run: node scripts/check-forms.mjs (part of `npm run check`).
 */

import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const DIRS = ["app", "components", "lib"];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(tsx?|mts)$/.test(entry)) yield path;
  }
}

/** Strip comments so documentation that NAMES a banned pattern is not flagged. */
function code(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`])\/\/.*$/gm, (m, p) => p + " ".repeat(m.length - p.length));
}

const lineOf = (src, index) => src.slice(0, index).split("\n").length;

/** Attribute run of a JSX opening tag, tolerant of nested {…} and quoted `>`. */
const TAG = /<(input|textarea|select|Select|[A-Z]\w*)\b((?:[^>"'{]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*)\/?>/g;
const isRequired = (attrs) => /(^|\s)required(\s|$|=\{true\})/.test(attrs);
const idOf = (attrs) => (attrs.match(/\bid=(?:"([\w-]+)"|\{"([\w-]+)"\})/) || []).slice(1).find(Boolean);

const failures = [];
const fail = (file, src, index, message) =>
  failures.push(`${relative(ROOT, file)}:${lineOf(src, index)}  ${message}`);

for (const dir of DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const raw = readFileSync(file, "utf8");
    const src = code(raw);
    const rel = relative(ROOT, file).replace(/\\/g, "/");

    // 1
    if (rel !== "lib/use-action-form.ts") {
      for (const m of src.matchAll(/\buseActionState\b/g)) {
        fail(file, src, m.index, "useActionState used directly — use useActionForm from lib/use-action-form.ts");
      }
    }

    // 3
    if (rel !== "lib/admin/form-fields.ts") {
      // Any receiver, not just `formData` — `fd.get("id")` is the same bug.
      for (const m of src.matchAll(/Number\(\s*\w+\.get\(\s*["'](\w*[iI]d)["']\s*\)\s*\)/g)) {
        fail(file, src, m.index, `raw id read "${m[1]}" — use idField(formData, "${m[1]}"), which rejects an empty id instead of turning it into 0`);
      }
    }

    if (!file.endsWith(".tsx")) continue;

    // 2
    for (const m of src.matchAll(/<form\b[^>]*\baction=\{([^}]+)\}[^>]*>([\s\S]*?)<\/form>/g)) {
      const body = m[2];
      const typed = [...body.matchAll(TAG)].find(
        (t) => ["textarea", "select", "Select"].includes(t[1]) || (t[1] === "input" && !/type="hidden"/.test(t[2]))
      );
      if (typed) {
        fail(file, src, m.index, `<form action={${m[1].trim()}}> contains a <${typed[1]}> — a form that takes typed input must submit through useActionForm so it can show an error`);
      }
    }

    // 4
    const labels = new Map();
    for (const m of src.matchAll(/<label\b[^>]*\bhtmlFor=(?:"([\w-]+)"|\{"([\w-]+)"\})[^>]*>([\s\S]*?)<\/label>/g)) {
      const body = m[3];
      const conditional = /&&\s*<Req\s*\/>/.test(body);
      const unconditional = /<Req\s*\/>/.test(body.replace(/\{[^{}]*&&\s*<Req\s*\/>\s*\}/g, ""));
      labels.set(m[1] || m[2], { index: m.index, conditional, unconditional });
    }
    const fields = new Map();
    for (const m of src.matchAll(TAG)) {
      const id = idOf(m[2]);
      if (id) fields.set(id, { index: m.index, tag: m[1], required: isRequired(m[2]), hidden: /type="hidden"/.test(m[2]) });
    }
    const NATIVE = new Set(["input", "textarea", "select"]);
    for (const [id, label] of labels) {
      const field = fields.get(id);
      if (field && NATIVE.has(field.tag) && label.unconditional && !field.required) {
        fail(file, src, label.index, `label for "${id}" shows * but the <${field.tag}> is not required — add \`required\` or drop the *`);
      }
    }
    for (const [id, field] of fields) {
      if (!NATIVE.has(field.tag) || !field.required || field.hidden) continue;
      const label = labels.get(id);
      if (!label || (!label.unconditional && !label.conditional)) {
        fail(file, src, field.index, `<${field.tag} id="${id}"> is required but its label has no <Req /> — mark it so people know before they submit`);
      }
    }
  }
}

// 5. Creating a property: one writer, one insert per form.
//
//    Autosave used to insert a draft for a brand-new listing, racing the
//    Create button. When the two disagreed the broker saw "could not create"
//    or "already exists" while autosave's draft sat in the list as a
//    duplicate. Autosave may now only update; Create claims a one-time key
//    after validation, so a double click cannot insert twice and a rejected
//    submission can be fixed and sent again.
{
  const actionsPath = join(ROOT, "app/admin/(panel)/properties/actions.ts");
  const actions = code(readFileSync(actionsPath, "utf8"));
  const fnBody = (name) => {
    const start = actions.indexOf(`export async function ${name}(`);
    if (start < 0) return "";
    const next = actions.indexOf("\nexport ", start + 10);
    return actions.slice(start, next < 0 ? undefined : next);
  };

  const saveDraft = fnBody("saveDraft");
  if (/\.insert\(\s*properties\s*\)/.test(saveDraft)) {
    fail(actionsPath, actions, actions.indexOf("export async function saveDraft("),
      "saveDraft inserts into properties — autosave must only update an existing listing; creating is the Create button's job");
  }

  const create = fnBody("createProperty");
  const parseAt = create.indexOf("parseProperty(");
  const claimAt = create.indexOf("claimSubmission(");
  const insertAt = create.search(/\.insert\(\s*properties\s*\)/);
  if (claimAt < 0) {
    fail(actionsPath, actions, actions.indexOf("export async function createProperty("),
      "createProperty no longer claims a submission key — a double click would insert twice");
  } else if (!(parseAt >= 0 && parseAt < claimAt && claimAt < insertAt)) {
    fail(actionsPath, actions, actions.indexOf("export async function createProperty("),
      "createProperty must validate, THEN claim the submission key, THEN insert — claiming before validation locks out the retry");
  }
  if (!/releaseSubmission\(/.test(create)) {
    fail(actionsPath, actions, actions.indexOf("export async function createProperty("),
      "createProperty never releases its key — a failed insert would block the same form from retrying");
  }

  // Behaviour of the key store itself, compiled standalone.
  const out = mkdtempSync(join(tmpdir(), "gl-keys-"));
  try {
    execSync(
      `npx tsc lib/admin/submission-keys.ts --outDir "${out}" --rootDir lib ` +
        `--target es2022 --module commonjs --skipLibCheck`,
      { cwd: ROOT, stdio: "pipe" }
    );
    writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));
    const require = createRequire(join(out, "noop.cjs"));
    const { claimSubmission, releaseSubmission, SUBMISSION_KEY_TTL_MS } = require(
      join(out, "admin", "submission-keys.js")
    );
    const t0 = 1_000_000;
    const expect = (cond, what) => {
      if (!cond) failures.push(`lib/admin/submission-keys.ts  ${what}`);
    };
    expect(claimSubmission("form-a", t0) === true, "first submit of a form must be accepted");
    expect(claimSubmission("form-a", t0 + 50) === false, "a double click on the same form must not be accepted twice");
    expect(claimSubmission("form-b", t0 + 60) === true, "a different form must never be blocked by another one");
    releaseSubmission("form-a");
    expect(claimSubmission("form-a", t0 + 70) === true, "a released key (failed insert) must let the same form retry");
    expect(
      claimSubmission("form-b", t0 + 60 + SUBMISSION_KEY_TTL_MS + 1) === true,
      "keys must expire, or the store grows for the life of the process"
    );
  } catch (err) {
    failures.push(`lib/admin/submission-keys.ts  could not be compiled for its check: ${err.message.split("\n")[0]}`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

if (failures.length) {
  console.error(`check-forms: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}
console.log("check-forms: all assertions passed");

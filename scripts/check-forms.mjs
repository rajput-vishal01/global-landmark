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
 * Run: node scripts/check-forms.mjs (part of `npm run check`).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
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

if (failures.length) {
  console.error(`check-forms: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}
console.log("check-forms: all assertions passed");

/**
 * Runnable check for the two-bucket file store (ponytail: assert-based, no
 * test framework — same tsc-to-a-temp-dir trick as check-taxonomy.mjs).
 *
 * Run: node scripts/check-storage.mjs
 *
 * The case that matters here is the one that bit: publishing a legal
 * document COPIES it from private/ into public/, and /api/images/<key>
 * serves anything in public/ without consulting the database. So a delete
 * that sweeps only private/ leaves a client's registry papers downloadable
 * forever, cached immutably, with no row left to un-publish them.
 *
 * Everything runs against a throwaway UPLOAD_DIR; nothing touches real
 * uploads.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "gl-storage-"));
const uploads = mkdtempSync(join(tmpdir(), "gl-uploads-"));
process.env.UPLOAD_DIR = uploads;

const KEY = `${"a".repeat(64)}.pdf`;
const OTHER = `${"b".repeat(64)}.pdf`;

try {
  execSync(
    `npx tsc lib/storage.ts --outDir "${out}" --rootDir lib ` +
      `--target es2022 --module commonjs --esModuleInterop --skipLibCheck`,
    { stdio: "pipe" }
  );
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }));

  const require = createRequire(join(out, "noop.cjs"));
  const storage = require(join(out, "storage.js"));

  // --- key validation -------------------------------------------------------
  assert.ok(storage.isStorageKey(KEY), "a sha256 + known extension is a key");
  for (const bad of ["../etc/passwd", "a.pdf", `${"a".repeat(64)}.exe`, "", `${"A".repeat(64)}.pdf`]) {
    assert.equal(storage.isStorageKey(bad), false, `not a key: ${bad}`);
  }
  assert.equal(storage.resolveStoragePath("../../etc/passwd", "public"), null, "traversal resolves to null");

  // --- bundled repo imagery -------------------------------------------------
  assert.ok(storage.isBundledImageUrl("/local/tricity-towers-night.jpg"), "bundled path accepted");
  for (const bad of ["/local/../../etc/passwd", "/local/sub/dir.jpg", "/local/UPPER.jpg", "/other/x.jpg"]) {
    assert.equal(storage.isBundledImageUrl(bad), false, `not bundled imagery: ${bad}`);
  }

  // --- the leak -------------------------------------------------------------
  const priv = storage.resolveStoragePath(KEY, "private");
  mkdirSync(dirname(priv), { recursive: true });
  writeFileSync(priv, "%PDF-1.4 client registry papers");

  await storage.syncPublicDocumentFile(KEY, true);
  const pub = storage.resolveStoragePath(KEY, "public");
  assert.ok(existsSync(pub), "publishing copies the document into public/");

  // Sweeping private/ alone is what deleteProperty used to do.
  await storage.deleteStoredFiles([KEY], "private");
  assert.equal(existsSync(priv), false, "private copy removed");
  assert.ok(existsSync(pub), "and the public copy is still there — this was the leak");

  // Deleting a property must sweep BOTH buckets for document keys.
  await storage.deleteStoredFiles([KEY], "public");
  assert.equal(existsSync(pub), false, "public copy removed too");

  // A document that was never published has no public copy; sweeping is a no-op.
  await storage.deleteStoredFiles([OTHER], "public");

  // --- un-publishing --------------------------------------------------------
  writeFileSync(priv, "%PDF-1.4 again");
  await storage.syncPublicDocumentFile(KEY, true);
  assert.ok(existsSync(pub), "published again");
  await storage.syncPublicDocumentFile(KEY, false);
  assert.equal(existsSync(pub), false, "un-publishing removes the public copy");
  assert.ok(existsSync(priv), "but keeps the private original for the admin vault");

  // --- the fallback upload directory ---------------------------------------
  // Next's standalone server chdir()s into .next/standalone, so a plain
  // cwd-relative default puts uploads inside the one directory a deploy
  // replaces wholesale — every photo and legal document destroyed on the next
  // push, with the database still pointing at them. This asserts the fallback
  // climbs back out. It cost a production gallery to learn.
  {
    const sep = require("node:path").sep;
    const app = `${sep}var${sep}www${sep}site`;
    assert.equal(
      storage.uploadDirFor(`${app}${sep}.next${sep}standalone`),
      `${app}${sep}uploads`,
      "standalone cwd resolves back to the app root, not inside .next"
    );
    assert.equal(
      storage.uploadDirFor(app),
      `${app}${sep}uploads`,
      "a normal cwd is used as-is"
    );
    assert.equal(
      storage.uploadDirFor(`${app}${sep}.next${sep}standalone${sep}nested`),
      `${app}${sep}.next${sep}standalone${sep}nested${sep}uploads`,
      "only an exact standalone cwd is rewritten"
    );
  }

  console.log("check-storage: all assertions passed");
} finally {
  rmSync(out, { recursive: true, force: true });
  rmSync(uploads, { recursive: true, force: true });
}

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next. The leading **/ matters: a bare
    // ".next/**" only anchors to the repo root, so it misses a NESTED .next
    // (e.g. a git worktree checked out under .claude/worktrees/*) and lint
    // ends up scanning that worktree's own compiled build output instead of
    // ignoring it — exactly what happened the first time a worktree existed
    // alongside this checkout.
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "next-env.d.ts",
    // Worktrees are separate checkouts with their own lint pass; the main
    // tree's lint has no business reaching into one.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;

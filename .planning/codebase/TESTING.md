# Testing Patterns

**Analysis Date:** 2026-08-20

## Current State: No Test Framework Installed

There is no test runner in this repo. `package.json` has no `test` script, no Jest/Vitest/Playwright dependency, and no config file for any of them. A repo-wide search for `*.test.*` / `*.spec.*` files under the project (excluding `node_modules`) returns zero matches.

**This is a gap, not a deliberate omission for correctness-critical code** — see "Where This Bites" below.

## Actual Verification Approach

The repo verifies changes through three mechanisms, in order of frequency:

1. **`npm run lint`** — ESLint via `eslint.config.mjs`, extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Catches type misuse, unused vars, React/Next-specific issues (hooks rules, `<img>` vs `next/image`, etc.). No custom rules layered on top.
2. **`npm run build`** — Next.js production build (`next build`) is the actual type-check gate for the whole codebase (TypeScript errors fail the build). This is the closest thing to CI validation currently in place.
3. **Manual browser verification** — visually confirming pages, forms, and admin flows in a running dev server. No automated E2E (Playwright/Cypress) exists despite `docs/DESIGN_REFERENCES.md`/`ANIMATION_GUIDELINES.md` covering visual/motion QA expectations — that verification is manual today.

## Stated Convention (Not Yet Followed)

`docs/TECH_STACK.md` ("Ponytail conventions" section) states the project's intended check discipline:

> **One runnable check per non-trivial piece of logic** (filter/sort logic, content-model parsing, form validation) — no test framework/fixtures unless the project later adopts one.

This mirrors the global ponytail rule: non-trivial logic (a branch, a loop, a parser, a money/security path) should leave one small `assert`-based self-check behind — no framework, no fixtures — rather than a full test suite.

## The Gap

As of this analysis, **no such checks exist anywhere in the codebase**, despite several files containing exactly the kind of logic the convention calls out:

- `app/admin/(panel)/properties/actions.ts` — `parseChoice`, `parseAmenities`, `parseExtras`, `parseImages`, `parseOptionalInt` are all non-trivial parse/validate functions (allowlist checks, JSON shape validation, length caps, dedup) with no accompanying self-check.
- `lib/rate-limit.ts` — `isRateLimited()` / `hit()` implement two-layer (per-key + global) throttling logic with eviction; a security-relevant branch with no check.
- `lib/slugify.ts` and `uniqueSlug()` in `actions.ts` — slug generation/collision-avoidance logic, untested.
- `lib/categories.ts` (`isCategory` type guard) and `lib/attributes.ts` (taxonomy validation) — boundary validation used across every admin form action, untested.

## Guidance for New Non-Trivial Logic

When adding a parser, validator, filter/sort function, or any money/security-adjacent branch:

1. Write the function.
2. Add ONE runnable self-check in the same file or a sibling `*.check.ts`/inline block — a small `assert`-based block that fails loudly if the logic regresses. No test framework, no fixtures, no per-function suite.
3. Do not add Jest/Vitest/Playwright speculatively — only adopt a framework when there's an actual recurring need across many files that ad-hoc asserts can no longer cover (ponytail ladder: reuse/native/one-line before new dependency).

## If a Framework Is Later Adopted

No decision has been made. If one becomes necessary (e.g., E2E coverage for the admin panel or listings flow), evaluate against the ladder in `docs/TECH_STACK.md` before adding a dependency — Playwright is the most likely fit for this stack (Next.js App Router, server actions, admin forms) given existing `web/testing.md` guidance in this environment, but no config or dependency exists yet.

---

*Testing analysis: 2026-08-20*

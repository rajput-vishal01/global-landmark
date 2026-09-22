# Final pass — 2026-09-22

**Goal:** add realistic demo content locally and in production, make every page responsive, test every interactive feature and fix what breaks (including emails), remove dead code, get SEO right, update the docs, get a build identical to CI green, push to main, and hand over the production seed commands.

**Status:** approved ("continue"). Wave 1 is running.

**User rule (mid-run): no new agents.** Waves 2 and 3 reuse the wave-1 agents through SendMessage:

| Agent | Next job after its current task |
|---|---|
| R1 | Fix its own public-UI findings (the FX-1 role), then T2 public interaction QA |
| R2 | Fix its own listing and property findings, then T1 public forms QA |
| R3 | Fix its own admin findings (the FX-3 role), then T3 admin properties and projects QA |
| S1 | T4 admin customer-record (CRM) QA, once listings.json is done |
| S2 | T5 admin content and settings QA, once the seed is done |
| FX-4 | Backend and public-form findings (the FX-2 role) |
| DC | Docs update (the DOC role), after the cleanup |
| SEO-1, SEO-2 | Overflow fixes when needed |

**Incident:** at about the time the SEO agents started, Docker Desktop restarted. That stopped MySQL and the dev server. The orchestrator restarted them through the preview tool (`.claude/launch.json` → `dev-3000`). Startup re-ran `seed.mjs`, which put the original portfolio and sample CRM rows back in the local DB.

**Added by the orchestrator:**
- **No fake testimonials, reviews, ratings or client statistics.** They would be fake reviews on a live business site.
- **The cache refresh after seeding is done by re-saving one demo listing in the admin, not Settings.** Saving Settings copies the code defaults into the database's overrides.

**Decided (2026-09-22):**
- Demo listings show **Price on request**. No `demand_price` is seeded.
- Demo projects get **invented names in real localities**.
- **Stop and ask before pushing.** Never push automatically.

---

## Rules for every agent

1. **Browser.** Use only the built-in browser.
   - Open your own tab with `tabs_create` and pass its `tabId` on every call.
   - Never drive or close another agent's tab.
   - Set the viewport with `resize_window` on your own tab only, and reset it to desktop when you finish.
2. **Admin session.** All tabs share the same admin login.
   - Never click "Log out", and never type a password.
   - If a login screen appears, stop and report it.
3. **Clicking.** Click buttons by their exact visible text. Never click "the first submit button": the sidebar Log out button is a submit button.
4. **Test data.**
   - Names start with `ZZ Test`, emails end in `@example.com`, and the phone number is `9000000000`.
   - Delete your own test rows through the admin when you finish.
5. **The user's dev server** on :3000 stays up. Never run `next build`, delete `.next`, restart the dev server or run `npm install`.
6. **Git.**
   - Never push. Never use reset, checkout, stash, rebase or amend, or `git add -A` / `git add .`.
   - Commit only your own files: `git commit -m "<type>(scope): …" -- <paths>`, plus the Co-Authored-By trailer.
7. **Hard limits.**
   - Never read `.env`.
   - Never turn Next image optimisation back on or re-encode uploads. The user requires images served at uploaded quality.
   - Never write a PAN, bank account, IFSC code or turnover figure anywhere.
8. **Checkers do not fix.** They append findings to `findings/<ID>.md` in the format below. Each fixer owns specific folders (see the roster). Keep any fix outside your folders minimal and note it.
9. **Stale styles.** If a new Tailwind class doesn't show up, the CSS watcher is stale. Toggle the double space in `/* Light from the top-left. */` in `app/globals.css`.
10. **Before reporting a bug,** reload and reproduce it twice. Other agents' edits trigger hot reloads that can cause brief errors.

**Findings row format:**

| id | severity | page or file | width | steps to reproduce | expected | actual | owner | status |
|---|---|---|---|---|---|---|---|---|

---

## Roster

### Wave 1 (runs in parallel, starting at approval)

| ID | Role | Scope |
|---|---|---|
| R1 | Responsive check | Public pages: home, about, contact, sell, news, privacy, terms, data-deletion, offline and 404. Also the header, full-screen menu, footer, enquiry dock and floating buttons. |
| R2 | Responsive check | `/properties` (filters, sort, paging, empty state), `/properties/[slug]` (gallery, photo viewer, jump bar, dialogs, map and card), `/projects/[slug]` and search. |
| R3 | Responsive check | Every `/admin` screen: forms, tables, dialogs and the sidebar. |
| S1 | Seed | Web research, then the manifest of listings and projects, with photos and map links. |
| S2 | Seed | Manifest of site content (deals, services, quotes) and the `scripts/seed-demo.mjs` runner. |
| FX-4 | Fix | Emails not sending. Starts immediately, then takes backend findings. |
| DC | Dead code | Unused files, exports and dependencies. Respects the do-not-delete list in memory. |
| SEO-1 | SEO, technical (loads the `seo` skill) | Metadata, canonicals, robots, sitemap (including new listings), JSON-LD (RealEstateListing, Organization, LocalBusiness, BreadcrumbList), OG tags, noindex on admin, redirects for removed routes. |
| SEO-2 | SEO, content and local (loads the `seo` skill) | Per-page titles and descriptions, H1 order, alt text, address and phone matching Settings, internal links, Tricity locality terms. |

Test widths: 320, 360, 375, 390, 414, 768, 820, 1024, 1280, 1440 and 1920.

**How checks run:** mostly DOM checks in JavaScript:
- sideways overflow, and elements that extend past the viewport
- fixed elements covering content
- tap targets under 44px, and text under 12px
- clipped text

A screenshot is used only to confirm a finding. Bring the tab to the front first, since hidden panes render blank. Listing-heavy pages are checked after the seed lands.

### Wave 2 (starts after the seed is verified locally)

| ID | Role | Scope |
|---|---|---|
| T1 | QA: public forms | Contact, the Request details dialog, the Book a site visit dialog, the multi-listing enquiry dock, `/sell` (photo upload and maps link) and the newsletter. Check each submission lands in Leads, Tours or Submissions, and that mail is attempted (dev log). |
| T2 | QA: public interaction | Home, search, listing filters, sort and paging, and the property page (gallery, keyboard in the viewer, jump bar, share, add-to-enquiry sync, map, area converter, downloads). Also projects, news, recently viewed, 404 and the menu, and footer, call and WhatsApp links. |
| T3 | QA: admin properties and projects | Create, edit, draft, publish, archive and delete. Image upload, reorder and cover. The document vault (multi-upload and preview). Project create and edit, and prefilling units from a project. Autosave and validation. |
| T4 | QA: admin customer records (CRM) | Leads (status and CSV export), tours, submissions (approve, publish, archive), clients (notes and activities), the deal pipeline (stages and payments) and the dashboard counts. |
| T5 | QA: admin content and settings | Deals, video reels, text quotes, services, the website page, and Settings flowing through to header, footer and contact. Also that saves refresh the cache, and that admin APIs refuse requests without a session (checked with curl). |
| FX-1 | Fix: public UI and responsive | `app/(site)/**`, `components/{sections,ui,property}/**`, `app/globals.css` |
| FX-2 | Fix: public forms and flows | Site `actions.ts` files, form components, and the enquiry, tour and sell flows |
| FX-3 | Fix: admin | `app/admin/**`, `components/admin/**`, `lib/admin/**` |

**Fix loop:** finding → owning fixer → fix and commit → the fixer re-checks in the browser → closed. The orchestrator keeps the consolidated table in `FINDINGS.md`.

### Wave 3 (after every finding is closed)

- **DOC (docs update):**
  - `README.md` and the index in `CLAUDE.md`.
  - `docs/*.md`: TASKS, SITE_ARCHITECTURE, CONTENT_MODEL, ADMIN_DESK, TECH_STACK, handout and CLIENT_HANDOVER_MESSAGE.
  - How to use `seed-demo` and `mail-test`.
- **Build (orchestrator):** in a separate copy, run `git worktree add ../gl-build`, `npm ci`, `npx next typegen`, `npm run check` and `npx next build`. These are the same steps CI runs, and the :3000 dev server isn't touched.
- **Code review** of the whole diff. The security-sensitive parts are uploads, the seed and email.
- **Push to main:** triggers the Actions deploy, which runs migrations 0004–0006 on the server. Watch the run until it's green.
- **Hand over the production commands:** seed, cache refresh, mail test, the nginx 20M check and removing the demo data.

---

## Seed design

- **Script:** `scripts/seed-demo.mjs`. Plain node with mysql2, like `seed.mjs`, falling back to `process.loadEnvFile()`.
- **Content:**
  - About 30 listings across Mohali, Zirakpur, Chandigarh, Panchkula, New Chandigarh and Kharar: flats, builder floors, kothis, plots, SCOs, shops and offices, plus a few rentals.
  - About 5 projects, with units filed under them.
  - A Deal of the Week, and services and text quotes (only where those are empty).
- **Names:** project names are invented and checked not to exist. Localities and sectors are real. Sizes, amenities and RERA number formats come from research.
- **Images:**
  - Free-licence stock from Unsplash or Pexels, whose licences allow commercial use. Chosen to look like the Tricity or North India. The client rejected "could be anywhere" stock before.
  - At least 2000px wide, high-quality JPEG, under 20MB.
  - The script downloads them when it runs, so the repo stays small. They are stored exactly like admin uploads (`uploads/public/<ab>/<sha256>.<ext>`, URL `/api/images/<sha256>.<ext>`), so admin editing keeps working.
  - The manifest records the source URL and licence of every photo.
- **Safety:**
  - Only adds rows. Skips existing slugs and never touches rows that aren't demo rows.
  - Every row is tagged with the source name "Demo data".
  - `--remove` deletes the demo rows and any files nothing else references. `--dry-run` is also supported.
- **Cache:** public pages are cached. After seeding, refresh them with an admin save or a revalidation step triggered by the script.
- **Customer records:** no fake leads, clients or tours in production. The testers create those locally through the forms.

## Email bug (FX-4)

The Gmail transport (`GMAIL_USER` / `GMAIL_APP_PASSWORD`) returns null when either is unset: no mail and no error.

1. Trace every mail path: contact, tour, sell and newsletter.
2. Log a loud warning whenever mail is skipped.
3. Strip spaces from the app password.
4. Surface send errors instead of swallowing them.
5. Add `scripts/mail-test.mjs` for the user to run on the server. It prints which variables are set (never their values), checks the Gmail login and sends one test mail.

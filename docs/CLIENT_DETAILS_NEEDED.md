# Meta / WhatsApp Business API — what the site publishes, and what is left

Meta's business verification is a **document-matching exercise**. It compares
the legal name, address, phone and website in Meta Business Manager against
official documents, and cross-checks them against the public website. Any of
the three disagreeing is a rejection, and the rejection does not say which
line failed.

The client supplied the **Udyam Registration Certificate**. Every identity
field on the site is now transcribed from it rather than written.

---

## 1. The certificate, field for field

Read off the PDF (3 pages, printed 21/08/2026). This is the reference — if a
line on the site disagrees with this table, the site is wrong.

| Field | Value |
|---|---|
| Udyam Registration Number | UDYAM-PB-20-0137589 |
| Name of Enterprise | GLOBAL LANDMARK REALTY GROUP |
| Type of Enterprise | Micro (classification year 2026-27, classified 20/08/2026) |
| Type of Organisation | Proprietary |
| Owner Name | ASHU GOYAL |
| Major Activity | Services |
| Social Category | General |
| Do you have GSTIN | **No** |
| Email Id | globallandmarkrealty@gmail.com |
| Mobile No. | 9882084786 |
| Date of Incorporation / Registration | 01/04/2023 |
| Date of Commencement of Business | 01/04/2023 |
| Date of Udyam Registration | 20/08/2026 |
| District Industries Centre | SAS Nagar (Punjab) |
| MSME-DFO | Ludhiana (Punjab) |
| Employment | 3 male, 1 female — 4 total |

**Official address of Enterprise**

| Field | Value |
|---|---|
| Flat / Door / Block No. | SHOP NO 102 |
| Name of Premises / Building | TLI BUSINESS SQUARE |
| Road / Street / Lane | ADJ. SEC 20, PANCHKULA |
| Village / Town | PEERMUSHLLA |
| Block | PEERMUSHLLA |
| City | ZIRAKPUR |
| District | SAS NAGAR |
| PIN | 160104 |
| State | PUNJAB |

**National Industry Classification**

| NIC 5 | Description | Activity |
|---|---|---|
| 68200 | Real estate activities on a fee or contract basis | Services |
| 68100 | Real estate activities with own or leased property | Services |

## 2. What the site publishes from it

| Certificate field | Where it appears |
|---|---|
| Registered name | Footer, terms, privacy, data-deletion, JSON-LD `legalName` |
| Full address | Footer (every page), `/contact`, all three legal pages, JSON-LD `PostalAddress` |
| Mobile | Footer, `/contact`, legal pages, JSON-LD `telephone` |
| Email | Footer, `/contact`, `/offline`, legal pages, JSON-LD `email` |
| Udyam number | **Footer of every page**, `/terms`, JSON-LD `identifier` |
| Constitution + proprietor | `/terms` → Registration |
| Date of incorporation | `/about` ("Established 2023"), `/terms`, JSON-LD `foundingDate` |
| Enterprise classification | `/terms` → Registration |
| NIC codes | `/terms` → Registration |
| GSTIN: No | Nothing published — correctly absent, not a blank field |

`scripts/check-legal.mjs` fails `npm run check` if any of the exact strings
above stops appearing in `lib/data.ts`. It exists because the first version
of this address was silently "tidied" from `Adj. Sec 20` to `Adj. Sector 20`,
which is precisely how a site stops matching its own paperwork.

### The two corrections the certificate forced

**Location.** The site said **"Based in Panchkula"** and the structured data
claimed `addressLocality: Panchkula, addressRegion: Haryana`. Both wrong. The
office is in **Zirakpur, SAS Nagar district, Punjab** — "Adj. Sec 20,
Panchkula" is the *road name*, mistaken for the city. A reviewer holding a
Punjab certificate against a website claiming Haryana sees two different
businesses. Also corrected in the governing-law clause and on `/about`, which
still said "Home office: Panchkula".

**RERA.** The site claimed **"RERA-Compliant Real Estate Brokers"** in the
footer masthead and **"RERA Compliant"** in the compliance line. Removed.
RERA registration has been applied for and not issued; in India that phrasing
reads as a registration held, and there is no number behind it. What runs
there now is the Udyam number, which is real and checkable at
udyamregistration.gov.in.

## 3. Set Meta Business Manager to exactly this

Copy-paste it, do not retype it:

```
Legal name:  GLOBAL LANDMARK REALTY GROUP
Address:     Shop No 102, TLI Business Square,
             Adj. Sec 20, Panchkula, Peermushlla
City:        Zirakpur
District:    SAS Nagar
State:       Punjab
PIN:         160104
Phone:       +91 9882084786
Email:       globallandmarkrealty@gmail.com
Website:     https://globallandmarkrealty.com
```

Upload the **Udyam certificate** as the supporting document — all three
pages, legible, uncropped. "Documents not viewable" is one of Meta's stated
rejection reasons.

## 4. The Gmail address — keep it

Earlier advice in this file said a domain mailbox
(`…@globallandmarkrealty.com`) was the highest-value outstanding item. **That
was wrong, and the certificate is why.**

`globallandmarkrealty@gmail.com` is the email printed on the Udyam
certificate. Verification tests whether the website matches the document, so
publishing a domain address that appears on no paperwork would introduce a
*new* mismatch, not remove one. Keep the Gmail until the Udyam record itself
is updated — then change both together, in that order.

## 5. Still outstanding

**RERA registration number.** Applied for, not issued. Not a Meta blocker —
Meta does not ask for RERA. It matters for Indian property advertising norms.
When it arrives: set `LEGAL_DETAILS.reraNumber` (appears on `/terms`) and add
it to `COMPANY.license` (appears in the footer masthead).

**Domain verification in Business Manager.** Separate from everything above
and not fixable in site copy: Meta wants proof of control over
`globallandmarkrealty.com`, via a DNS TXT record or a
`<meta name="facebook-domain-verification">` tag. Get the token from Business
Manager → Brand Safety → Domains; the tag is a two-line change.

**X, LinkedIn, YouTube** are still `"#"` in `COMPANY.socials`. Every consumer
filters those out, so nothing renders a dead link — but nothing renders a
profile either. Supply the URLs or delete the rows.

### Grievance Officer — closed, no action needed

Not a Meta requirement. It is an Indian statutory role (DPDP Act 2023, IT
Rules 2011): a named contact for data complaints. For a four-person
proprietorship that is normally the proprietor, but naming someone is a
decision, not a lookup, so it was not filled in from the certificate. Nothing
waits on it — the privacy policy and data-deletion page route complaints to
the general contact and name the Data Protection Board as escalation. If Ashu
wants his name on it, fill `LEGAL_DETAILS.grievanceOfficer`.

## 6. Never publish these

The certificate also carries the proprietor's **PAN**, the **State Bank
account number and IFSC**, and the **FY 2024-25 turnover**. None of it is on
the site, none of it is in the repository, and `scripts/check-legal.mjs`
greps the whole tree on every `npm run check` and fails the build if any of
it appears. PAN is a personal identifier and the bank details are exactly
what an impersonation attempt wants. Meta asks for neither.

Employment numbers (4 staff) and turnover are also left off. They are
business disclosures, not identity, and nothing on the site needs them.

---

## Where these live in the code

`COMPANY` in `lib/data.ts` and `LEGAL_DETAILS` in `lib/legal.ts` — and
`LEGAL_DETAILS` now reads the address and the Udyam number *from* `COMPANY`,
so there is exactly one copy of each. The footer, contact page, privacy
policy, terms, data-deletion page and the JSON-LD all read from those.

The address, phone, email and socials can also be overridden through **Admin
→ Settings** without a deploy. Be careful there: an override outranks
`lib/data.ts`, which is how a stale row kept the old Panchkula address live
after the code was fixed. Migrations `0001` and `0002` clear those rows.

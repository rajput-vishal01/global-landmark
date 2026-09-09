# Details needed from the client — Meta / WhatsApp Business API

Meta's business verification is a **document-matching exercise**. It compares
the legal name, address, phone and website in Meta Business Manager against
the same four facts on official documents, and cross-checks them against what
the public website says. Any of the three disagreeing is a rejection.

This is the list. Filled rows are what we already publish; blank rows are what
we need before resubmitting.

---

## 1. Identity — the rejection risk

| Field | What we publish today | What we need | Where it goes |
|---|---|---|---|
| Legal name | `Global Landmark Realty Group` | **The exact name on the GST / incorporation certificate**, character for character. If the entity is a proprietorship in a person's name, or carries a "Pvt Ltd" suffix, what we publish is wrong. | `COMPANY.legalName` |
| Registered address | `Based in Panchkula · Tricity, India` | **Full postal address with PIN code**, as printed on the certificate or a utility bill. | `COMPANY.addressLines` + `LEGAL_DETAILS.registeredAddress` |
| Phone | `+91 98820-84786`, `+91 70090-00164` | Confirm which is the registered business line. | already set |
| Website | `globallandmarkrealty.com` | — | already set |

**The address is the single most likely reason the application is failing.**
"Based in Panchkula" cannot be matched against any document — there is no
building, street, sector or PIN code for a reviewer to compare.

## 2. Email — second most likely reason

| Field | Today | Needed |
|---|---|---|
| Public email | `inquiries@globallandmark.com` | **An inbox on `@globallandmarkrealty.com`** that someone actually reads. |

Two separate problems with the current value. The domain (`globallandmark.com`)
is not the website's domain (`globallandmarkrealty.com`), which reads to Meta
as a different organisation. And the code comment says it was a placeholder
that was never replaced — so if that mailbox does not exist, any verification
mail Meta sends is going nowhere, and the application would appear to stall
rather than fail.

## 3. Registration numbers

| Field | Today | Needed | Where |
|---|---|---|---|
| RERA / HRERA agent registration | Claimed as "RERA-Compliant", **no number** | The registration number | `LEGAL_DETAILS.reraNumber`, and append to `COMPANY.license` |
| GSTIN | not published | The GST number | `LEGAL_DETAILS.gstin` |
| CIN | not published | Only if the entity is a company | `LEGAL_DETAILS.cin` |

Advertising property in India while claiming RERA compliance without showing
the number is a compliance gap on its own, separate from Meta.

## 4. Grievance Officer — legally required, currently missing

The DPDP Act 2023 and the IT Rules 2011 both require a **named individual**,
published on the site, who handles data requests and complaints. It cannot be
an alias or a generic inbox.

| Field | Needed |
|---|---|
| Name | |
| Designation | |
| Email | |
| Phone | |

Until this is filled, the privacy policy falls back to the general contact
details and still names the Data Protection Board — legal enough to publish,
but not complete.

## 5. Documents to upload to Meta

At least two, and every detail on them must match sections 1–3 above:

- [ ] GST registration certificate
- [ ] Certificate of Incorporation / partnership deed / proprietorship proof
- [ ] Business PAN
- [ ] A utility bill or bank statement in the business name showing the address
- [ ] RERA/HRERA registration certificate

Scans must be fully legible, uncropped, and show the whole page. "Documents
not viewable" is one of Meta's stated rejection reasons.

## 6. The rejection email itself

**Ask the client to forward it.** Meta names the reason — "details do not
match", "documents not viewable", "incomplete organization details" — and that
turns this from a list of suspicions into one thing to fix.

---

## Where these get entered

Most of it is one file: `lib/legal.ts` (`LEGAL_DETAILS`) and `lib/data.ts`
(`COMPANY`). The privacy policy, terms, footer and contact page all read from
those, so filling them in updates every page at once.

The address, phone, email and socials can alternatively be set without a
deploy through **Admin → Settings**, which overrides `COMPANY` at runtime. The
legal pages read the overridden values too, so the site cannot end up saying
one address in the footer and another in the policy.

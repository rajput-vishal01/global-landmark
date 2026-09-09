# Details needed from the client — Meta / WhatsApp Business API

Meta's business verification is a **document-matching exercise**. It compares
the legal name, address, phone and website in Meta Business Manager against
the same four facts on official documents, and cross-checks them against what
the public website says. Any of the three disagreeing is a rejection.

This is the list. Filled rows are what we already publish; blank rows are what
we need.

**Sections 1 to 3 are the ones that block resubmission.** Section 4 is Indian
compliance we can add whenever, and nothing on the site waits for it.

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

## 4. Grievance Officer — later, not now

**Not a Meta requirement.** Meta does not look for this, and it is not part of
why the application is failing. It is an Indian one: IT Rules 2011 Rule 5(9)
has required a named officer published on the site since 2011, and the DPDP
Act 2023 carries the duty forward with a 90-day resolution window.

It blocks nothing today. The privacy policy falls back to the general contact
details and still names the Data Protection Board, which is legal to publish.
Fill these in whenever the client gets round to it:

| Field | Needed |
|---|---|
| Name | |
| Designation | |
| Email | |
| Phone | |

## 5. Documents to upload to Meta

At least two, and every detail on them must match sections 1–3 above:

- [ ] GST registration certificate
- [ ] Certificate of Incorporation / partnership deed / proprietorship proof
- [ ] Business PAN
- [ ] A utility bill or bank statement in the business name showing the address
- [ ] RERA/HRERA registration certificate

Scans must be fully legible, uncropped, and show the whole page. "Documents
not viewable" is one of Meta's stated rejection reasons.

## 6. Working without the rejection notice

The client is not sharing Meta’s rejection email, so we do not have the
stated reason and are working from what the site itself shows.

That is survivable but it costs a cycle: sections 1–3 fix every mismatch we
can see from the outside, and if Meta rejects again for something only the
notice names, we find out on the second attempt rather than the first. If
anyone can get even the one-line reason out of them, it is worth asking for.

---

## Where these get entered

Most of it is one file: `lib/legal.ts` (`LEGAL_DETAILS`) and `lib/data.ts`
(`COMPANY`). The privacy policy, terms, footer and contact page all read from
those, so filling them in updates every page at once.

The address, phone, email and socials can alternatively be set without a
deploy through **Admin → Settings**, which overrides `COMPANY` at runtime. The
legal pages read the overridden values too, so the site cannot end up saying
one address in the footer and another in the policy.

# Meta / WhatsApp Business API — what the site publishes, and what is left

Meta's business verification is a **document-matching exercise**. It compares
the legal name, address, phone and website in Meta Business Manager against
official documents, and cross-checks them against the public website. Any of
the three disagreeing is a rejection.

The client supplied the **Udyam Registration Certificate
(UDYAM-PB-20-0137589, issued 20/08/2026)**, and the site now matches it.

---

## 1. Resolved — the site matches the certificate

| Field | Certificate | Site now publishes |
|---|---|---|
| Legal name | GLOBAL LANDMARK REALTY GROUP | `Global Landmark Realty Group` — already matched |
| Registered address | Shop No 102, TLI Business Square, Adj. Sector 20 Panchkula, Peermushlla, Zirakpur, SAS Nagar, Punjab 160104 | the same, in the footer, contact page, both legal pages and the structured data |
| Mobile | 9882084786 | `+91 98820-84786` — already matched |
| Email | globallandmarkrealty@gmail.com | the same |
| Udyam number | UDYAM-PB-20-0137589 | shown on `/terms` |
| Organisation | Proprietary — proprietor Ashu Goyal | — |

### The correction this surfaced

The site said the business was **"Based in Panchkula"**, and the structured
data claimed `addressLocality: Panchkula, addressRegion: Haryana`. Both were
wrong. The certificate puts the office in **Zirakpur, SAS Nagar district,
Punjab** — "Adj. Sector 20 Panchkula" is the *road name*, which the old copy
had mistaken for the city.

That is not cosmetic. A reviewer comparing a Punjab certificate against a
website claiming Haryana sees two different businesses. Corrected everywhere,
including the governing-law clause in the terms.

## 2. Set Meta Business Manager to exactly this

Copy-paste it, do not retype it:

```
Legal name:  GLOBAL LANDMARK REALTY GROUP
Address:     Shop No 102, TLI Business Square,
             Adj. Sector 20 Panchkula, Peermushlla
City:        Zirakpur
District:    SAS Nagar
State:       Punjab
PIN:         160104
Phone:       +91 9882084786
Email:       globallandmarkrealty@gmail.com
Website:     https://globallandmarkrealty.com
```

Upload the **Udyam certificate** as the supporting document — full page,
legible, uncropped. "Documents not viewable" is one of Meta's stated rejection
reasons.

## 3. Still outstanding

| Item | Why it matters | Blocking? |
|---|---|---|
| **RERA / HRERA agent registration number** | The site claims "RERA-Compliant Real Estate Brokers" with no number behind it. Udyam is an MSME registration, not RERA, and does not substitute. | Not for Meta. Yes for Indian property advertising. |
| **Grievance Officer** — name, designation, email, phone | The DPDP Act 2023 and IT Rules 2011 require a named individual published on the site. The certificate names Ashu Goyal as proprietor, but accepting a statutory role is his decision, not something to infer from a registration document. | No. The policy falls back to the general contact. |

## 4. One judgement call, made consciously

The published email is a **Gmail address**, not one on
`@globallandmarkrealty.com`.

Keep it. It is the email **on the certificate**, and matching the document is
what verification actually tests — a domain mailbox appearing on no paperwork
would be a new mismatch, not an improvement. Worth moving to a domain address
later for how it reads to a client, but only by updating the Udyam record at
the same time.

## 5. Never publish these

The certificate also carries the proprietor's **PAN** and the **bank account
number and IFSC**. None of it is on the site and none of it is in the
repository — verified by grep. PAN is a personal identifier, and the bank
details are precisely what an impersonation attempt would want. Meta asks for
neither during business verification.

---

## Where these live in the code

`COMPANY` in `lib/data.ts` and `LEGAL_DETAILS` in `lib/legal.ts`. The footer,
contact page, privacy policy, terms and the JSON-LD all read from those, so
there is one place to change and no way for two pages to disagree.

The address, phone, email and socials can also be set through **Admin →
Settings** without a deploy, and the legal pages read those overrides too.

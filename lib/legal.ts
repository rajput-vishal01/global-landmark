// A value import as well as a type one: the registration number itself now
// lives in lib/data.ts with the rest of the company's identity, so the
// footer and these documents cannot drift apart. `COMPANY` stays the name
// of the *parameter* each document takes (the resolved company, which may
// carry admin overrides), hence the alias.
import { COMPANY as COMPANY_DATA } from "./data";

/**
 * The privacy policy and terms, as content rather than markup.
 *
 * Both pages render from here through the same component, so the two cannot
 * drift in structure, and a wording change is one edit rather than two.
 *
 * Every identity fact — legal name, address, phone, email — is read from
 * COMPANY. That is deliberate and load-bearing: Meta's business verification
 * compares the name and address on the website against the name and address
 * on the submitted certificate, so the moment lib/data.ts carries the real
 * registered details, these pages, the footer and the contact page all say
 * the same thing at once. Nothing here is hardcoded, and nothing here should
 * be.
 *
 * NOT LEGAL ADVICE. This is a working draft covering what the DPDP Act 2023
 * and Meta's platform requirements ask for. Have a lawyer read it before it
 * is relied on.
 */

export type LegalSection = {
  heading: string;
  /** Paragraphs. Rendered in order, one <p> each. */
  body: string[];
  /** Optional bullets under the paragraphs. */
  list?: string[];
};

export type LegalDocument = {
  title: string;
  description: string;
  /** Shown under the title — what this document is for, in one sentence. */
  intro: string;
  /** ISO date. Rendered as "3 Sept 2026" and used for the "last updated" line. */
  updated: string;
  sections: LegalSection[];
};


/**
 * The registration and grievance details Indian law and Meta both ask for.
 *
 * EMPTY STRINGS ARE DELIBERATE. Every field below that is blank is one the
 * client has not supplied yet, and the pages omit a section rather than
 * publish a half-sentence or a placeholder. Fill these in and the privacy
 * policy, the terms and the contact page all update together — see
 * docs/CLIENT_DETAILS_NEEDED.md for the list to send them.
 *
 * Do not invent a value here. A registration number that does not match the
 * certificate is worse than an absent one: absent is incomplete, wrong is a
 * false statement on a public compliance page.
 */
export const LEGAL_DETAILS = {
  /** Exact name on the Udyam certificate. Matches COMPANY.legalName. */
  registeredName: "Global Landmark Realty Group",
  /**
   * Registered address, one line per row. Same three lines as
   * COMPANY.addressLines, read from there so the compliance page and the
   * footer cannot say two different things.
   */
  registeredAddress: COMPANY_DATA.addressLines,
  /** MSME / Udyam registration. One copy, in lib/data.ts — it is on the
      footer of every page as well as in the terms. */
  udyam: COMPANY_DATA.udyam,
  /** "Type of Enterprise: MICRO", classified 20/08/2026 for 2026-27. */
  enterpriseType: "Micro enterprise (MSME)",
  /** "Type of Organisation: Proprietary" — hence no CIN below. */
  organisationType: "Proprietorship",
  /** "Owner Name" on the certificate. The proprietor is the legal person
      behind the trading name, which is what a verifier is matching. */
  proprietor: "Ashu Goyal",
  /*
   * No date of incorporation and no date of Udyam registration, though the
   * certificate carries both. The client does not want a founding year or
   * any length-of-experience claim published anywhere on the site, and a
   * date on the compliance page is still a date on the site. Meta does not
   * ask for one.
   */
  /**
   * National Industry Classification codes, which are the government's own
   * description of what this business does. Worth publishing: it is the
   * least arguable answer to "what is this company", which is the question
   * a verification review is actually asking.
   */
  nicCodes: [
    "68200 — Real estate activities on a fee or contract basis",
    "68100 — Real estate activities with own or leased property",
  ],
  /** Proprietorship, so there is no CIN. */
  cin: "",
  /** The certificate records "Do you have GSTIN: No". Nothing to publish. */
  gstin: "",
  /** HRERA / RERA agent registration. Still not supplied — Udyam is not RERA. */
  reraNumber: "",

  /*
   * Deliberately absent, and must stay absent. The certificate also carries
   * the proprietor's PAN, the State Bank account number and its IFSC, and
   * the FY 2024-25 turnover. None of that is identity a customer
   * or a platform reviewer needs, and all of it is fraud material. It is
   * not in this file, and scripts/check-legal.mjs fails the build if any of
   * it turns up anywhere in the repo.
   */

  /**
   * Required by the DPDP Act 2023 and the IT Rules 2011: a named person,
   * published on the site, who answers data requests and complaints.
   *
   * The certificate names Ashu Goyal as proprietor, but being the owner is
   * not the same as accepting a statutory role — that is his call to make,
   * not ours to infer from a registration document. Left blank until he says
   * so; the policy falls back to the general contact meanwhile.
   */
  grievanceOfficer: {
    name: "",
    designation: "",
    email: "",
    phone: "",
  },
};

/** Whether we have enough to publish the registration block at all. */
const hasRegistration = (d: typeof LEGAL_DETAILS) =>
  Boolean(d.udyam || d.cin || d.gstin || d.reraNumber || d.registeredName);

type Company = typeof COMPANY_DATA;

/* Both documents carry the same date. They were written together, and two
   dates a day apart would only invite the question of which one moved. */
const UPDATED = "2026-09-09";

/**
 * The grievance contact, which the DPDP Act 2023 and the IT Rules 2011 both
 * require to be published.
 *
 * Degrades on purpose. Until the client names an officer, this still gives a
 * working route to complain and still names the Board — a section that read
 * "Grievance Officer: (blank)" would be worse than useless on a page whose
 * whole job is to look like a business that has its paperwork in order.
 */
function grievanceBody(company: Company): string[] {
  const o = LEGAL_DETAILS.grievanceOfficer;
  const named = o.name
    ? `Our Grievance Officer is ${o.name}${o.designation ? `, ${o.designation}` : ""}. Write to ${o.email || company.email}${o.phone ? ` or call ${o.phone}` : ""}.`
    : `Write to us at ${company.email} or call ${company.phone} and your complaint will reach the person responsible for it.`;
  return [
    named,
    "We acknowledge complaints within 72 hours and resolve them within 90 days. If we cannot resolve it between us, you may take the matter to the Data Protection Board of India.",
  ];
}

export function privacyPolicy(COMPANY: Company): LegalDocument {
  const postalAddress = [COMPANY.legalName, ...COMPANY.addressLines].join(", ");
  return {
  title: "Privacy policy",
  description:
    "What personal information Global Landmark Realty Group collects, why, how long it is kept, and the rights you have over it.",
  intro:
    "This policy explains what we collect when you enquire about a property, why we hold it, and what you can ask us to do with it.",
  updated: UPDATED,
  sections: [
    {
      heading: "Who we are",
      body: [
        `${COMPANY.legalName} is a real estate brokerage operating across the Tricity — ${COMPANY.markets.join(", ")}. In this policy, "we", "us" and "our" mean ${COMPANY.legalName}.`,
        `You can reach us at ${COMPANY.email}, on ${COMPANY.phone}, or by post at ${postalAddress}.`,
      ],
    },
    {
      heading: "What we collect",
      body: [
        "We only collect what you give us. We do not buy contact lists, and we do not build profiles of people who have not contacted us.",
      ],
      list: [
        "Your name, phone number and email address, when you submit an enquiry, request a viewing, ask for a valuation, or offer a property for sale.",
        "What you tell us you are looking for — budget, locality, property type, possession timeline — so we can send relevant listings rather than all of them.",
        "Details of a property you are offering to sell or let, including its address and any documents you choose to share with us.",
        "The content of messages you send us, including over WhatsApp, email and our contact forms.",
        "Basic technical information your browser sends automatically, such as pages visited, so we can keep the site working.",
      ],
    },
    {
      heading: "Why we hold it",
      body: [
        "To answer your enquiry, arrange viewings, match you to listings, and carry a transaction through to registry. We also use your details to meet record-keeping obligations that apply to property transactions in India.",
        "We do not sell your personal information to anyone, and we do not share it for anyone else's marketing.",
      ],
    },
    {
      heading: "WhatsApp and messaging",
      body: [
        "If you contact us on WhatsApp, or ask us to, we use the WhatsApp Business Platform to reply. Those messages are delivered by WhatsApp and are covered by WhatsApp's own privacy policy in addition to this one.",
        "We message you about the enquiry you made, or about listings you asked to hear about. You can tell us to stop at any time — reply STOP, or write to us — and we will stop.",
      ],
    },
    {
      heading: "Who else sees it",
      body: [
        "Only where it is needed to do the thing you asked us to do:",
      ],
      list: [
        "The seller, builder or their representative, when you ask to view or negotiate on a specific property.",
        "Service providers who run parts of our operation for us — our website host, our email provider, and WhatsApp — under an obligation to keep it confidential and to use it only for us.",
        "Government authorities, where the law requires it of us.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Enquiries that go nowhere are kept for up to three years, so we can pick the conversation back up if you return. Records connected to a completed transaction are kept for as long as property and tax law requires us to hold them.",
        "You can ask us to delete your information sooner, and we will unless we are legally required to keep it.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Under the Digital Personal Data Protection Act, 2023 you can ask us to:",
      ],
      list: [
        "Tell you what we hold about you and who we have shared it with.",
        "Correct anything that is wrong or out of date.",
        "Delete what we hold, where we are not required to keep it.",
        "Withdraw a consent you previously gave — this does not undo anything done before you withdrew it.",
        "Nominate someone to exercise these rights on your behalf if you are unable to.",
      ],
    },
    {
      heading: "Children",
      body: [
        "This site is meant for adults buying, selling or letting property. We do not knowingly collect information about anyone under 18, and we do not profile or run targeted advertising at children. If you believe a child has sent us their details, tell us and we will delete them.",
      ],
    },
    {
      heading: "Where your information goes",
      body: [
        "Our website and database are hosted in India. Two things leave it: email, which is delivered by our email provider, and WhatsApp messages, which are delivered by Meta and may be processed on servers outside India under Meta’s own terms. We do not transfer your information anywhere else.",
      ],
    },
    {
      heading: "If something goes wrong",
      body: [
        "If personal information we hold is exposed, we will tell the Data Protection Board of India and the people affected, describing what happened, what it covered, and what we are doing about it.",
      ],
    },
    {
      heading: "Grievance Officer",
      body: grievanceBody(COMPANY),
    },
    {
      heading: "Security",
      body: [
        "The site is served over HTTPS, enquiries reach us over encrypted connections, and access to our records is limited to the people in the firm who need it. No system is perfectly secure, and we will not pretend otherwise — but we do not hold payment card details, and we never ask for them.",
      ],
    },
    {
      heading: "Cookies",
      body: [
        "We use only what the site needs to function — remembering a form you have part-filled, and keeping an admin session signed in. We do not run advertising trackers and we do not sell analytics data about you.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "If this policy changes, the date at the top changes with it. Material changes will be flagged on the site rather than made quietly.",
      ],
    },
  ],
  };
}

export function termsOfUse(COMPANY: Company): LegalDocument {
  const postalAddress = [COMPANY.legalName, ...COMPANY.addressLines].join(", ");
  return {
  title: "Terms of use",
  description:
    "The terms on which Global Landmark Realty Group makes this website and its Tricity property listings available, and what a listing does and does not promise.",
  intro:
    "These terms cover what this website is, what our listings are and are not, and what you can expect from us.",
  updated: UPDATED,
  sections: [
    {
      heading: "About these terms",
      body: [
        `This website is operated by ${COMPANY.legalName}, ${postalAddress}. By using it you accept these terms. If you do not, please do not use the site.`,
      ],
    },
    ...(hasRegistration(LEGAL_DETAILS)
      ? [
          {
            // Rendered only once there is something real to put in it. An
            // empty "Registration" heading on a compliance page invites
            // exactly the question it is meant to answer.
            heading: "Registration",
            body: [] as string[],
            list: [
              LEGAL_DETAILS.registeredName && `Registered name: ${LEGAL_DETAILS.registeredName}`,
              LEGAL_DETAILS.registeredAddress.length &&
                `Registered address: ${LEGAL_DETAILS.registeredAddress.join(", ")}`,
              LEGAL_DETAILS.organisationType &&
                `Constitution: ${LEGAL_DETAILS.organisationType}${LEGAL_DETAILS.proprietor ? ` — proprietor ${LEGAL_DETAILS.proprietor}` : ""}`,
              LEGAL_DETAILS.udyam && `Udyam (MSME) registration: ${LEGAL_DETAILS.udyam}`,
              LEGAL_DETAILS.enterpriseType && `Classification: ${LEGAL_DETAILS.enterpriseType}`,
              LEGAL_DETAILS.nicCodes.length &&
                `Registered activity: ${LEGAL_DETAILS.nicCodes.join("; ")}`,
              LEGAL_DETAILS.cin && `CIN: ${LEGAL_DETAILS.cin}`,
              LEGAL_DETAILS.gstin && `GSTIN: ${LEGAL_DETAILS.gstin}`,
              LEGAL_DETAILS.reraNumber && `RERA registration: ${LEGAL_DETAILS.reraNumber}`,
            ].filter((line): line is string => Boolean(line)),
          },
        ]
      : []),
    {
      heading: "What we do",
      body: [
        "We are a real estate brokerage. We introduce buyers and sellers, arrange viewings, and assist a transaction through to registry. We are not the owner or developer of the properties listed here unless a listing says so explicitly.",
      ],
    },
    {
      heading: "Listings are information, not an offer",
      body: [
        "Everything published here — prices, areas, floor plans, possession dates, amenities, photographs — is provided to help you decide whether a property is worth viewing. It does not constitute an offer, and nothing on this site forms a contract.",
        "Property details change, and they change quickly. Availability, price and possession dates in particular can move between a listing being published and you reading it. Confirm anything you intend to rely on with us directly, and satisfy yourself independently before committing money.",
        "Photographs and floor plans are indicative. Carpet, built-up and super built-up areas are as supplied to us by the owner or developer, and should be verified against the sale documents.",
      ],
    },
    {
      heading: "Verify the title and the approvals",
      body: [
        "We only market properties we have been given documentation for, but we are not a substitute for your own due diligence. Before you commit, have your advocate examine the title, the encumbrance position, the approved plans and the occupancy or completion certificate.",
        `${COMPANY.compliance}`,
      ],
    },
    {
      heading: "Enquiries you send us",
      body: [
        "When you send an enquiry or list a property with us, you confirm that the details you give are accurate and that you are entitled to offer the property. We may decline to publish or act on anything we cannot verify.",
        "How we handle the personal information in your enquiry is set out in our privacy policy.",
      ],
    },
    {
      heading: "Our content",
      body: [
        `The text, photographs, layout and branding on this site belong to ${COMPANY.legalName} or to the owners who supplied them. You may read, print and share pages for your own use in evaluating a property. You may not republish our listings, scrape the site, or use our name or marks commercially without our written permission.`,
      ],
    },
    {
      heading: "Other people's sites",
      body: [
        "Where we link out — to a developer, a RERA portal, a map or a news article — we do not control what is there and are not responsible for it.",
      ],
    },
    {
      heading: "Availability",
      body: [
        "We try to keep the site up and current, but we do not guarantee that it will be uninterrupted or free of errors, and we may change or withdraw any listing at any time.",
      ],
    },
    {
      heading: "Liability",
      body: [
        "Nothing here limits any liability that cannot be limited under Indian law, including for fraud. Subject to that, we are not liable for a decision you take on the strength of listing information you did not verify with us or with your own advisers.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the laws of India. The registered office is at Zirakpur, SAS Nagar district, Punjab, and the courts there have jurisdiction over any dispute arising from them.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `Questions about these terms: ${COMPANY.email}, or ${COMPANY.phone}.`,
      ],
    },
  ],
  };
}

/**
 * Data deletion instructions.
 *
 * Its own page because Meta asks for a dedicated "Data Deletion Instructions
 * URL" when an app touches user data — a privacy policy that mentions
 * deletion somewhere in it does not satisfy that field, and the client's
 * checklist lists it separately for the same reason.
 *
 * It is also the DPDP Act's erasure right, written as a procedure someone
 * can actually follow rather than as a right they have to infer.
 */
export function dataDeletion(COMPANY: Company): LegalDocument {
  const officer = LEGAL_DETAILS.grievanceOfficer;
  return {
    title: "Data deletion",
    description:
      "How to ask Global Landmark Realty Group to delete the personal information it holds about you, and what happens when you do.",
    intro:
      "You can ask us to delete what we hold about you. This page says how, and what we are able to remove.",
    updated: UPDATED,
    sections: [
      {
        heading: "How to ask",
        body: [
          `Send us a deletion request — email ${officer.email || COMPANY.email}, or WhatsApp or call ${COMPANY.phone}. Say that you want your data deleted, and give us the phone number or email address you originally contacted us on so we can find your record.`,
          "You do not need to give a reason, and asking costs nothing.",
        ],
      },
      {
        heading: "What happens next",
        body: [
          "We acknowledge the request within 72 hours and complete it within 30 days. If anything stops us deleting a part of it, we tell you which part and why rather than quietly leaving it.",
        ],
      },
      {
        heading: "What gets deleted",
        body: ["Everything we hold that identifies you:"],
        list: [
          "Your enquiry, viewing request or valuation request, with the name, phone number and email on it.",
          "Your requirements — budget, localities, property type.",
          "Notes and call logs recorded against you, and any WhatsApp or email correspondence we hold.",
          "Details and documents for a property you offered us that we did not go on to transact.",
        ],
      },
      {
        heading: "What we may have to keep",
        body: [
          "If we completed a transaction for you, Indian property and tax law requires us to retain those records for a set period. We keep only what the law requires, use it for nothing else, and delete it when the period ends.",
          "Where a listing you supplied is already published, deleting your personal details removes you from it; the listing itself is withdrawn separately, and you can ask for that at the same time.",
        ],
      },
      {
        heading: "Facebook and WhatsApp",
        body: [
          "If you reached us through a Meta service, deleting your data here removes it from our records. It does not delete anything held by Meta on their own systems — for that, use the data controls in your Facebook, Instagram or WhatsApp account.",
        ],
      },
      {
        heading: "If we get it wrong",
        body: grievanceBody(COMPANY),
      },
    ],
  };
}

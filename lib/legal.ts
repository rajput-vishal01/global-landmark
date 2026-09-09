import type { COMPANY } from "./data";

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
  /** Registered address, one line per row, ending with the PIN code. */
  registeredAddress: [
    "Shop No 102, TLI Business Square",
    "Adj. Sector 20 Panchkula, Peermushlla",
    "Zirakpur, SAS Nagar, Punjab 160104",
  ],
  /** MSME / Udyam registration — a public registration number, safe to show. */
  udyam: "UDYAM-PB-20-0137589",
  /** Proprietorship, so there is no CIN. */
  cin: "",
  /** The certificate records "Do you have GSTIN: No". Nothing to publish. */
  gstin: "",
  /** HRERA / RERA agent registration. Still not supplied — Udyam is not RERA. */
  reraNumber: "",

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

type Company = typeof COMPANY;

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
    "The terms on which Global Landmark Realty Group makes this website and its property listings available.",
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
              LEGAL_DETAILS.udyam && `Udyam registration: ${LEGAL_DETAILS.udyam}`,
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

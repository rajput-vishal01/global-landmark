/**
 * SINGLE SOURCE OF COMPANY DATA
 * -----------------------------
 * Every company-specific word on the site lives here: identity, contact
 * details, stats, section copy, page copy, imagery. Replace the values in
 * this file with the real client's information and the entire site updates.
 *
 * Not here on purpose: portfolio listings (admin panel / database), nav
 * structure (components/sections/nav-links.ts), category taxonomy
 * (lib/categories.ts), form field labels and generic UI strings.
 */

// ─── Identity & contact ────────────────────────────────────────────────────

export const COMPANY = {
  /** Wordmark line 1 — appears in the nav, menu, footer, emails. */
  name: "Global Landmark",
  /** Wordmark line 2 / descriptor. */
  tagline: "Realty Group",
  legalName: "Global Landmark Realty Group",
  license: "RERA-Compliant Real Estate Brokers", // append registration no. when the client provides it
  compliance:
    "RERA Compliant · All transactions closed over verified documentation",

  // Email not listed publicly — replace with the agency's real inbox.
  email: "inquiries@globallandmark.com",
  phone: "+91 98820-84786",
  phoneHref: "tel:+919882084786",
  phoneAlt: "+91 70090-00164",
  phoneAltHref: "tel:+917009000164",
  addressLines: ["Based in Panchkula", "Tricity, India"],
  markets: ["Panchkula", "Chandigarh", "Mohali", "Zirakpur"],

  socials: [
    {
      label: "Instagram",
      href: "https://www.instagram.com/globallandmarkrealtygroup/",
    },
    { label: "X", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
  ],
};

export const SEO = {
  title: "Global Landmark Realty Group | Tricity Luxury Real Estate",
  description:
    "Landmark residences across Chandigarh, Panchkula, Mohali and Zirakpur. Considered representation, private dealing.",
  /** Branded card rendered by app/og/route.tsx; resolved against metadataBase. */
  ogImage: "/og",
};

// ─── Landing page ──────────────────────────────────────────────────────────

export const HERO = {
  /** Rendered on separate lines. */
  headline: ["Luxury", "Redefined"],
  sub: "Landmark residences, privately represented.",
  searchPlaceholder: "Search residences, locations, projects",
  exploreLabel: "Explore",
  /** One slide per portfolio category; categories come from lib/categories. */
  slides: [
    {
      category: "sale",
      label: "Sale",
      img: "/local/tricity-courtyard-night.jpg",
      alt: "Landscaped courtyard lit at night beneath residential towers in Zirakpur",
    },
    {
      category: "purchase",
      label: "Purchase",
      img: "/local/tricity-avenue.jpg",
      alt: "A tree-lined avenue running between residential towers in the Tricity",
    },
    {
      category: "lease",
      label: "Lease",
      img: "/local/tricity-lounge.jpg",
      alt: "Residents lounge inside a Tricity apartment clubhouse",
    },
    {
      category: "invest",
      label: "Invest",
      img: "/local/tricity-pool.jpg",
      alt: "The indoor pool at a Tricity residential development",
    },
  ],
};

/**
 * The band under the hero. It carries a claim and nothing to count.
 *
 * The counters that used to sit here — value sold, properties transacted,
 * years in the Tricity — are gone at the client's instruction. No figure
 * the client cannot back up if a buyer asks appears anywhere on the site,
 * and that is easiest to guarantee by there being no figure at all.
 */
export const CREDIBILITY = {
  eyebrow: "Our Record",
  headingPre: "A portfolio built on",
  headingHighlight: "repeat clients",
  headingPost: "and referrals",
  sub: "Considered residences across the Tricity, trusted by the most private buyers and sellers.",
};

export const ABOUT_SPLIT = {
  // Was "Built on landmark sales" — replaced along with the figures, since
  // it was the same claim in words.
  heading: "Represented properly, start to finish",
  body: "Every property walked before it is listed, every enquiry answered by someone who has stood in it. Our clients stay private. Our work does not.",
  image: "/local/tricity-clubhouse.jpg",
  alt: "The residents clubhouse at a Tricity development",
  ctaLabel: "About the Group",
};

/**
 * Developers whose projects Global Landmark brokers.
 *
 * This replaced an "As featured in" strip listing The Economic Times, Times
 * of India, Business Standard, Mint, The Tribune and Hindustan Times. The
 * agency has never been covered by any of them — it was placeholder copy
 * that read as a claim, and an unverifiable press claim is the kind of
 * thing a buyer checks. Developer names are a stronger signal anyway: they
 * are true, they are local, and they are what a Tricity buyer recognises.
 *
 * Keep this list to developers the client genuinely deals with. Remove a
 * name the moment that stops being true.
 */
export const DEVELOPERS = [
  "Homeland Group",
  "Green Lotus",
  "Trishla City",
  "Suncity Projects",
  "Omaxe",
  "GMADA",
];


export const TESTIMONIALS = {
  heading: "From the Ground",
  sub: "Walkthroughs and updates from the projects and plots we represent.",
};

export const CTA_BAND = {
  heading: "List With Global Landmark",
  sub: "A private valuation, held to the standard of every residence we represent.",
  ctaLabel: "Request a Valuation",
};

/** Randomized placeholder activity for the bottom ticker (client request). */
export const TICKER = {
  names: [
    "A. Mehra",
    "S. Kapoor",
    "R. Malhotra",
    "N. Verma",
    "K. Sandhu",
    "P. Reddy",
    "G. Bajwa",
    "T. Chatterjee",
    "V. Nair",
    "D. Khurana",
    "M. Gill",
    "H. Sethi",
    "J. Ahluwalia",
    "C. Chopra",
    "B. Saini",
  ],
  events: [
    "booked a site visit to {p}",
    "requested the brochure for {p}",
    "scheduled a private viewing of {p}",
    "inquired about {p}",
    "requested a call about {p}",
    "shortlisted {p}",
  ],
  properties: [
    "a Zirakpur builder floor",
    "a Panchkula penthouse",
    "a Mohali corner plot",
    "an Aerocity residence",
    "a Peer Muchalla apartment",
    "an off-market sector plot",
  ],
};

export const WHATSAPP = {
  // Ends mid-sentence on purpose: the visitor lands in WhatsApp with the
  // greeting written and one blank to fill, which is a far easier first
  // message to send than an empty thread containing the word "Hi".
  defaultMessage: "Hi Global Landmark! I have been looking at ",
  modalTitle: "Contact us for more details",
  modalBody: "Tell us what you are considering.",
};

// ─── Subpages ──────────────────────────────────────────────────────────────

export const PROPERTIES_PAGE = {
  title: "Exclusive Listings",
  subSuffix: "Off-market introductions on request.",
  emptySub: "The portfolio is being prepared.",
  emptyBody:
    "Nothing here at the moment. Speak with us for off-market introductions.",
};

export const PROPERTY_DETAIL = {
  sidebarNote: "Pricing is discussed privately. Speak with us for a viewing.",
  inquiryHeading: "Request a Private Viewing",
  inquirySub: "We respond within one business day.",
  whatsAppMessagePrefix: "Hi, I would like to know more about",
};

export const PROJECT_DETAIL = {
  inquiryHeading: "Enquire About This Project",
  inquirySub: "We respond within one business day.",
  emptyUnitsNote:
    "No units are currently listed for this project. Speak with us for off-market availability.",
};

export const CONTACT_PAGE = {
  title: "Contact",
  sub: "Answered personally within one business day.",
};

export const NEWS_PAGE = {
  title: "Market News",
  sub: "Property coverage from across the Tricity — Chandigarh, Panchkula, Mohali and Zirakpur.",
  emptyTitle: "The briefing returns shortly.",
  emptyBody:
    "No Tricity property stories in the last 48 hours. Speak with us directly for current conditions.",
};

export const ABOUT_PAGE = {
  title: "The Group",
  // No founding year, no "N years in the market" and no dealt-value figure
  // anywhere on this page, at the client's instruction — the group is
  // described by how it works, not by how long or how much.
  facts: [
    ["Home office", "Panchkula"],
    ["Markets", "Tricity"],
    ["Focus", "Residential & commercial"],
  ] as [string, string][],
  // An exterior, deliberately: the split image above this band is already an
  // interior, and the ethos copy is about how the work is done rather than
  // about amenities — a screening room sells facilities, which is a
  // different argument entirely.
  ethosImage: "/local/tricity-towers-night.jpg",
  ethosImageAlt: "Lit residences at dusk in a Tricity development",
  ethosHeading:
    "Most brokerages measure themselves by how much they list. We measure ourselves by what we deliver.",
  ethosParagraphs: [
    "Global Landmark was founded on a narrow premise: a property represented completely will always outperform one handled adequately. Every property we take on is walked by the team and prepared as if it were the only one on the books.",
    "Photography is commissioned per residence. Viewings are arranged personally, and every enquiry is answered by someone who has actually stood in the property.",
  ],

  /**
   * Four values, because three reads as a slogan and five as a policy
   * document. Each is a noun the client used themselves — trust,
   * transparency, professionalism — plus the one their bios keep returning
   * to: understanding the requirement before recommending anything.
   */
  valuesHeading: "Our Values",
  valuesSub:
    "The four things every engagement is held to, whether it is a first flat or a portfolio purchase.",
  values: [
    [
      "Trust",
      "Advice you can act on, including when it costs us the deal. If a property is wrong for you, we say so.",
    ],
    [
      "Transparency",
      "The full picture up front — pricing, paperwork, what is settled and what is not. No detail surfaces late.",
    ],
    [
      "Professionalism",
      "Every property verified and prepared before it is shown, and every enquiry answered by someone who knows it.",
    ],
    [
      "Understanding first",
      "We start with what you actually need — a home, a plot, an investment — and recommend second.",
    ],
  ] as [string, string][],

  principalsHeading: "The Founders",
  principalsNote: "One senior team, every engagement",
  // The client's own profiles, in their words. Ashu's portrait is the real
  // one, supplied by the client; Divya's is still a placeholder and is the
  // last stock photograph standing in for a named person on this site.
  principals: [
    {
      name: "Ashu Goyal",
      title: "Founder & Managing Director",
      // Highest qualification first, at the client's instruction.
      credentials: "MBA, Panjab University · B.A. (Honours) English",
      image: "/local/ashu-goyal.jpg",
      bio: [
        "Ashu Goyal is the Founder and Managing Director of Global Landmark Realty Group, a professionally managed real estate consultancy focused on Chandigarh, Panchkula, Mohali and emerging investment destinations. He completed his B.A. (Honours) in English and went on to an MBA from Panjab University, an education that shaped his approach to business, communication, client relationships and strategic decision-making.",
        "His focus is on identifying quality properties, promising investment opportunities and value-driven deals, guided by three principles: trust, transparency and professionalism. He works closely with clients to understand their individual goals and guide them through every stage of the property journey — from identifying the right opportunity and evaluating the investment through to negotiation and closing.",
        "His vision is to establish Global Landmark Realty Group as a trusted and respected real estate advisory brand, known not only for its property expertise but for the long-term relationships it builds with clients.",
      ],
      quote:
        "Real estate is not just about buying a property; it is about making the right decision for your future.",
    },
    {
      name: "Divya Goyal",
      title: "Co-Founder",
      credentials: "LL.B., Panjab University · B.Com",
      image:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=700&auto=format&fit=crop",
      bio: [
        "Divya Goyal is the Co-Founder of Global Landmark Realty Group, driven by a simple belief — real estate is not just about properties; it is about people, dreams, and the future they envision.",
        "A Commerce and Law graduate of Panjab University, her B.Com and LL.B. give her a firm grounding in the financial and legal side of property transactions, while her experience in the business has built a deep understanding of clients and their individual requirements. After completing her education she joined her husband, Ashu Goyal, in the business, and together they built Global Landmark Realty Group around honest advice, carefully selected properties and a smooth buying experience.",
        "She does not see herself as a traditional broker, but as a bridge between a client's dream and the right property. Whether the client is looking for a home, a plot for the future or a sound investment, she believes in understanding the need first and guiding the decision second — on trust, transparency, personal attention and long-term relationships.",
      ],
      quote:
        "I am not here just to sell a property. I am here to become the medium through which my clients can fulfill their property dreams.",
    },
  ],

  closingLine: "If your property belongs in this company, we should speak.",
  closingCta: "Start the Conversation",
};

/**
 * The founders' message, in the client's own words. Its own constant rather
 * than more ABOUT_PAGE keys because it renders as its own component and is
 * meant to read as a signed statement, not as another page section.
 */
export const FOUNDERS_MESSAGE = {
  eyebrow: "A message from the founders",
  heading: "Invest With Confidence",
  standfirst:
    "Your investment deserves more than a property. It deserves the right guidance.",
  body: [
    "At Global Landmark Realty Group, we understand that every investment represents a goal — financial growth, future security, a dream home, or a better tomorrow for your family.",
    "Our role is to understand your requirements, investment objectives and budget, and then help you identify the right property opportunities. From selecting the location and evaluating the property to understanding the documentation and completing the transaction, we aim to make the entire process simple, transparent and informed.",
    "We do not believe in simply selling properties. We believe in building trust and helping our clients make decisions they can feel confident about.",
    "With our knowledge of the Tricity real estate market and a carefully selected range of properties, we work to connect our clients with opportunities that match their individual needs.",
  ],
  closingHeading: "Your Vision. Your Investment. Our Commitment.",
  closingBody: [
    "We understand that buying a property is not just a financial decision. It is often connected to your family's future, your hard-earned savings, your dreams, and the life you want to build.",
    "That is why we take the time to listen to your needs, understand your priorities, and guide you with honesty and care. Whether you are purchasing your first home, investing for the future, or looking for the right commercial opportunity, we believe you deserve clear advice and genuine support at every step.",
    "With Global Landmark Realty Group, you are not just choosing a property. You are choosing a trusted partner who stands beside you from the first conversation to the final decision.",
  ],
  signOff:
    "Let Global Landmark Realty Group be your trusted medium in turning your property vision into reality.",
  signature: "Ashu Goyal & Divya Goyal",
  signatureRole: "Founders, Global Landmark Realty Group",
};

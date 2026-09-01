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
      img: "https://images.unsplash.com/photo-1711114377419-09b0cd2d786b?q=80&w=2400&auto=format&fit=crop",
      alt: "A private pool villa in Maharashtra, wrapped in landscaped gardens",
    },
    {
      category: "purchase",
      label: "Purchase",
      img: "https://images.unsplash.com/photo-1632400990400-416d5460f337?q=80&w=2400&auto=format&fit=crop",
      alt: "Modern residential towers of a gated society against a clear sky",
    },
    {
      category: "lease",
      label: "Lease",
      img: "https://images.unsplash.com/photo-1564834552305-aea63611ff08?q=80&w=2400&auto=format&fit=crop",
      alt: "A modern apartment tower with balconies against a clear blue sky in Noida",
    },
    {
      category: "invest",
      label: "Invest",
      img: "https://images.unsplash.com/photo-1623668864555-4bb967176e6c?q=80&w=2400&auto=format&fit=crop",
      alt: "The Mumbai skyline at Worli, seen from above",
    },
  ],
};

export const CREDIBILITY = {
  eyebrow: "Our Record",
  // No figure in the heading: the stats directly below already carry the
  // ₹385 Cr number, and saying it twice in one band read as a duplicate
  // rather than as emphasis.
  headingPre: "A portfolio built on",
  headingHighlight: "repeat clients",
  headingPost: "and referrals",
  sub: "Considered residences across the Tricity, trusted by the most private buyers and sellers.",
  stats: [
    { value: 385, prefix: "₹", suffix: " Cr+", label: "Worth of Real Estate Sold" },
    { value: 120, prefix: "", suffix: "+", label: "Happy Families" },
  ],
};

export const ABOUT_SPLIT = {
  heading: "Built on landmark sales",
  body: "The residences other brokerages call career-defining. Our clients stay private. Our results do not.",
  image:
    "https://images.unsplash.com/photo-1777816268139-7c5ba8399d48?q=80&w=1400&auto=format&fit=crop",
  alt: "A white colonial-style bungalow in Fort Kochi, Kerala",
  ctaLabel: "About the Group",
};

export const PRESS = [
  "The Tribune",
  "Hindustan Times",
  "The Economic Times",
  "Times of India",
  "Business Standard",
  "Mint",
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
  // No founding year and no "N years in the market" anywhere on this page,
  // at the client's instruction — the group is described by how it works,
  // not by how long it has been working.
  facts: [
    ["Home office", "Panchkula"],
    ["Markets", "Tricity"],
    ["Sold to date", "₹385 Cr+"],
  ] as [string, string][],
  ethosImage:
    "https://images.unsplash.com/photo-1623668864555-4bb967176e6c?q=80&w=1600&auto=format&fit=crop",
  ethosImageAlt: "The Mumbai skyline at Worli, seen from above",
  ethosHeading:
    "Most brokerages measure themselves by how much they list. We measure ourselves by what we decline.",
  ethosParagraphs: [
    "Global Landmark was founded on a narrow premise: a few exceptional residences, represented completely, will always outperform a large inventory handled adequately. Every property we accept is walked by a principal and prepared as if it were the only one on the books.",
    "Photography is commissioned per residence. Showings are private and few, and most sales close without ever appearing on a public listing.",
  ],

  principalsHeading: "The Founders",
  principalsNote: "One senior team, every engagement",
  // The client's own profiles, in their words. Photographs are placeholders
  // until their portraits arrive — swap the image URLs only.
  principals: [
    {
      name: "Ashu Goyal",
      title: "Founder & Managing Director",
      credentials: "B.A. (Honours) English · MBA, Panjab University",
      image:
        "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=700&auto=format&fit=crop",
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
      credentials: "B.Com · LL.B., Panjab University",
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

  recordHeading: "The record",
  record: [
    { label: "Micro-markets", value: "6" },
    { label: "Sales volume", value: "₹385 Cr+" },
    { label: "Properties transacted", value: "120+" },
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

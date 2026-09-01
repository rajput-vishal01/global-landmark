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
  // With videos present the section shows them; the written quotes below are
  // the fallback until real client videos replace the current project reels.
  heading: "From the Ground",
  sub: "Walkthroughs and updates from the projects and plots we represent.",
  quotes: [
    {
      quote:
        "One person answered every call for eleven months. No other firm has done that for us.",
      name: "S. Kapoor",
      role: "Buyer, Zirakpur",
    },
    {
      quote:
        "The presentation of our home was better than our own company's campaigns.",
      name: "H. Bedi",
      role: "Seller, Panchkula",
    },
    {
      quote:
        "We asked for discretion above all. Not one neighbour knew until we told them.",
      name: "A. Rehman",
      role: "Seller, Mohali",
    },
    {
      quote:
        "Every question about yield was answered with numbers, not adjectives.",
      name: "C. Chopra",
      role: "Investor, Aerocity",
    },
    {
      quote:
        "They walked away from the first offer on our behalf. The second paid for the advice many times over.",
      name: "J. Bajwa",
      role: "Buyer, Chandigarh",
    },
  ],
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
  nudgeTitle: "Considering a residence?",
  nudgeBody:
    "Contact us for more details — we respond within one business day.",
  nudgeCta: "Start an Inquiry",
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

export const SELL_PAGE = {
  title: "Sell With Us",
  sub: "A private valuation and a discreet, well-matched buyer pool across the Tricity.",
};

export const NEWS_PAGE = {
  title: "Market News",
  sub: "The coverage shaping Indian property and investment.",
  emptyTitle: "The briefing returns shortly.",
  emptyBody:
    "The feed is being prepared. Speak with us directly for current conditions.",
};

export const ABOUT_PAGE = {
  title: "The Group",
  facts: [
    ["Est.", "2009"],
    ["Home office", "Panchkula"],
    ["Sold to date", "₹85 Cr+"],
  ] as [string, string][],
  ethosImage:
    "https://images.unsplash.com/photo-1623668864555-4bb967176e6c?q=80&w=1600&auto=format&fit=crop",
  ethosImageAlt: "The Mumbai skyline at Worli, seen from above",
  ethosHeading:
    "Most brokerages measure themselves by how much they list. We measure ourselves by what we decline.",
  ethosParagraphs: [
    "Global Landmark was founded on a narrow premise: a few exceptional residences, represented completely, will always outperform a large inventory handled adequately. Every property we accept is walked by a principal and prepared as if it were the only one on the books.",
    "Photography is commissioned per residence. Showings are private and few. Most sales close without ever appearing on a public listing — and the average client relationship now runs nine years.",
  ],
  historyHeading: "Fifteen years, four chapters",
  milestones: [
    {
      year: "2009",
      title: "Founded in Panchkula",
      body: "A two-person desk representing a single kothi. The sale sets a sector record that stands for years.",
    },
    {
      year: "2014",
      title: "The first ₹10 Crore year",
      body: "A run of off-market kothi and penthouse transactions builds a reputation for quiet, record-setting sales.",
    },
    {
      year: "2019",
      title: "Across the Tricity",
      body: "Desks open for Zirakpur, Mohali, and Chandigarh. A city practice becomes the region's private brokerage.",
    },
    {
      year: "2026",
      title: "Today",
      body: "Over ₹85 Crore in landmark sales — and the same standard as day one: few properties, chosen carefully.",
    },
  ],
  principalsHeading: "The Principals",
  principalsNote: "One senior team, every engagement",
  // Real names from the client. Photos are placeholders — swap the image URLs.
  principals: [
    {
      name: "Ashu Goyal",
      title: "Founding Principal",
      image:
        "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=700&auto=format&fit=crop",
    },
    {
      name: "Divya Goyal",
      title: "Head of Sales",
      image:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=700&auto=format&fit=crop",
    },
  ],
  recordHeading: "The record",
  record: [
    { label: "Founded", value: "2009" },
    { label: "Micro-markets", value: "6" },
    { label: "Sales volume", value: "₹85 Cr+" },
    { label: "Properties transacted", value: "120+" },
    { label: "Average client tenure", value: "9 years" },
  ],
  closingLine: "If your property belongs in this company, we should speak.",
  closingCta: "Start the Conversation",
};

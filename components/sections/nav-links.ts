// Header dropdowns (aaronkirman-style: three left menus + right CONTACT)
export const HEADER_MENUS = [
  {
    label: "About",
    href: "/about",
    items: [
      { label: "The Group", href: "/about" },
      { label: "Our Agents", href: "/agents" },
      { label: "Press", href: "/journal" },
    ],
  },
  {
    label: "Listings",
    href: "/properties",
    items: [
      { label: "Exclusive Listings", href: "/properties" },
      { label: "Sold Listings", href: "/properties?status=sold" },
      { label: "Communities", href: "/communities" },
    ],
  },
  {
    label: "Media",
    href: "/journal",
    items: [
      { label: "Journal", href: "/journal" },
      { label: "Market Insights", href: "/journal" },
    ],
  },
];

// Fullscreen menu — numbered groups, aaronkirman-style
export const MENU_GROUPS = [
  {
    n: "01",
    label: "Home",
    href: "/",
    items: [],
  },
  {
    n: "02",
    label: "The Group",
    href: "/about",
    items: [
      { label: "About Global Landmark", href: "/about" },
      { label: "Our Agents", href: "/agents" },
      { label: "Careers", href: "/contact" },
    ],
  },
  {
    n: "03",
    label: "Listings",
    href: "/properties",
    items: [
      { label: "Exclusive Listings", href: "/properties" },
      { label: "Sold Listings", href: "/properties?status=sold" },
      { label: "International", href: "/properties" },
      { label: "Communities", href: "/communities" },
    ],
  },
  {
    n: "04",
    label: "Services",
    href: "/services/buy",
    items: [
      { label: "Buy", href: "/services/buy" },
      { label: "Sell", href: "/services/sell" },
      { label: "Invest", href: "/services/invest" },
    ],
  },
  {
    n: "05",
    label: "Journal",
    href: "/journal",
    items: [],
  },
  {
    n: "06",
    label: "Contact",
    href: "/contact",
    items: [],
  },
];

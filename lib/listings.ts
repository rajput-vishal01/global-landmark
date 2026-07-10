export type Listing = {
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  image: string;
  href: string;
};

export const LISTINGS: Listing[] = [
  {
    title: "The Meridian Penthouse",
    location: "Harbor Point",
    price: "$12,500,000",
    beds: 4,
    baths: 5,
    sqft: "6,200",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
    href: "/properties",
  },
  {
    title: "Sail House Sky Residence",
    location: "Meridian Quarter",
    price: "$8,750,000",
    beds: 3,
    baths: 3,
    sqft: "3,900",
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop",
    href: "/properties",
  },
  {
    title: "The Ridgeline Estate",
    location: "The Ridgeline",
    price: "$19,800,000",
    beds: 6,
    baths: 8,
    sqft: "11,400",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop",
    href: "/properties",
  },
  {
    title: "Meridian Villa",
    location: "Harbor Point",
    price: "$14,200,000",
    beds: 5,
    baths: 6,
    sqft: "7,400",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1200&auto=format&fit=crop",
    href: "/properties",
  },
  {
    title: "Sail House Terrace",
    location: "Meridian Quarter",
    price: "$6,400,000",
    beds: 2,
    baths: 3,
    sqft: "2,850",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop",
    href: "/properties",
  },
  {
    title: "The Sable Cove House",
    location: "Sable Cove",
    price: "Price on request",
    beds: 7,
    baths: 9,
    sqft: "14,600",
    image:
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1200&auto=format&fit=crop",
    href: "/properties",
  },
];

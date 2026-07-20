import type { NavGroup, NavLink } from "./types";

export const primaryNav: NavLink[] = [
  { label: "Research", href: "/research" },
  { label: "System", href: "/drishti" },
  { label: "Deployment", href: "/deployment" },
  { label: "Privacy", href: "/privacy" },
  { label: "Demo", href: "/demo" },
];

export const productDropdown: NavGroup = {
  label: "Product",
  items: [
    {
      label: "Drishti",
      href: "/drishti",
      description: "Room-level attention estimation",
    },
    {
      label: "Seat Graph",
      href: "/seat-graph",
      description: "Relational evidence between seats",
    },
    {
      label: "Explainable Alerts",
      href: "/seat-graph#counterfactual",
      description: "Counterfactual review cards",
    },
    {
      label: "Dashboard",
      href: "/demo",
      description: "Interactive product simulation",
    },
  ],
};

export const primaryCta: NavLink = { label: "View the system", href: "/demo" };
export const secondaryUtilityLink: NavLink = {
  label: "Architecture",
  href: "/research",
};

export const mobileNavLinks: NavLink[] = [
  { label: "Research", href: "/research" },
  { label: "Drishti", href: "/drishti" },
  { label: "Seat Graph", href: "/seat-graph" },
  { label: "Deployment", href: "/deployment" },
  { label: "Privacy", href: "/privacy" },
  { label: "Demo", href: "/demo" },
  { label: "Roadmap", href: "/roadmap" },
];

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export const footerColumns: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Drishti Attention Field", href: "/drishti" },
      { label: "Seat-Graph Evidence", href: "/seat-graph" },
      { label: "Interactive demo", href: "/demo" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Research",
    links: [
      { label: "Architecture & protocol", href: "/research" },
      { label: "Evaluation methodology", href: "/research#evaluation" },
      { label: "Limitations", href: "/research#limitations" },
    ],
  },
  {
    heading: "Deployment",
    links: [
      { label: "On-premise", href: "/deployment#on-premise" },
      { label: "Private network", href: "/deployment#private-network" },
      { label: "Offline / air-gapped", href: "/deployment#offline" },
    ],
  },
  {
    heading: "Principles",
    links: [
      { label: "Privacy posture", href: "/privacy" },
      { label: "Human review", href: "/privacy#human-review" },
      { label: "Trust principles", href: "/#trust-principles" },
    ],
  },
];

export const footerConnect: NavLink[] = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Roadmap", href: "/roadmap" },
];

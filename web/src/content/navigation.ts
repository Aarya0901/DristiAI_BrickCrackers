import type { NavGroup, NavLink } from "./types";

export const primaryNav: NavLink[] = [
  { label: "Research", href: "/research" },
  { label: "Deployment", href: "/deployment" },
  { label: "Privacy", href: "/privacy" },
  { label: "Demo", href: "/demo" },
];

export const productDropdown: NavGroup = {
  label: "Product",
  items: [
    {
      label: "Drishti Attention Field",
      href: "/drishti",
      description: "Room-level attention estimation from ordinary CCTV",
    },
    {
      label: "Seat Graph",
      href: "/seat-graph",
      description: "Relational evidence between anonymous seats",
    },
    {
      label: "Explainable Alerts",
      href: "/seat-graph#counterfactual",
      description: "Every review request states what would not have triggered it",
    },
    {
      label: "Dashboard",
      href: "/demo",
      description: "The invigilator surface",
    },
  ],
};

export const secondaryUtilityLink: NavLink = {
  label: "Architecture",
  href: "/research",
};

export const primaryCta: NavLink = { label: "View the system", href: "/demo" };

export const mobileNavLinks: NavLink[] = [
  { label: "Drishti", href: "/drishti" },
  { label: "Seat Graph", href: "/seat-graph" },
  { label: "Research", href: "/research" },
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
      { label: "Model stack", href: "/research#model-stack" },
      { label: "Limitations", href: "/research#limitations" },
    ],
  },
  {
    heading: "Deployment",
    links: [
      { label: "On-premise", href: "/deployment#on-premise" },
      { label: "Private network", href: "/deployment#private-network" },
      { label: "Offline / air-gapped", href: "/deployment#offline" },
      { label: "Failure modes", href: "/deployment#failure-modes" },
    ],
  },
  {
    heading: "Principles",
    links: [
      { label: "Privacy posture", href: "/privacy" },
      { label: "Human review", href: "/privacy#human-review" },
      { label: "DPDP alignment", href: "/privacy#dpdp" },
      { label: "Trust principles", href: "/#trust-principles" },
    ],
  },
];

export const footerConnect: NavLink[] = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Interactive demo", href: "/demo" },
];

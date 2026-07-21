import type { MetadataRoute } from "next";

const routes = [
  "",
  "/drishti",
  "/seat-graph",
  "/research",
  "/deployment",
  "/privacy",
  "/demo",
  "/roadmap",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://vigil.example.com${route}`,
    lastModified: new Date("2026-07-21"),
  }));
}

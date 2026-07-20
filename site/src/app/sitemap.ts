import type { MetadataRoute } from "next";

const routes = ["", "/drishti", "/seat-graph", "/research", "/deployment", "/privacy", "/demo", "/roadmap"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://vigil.example";
  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}

// Visual QA — screenshots every route at target viewports into visual-baselines/
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3456";
const ROUTES = [
  "/",
  "/drishti",
  "/seat-graph",
  "/research",
  "/deployment",
  "/privacy",
  "/demo",
  "/roadmap",
  "/no-such-page",
];
const VIEWPORTS = [
  { name: "desktop-1440x1000", width: 1440, height: 1000 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-430x932", width: 430, height: 932 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "big-1728x1117", width: 1728, height: 1117 },
];

mkdirSync("visual-baselines", { recursive: true });

const browser = await chromium.launch();
for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      console.error(`timeout: ${route} ${vp.name}`);
      await ctx.close();
      continue;
    }
    await page.waitForTimeout(800);
    const slug = route === "/" ? "home" : route.replace(/\//g, "").replace(/^home$/, "home") || "home";
    if (route === "/no-such-page") {
      const slug2 = "this-route-does-not-exist";
      await page.screenshot({ path: `visual-baselines/${slug2}-${vp.name}.png`, fullPage: true });
    } else {
      await page.screenshot({ path: `visual-baselines/${slug}-${vp.name}.png`, fullPage: true });
    }
    await ctx.close();
  }
  console.log(route);
}
await browser.close();
console.log("DONE: visual-baselines/");

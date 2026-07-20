// One-off Phase 0 audit script. Not part of the shipped app.
// Captures full-page screenshots + computed-style samples of the live
// Supermemory reference site at four breakpoints, for docs/reference-audit.md.
// Run: node scripts/reference-audit.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("docs/reference-screens");
const DATA_FILE = path.resolve("docs/reference-audit-data.json");
mkdirSync(OUT_DIR, { recursive: true });

const routes = [
  { slug: "home", url: "https://supermemory.ai/" },
  { slug: "research", url: "https://supermemory.ai/research/" },
  { slug: "connectors", url: "https://supermemory.ai/connectors/" },
  { slug: "memory-graph", url: "https://supermemory.ai/memory-graph/" },
  { slug: "rag", url: "https://supermemory.ai/rag/" },
  { slug: "personal", url: "https://supermemory.ai/personal/" },
  { slug: "pricing", url: "https://supermemory.ai/pricing/" },
  { slug: "case-studies", url: "https://supermemory.ai/case-studies/" },
];

const viewports = [
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "390x844", width: 390, height: 844 },
];

async function extractStyles(page) {
  return page.evaluate(() => {
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const body = document.body;
    const html = document.documentElement;

    const firstOfSelectorList = (selectors) => {
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) return el;
      }
      return null;
    };

    const h1 = document.querySelector("h1");
    const h2 = document.querySelector("h2");
    const p = document.querySelector("p");
    const nav = document.querySelector("nav") || document.querySelector("header");
    const button = firstOfSelectorList(["button", "a[class*='button']", "a[class*='btn']"]);
    const main =
      document.querySelector("main") ||
      document.querySelector("[class*='container']") ||
      body;
    const card = firstOfSelectorList([
      "[class*='card']",
      "article",
      "section > div > div",
    ]);
    const footer = document.querySelector("footer");

    const rectOf = (el) => (el ? el.getBoundingClientRect() : null);

    const describeEl = (el) => {
      if (!el) return null;
      const s = cs(el);
      const r = rectOf(el);
      return {
        tag: el.tagName,
        className: el.className && String(el.className).slice(0, 120),
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        backgroundColor: s.backgroundColor,
        borderWidth: s.borderWidth,
        borderColor: s.borderColor,
        borderRadius: s.borderRadius,
        padding: s.padding,
        margin: s.margin,
        width: r ? Math.round(r.width) : null,
        height: r ? Math.round(r.height) : null,
        maxWidth: s.maxWidth,
        boxShadow: s.boxShadow,
        transitionDuration: s.transitionDuration,
        transitionTimingFunction: s.transitionTimingFunction,
      };
    };

    return {
      documentTitle: document.title,
      bodyBackground: cs(body)?.backgroundColor,
      bodyColor: cs(body)?.color,
      bodyFontFamily: cs(body)?.fontFamily,
      htmlFontSize: cs(html)?.fontSize,
      mainMaxWidth: cs(main)?.maxWidth,
      mainPadding: cs(main)?.padding,
      h1: describeEl(h1),
      h2: describeEl(h2),
      p: describeEl(p),
      nav: describeEl(nav),
      button: describeEl(button),
      card: describeEl(card),
      footer: describeEl(footer),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      fontsUsed: Array.from(document.fonts).map((f) => f.family).slice(0, 20),
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const results = {};

  for (const route of routes) {
    results[route.slug] = {};
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      try {
        await page.goto(route.url, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(800);
        const shotPath = path.join(OUT_DIR, `${route.slug}-${vp.name}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        const styles = await extractStyles(page);
        results[route.slug][vp.name] = { screenshot: shotPath, styles };
        console.log(`OK   ${route.slug} @ ${vp.name}`);
      } catch (err) {
        console.error(`FAIL ${route.slug} @ ${vp.name}:`, err.message);
        results[route.slug][vp.name] = { error: String(err.message) };
      } finally {
        await context.close();
      }
    }
  }

  writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
  await browser.close();
  console.log("Audit complete ->", DATA_FILE);
}

main();

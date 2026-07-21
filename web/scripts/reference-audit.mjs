// Phase 0 — live reference audit of cal.com.
// Captures full-page screenshots at 4 viewports and extracts computed styles
// (with the selector each value came from) into docs/reference-audit-data.json.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGES = [
  { name: "home", url: "https://cal.com/" },
  { name: "pricing", url: "https://cal.com/pricing" },
  { name: "enterprise", url: "https://cal.com/enterprise" },
  { name: "ai", url: "https://cal.com/ai" },
  { name: "solutions-sales", url: "https://cal.com/solutions/sales" },
  { name: "blog", url: "https://cal.com/blog" },
];

const VIEWPORTS = [
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "390x844", width: 390, height: 844 },
];

mkdirSync("docs/reference-shots", { recursive: true });

const browser = await chromium.launch();
const audit = {};

for (const page of PAGES) {
  audit[page.name] = { url: page.url, viewports: {}, styles: null };
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    });
    const p = await ctx.newPage();
    try {
      await p.goto(page.url, { waitUntil: "networkidle", timeout: 60000 });
    } catch {
      await p.goto(page.url, { waitUntil: "load", timeout: 60000 }).catch(() => {});
    }
    // Dismiss any cookie/consent banner heuristically
    for (const label of ["Accept", "Accept all", "I agree", "Got it"]) {
      const btn = p.getByRole("button", { name: label, exact: false }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {});
        break;
      }
    }
    await p.waitForTimeout(1200);
    // Trigger lazy content
    await p.evaluate(async () => {
      await new Promise((res) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) setTimeout(step, 80);
          else res();
        };
        step();
      });
    });
    await p.waitForTimeout(800);
    await p.screenshot({
      path: `docs/reference-shots/${page.name}-${vp.name}.png`,
      fullPage: true,
    });
    audit[page.name].viewports[vp.name] = { captured: true };

    // Extract computed styles once per page, at desktop and mobile
    if (vp.name === "1440x1000" || vp.name === "390x844") {
      const styles = await p.evaluate(() => {
        const out = {};
        const pick = (el) => {
          if (!el) return null;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const sel = el.tagName.toLowerCase() +
            (el.id ? `#${el.id}` : "") +
            (el.className && typeof el.className === "string"
              ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
              : "");
          return {
            selector: sel,
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
            letterSpacing: cs.letterSpacing,
            textTransform: cs.textTransform,
            color: cs.color,
            background: cs.backgroundColor,
            border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
            borderRadius: cs.borderRadius,
            padding: cs.padding,
            margin: cs.margin,
            height: `${Math.round(r.height)}px`,
            width: `${Math.round(r.width)}px`,
            maxWidth: cs.maxWidth,
            transition: cs.transition,
            boxShadow: cs.boxShadow,
            backdropFilter: cs.backdropFilter,
            gap: cs.gap,
            display: cs.display,
          };
        };

        out.h1 = pick(document.querySelector("h1"));
        out.h2s = [...document.querySelectorAll("h2")].slice(0, 4).map(pick);
        out.h3s = [...document.querySelectorAll("h3")].slice(0, 4).map(pick);
        out.body = pick(document.body);
        out.main = pick(document.querySelector("main"));
        out.header = pick(document.querySelector("header") || document.querySelector("nav"));
        out.nav = pick(document.querySelector("nav"));
        out.footer = pick(document.querySelector("footer"));

        // Buttons: links or buttons that look like CTAs
        const buttonish = [...document.querySelectorAll("a,button")].filter((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return (
            r.height >= 28 && r.height <= 64 &&
            (cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderRadius !== "0px") &&
            r.width > 60 && r.width < 400 && r.top > 0 && r.top < innerHeight * 2
          );
        });
        out.buttons = buttonish.slice(0, 10).map(pick);

        // Sections: sample padding-block
        out.sections = [...document.querySelectorAll("section")]
          .slice(0, 12)
          .map((el) => {
            const cs = getComputedStyle(el);
            return {
              selector: el.tagName.toLowerCase() + "." + String(el.className).trim().split(/\s+/).slice(0, 2).join("."),
              paddingTop: cs.paddingTop,
              paddingBottom: cs.paddingBottom,
              background: cs.backgroundColor,
              maxWidth: cs.maxWidth,
            };
          });

        // Cards: bordered rounded boxes
        const cards = [...document.querySelectorAll("div,article,li")].filter((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const br = parseFloat(cs.borderRadius);
          const bw = parseFloat(cs.borderTopWidth);
          return br >= 4 && bw >= 0.5 && r.width > 200 && r.height > 120 && r.height < 900;
        });
        out.cards = cards.slice(0, 14).map(pick);

        // Eyebrow-ish: small text above headings
        const brows = [...document.querySelectorAll("p,span,div")].filter((el) => {
          const cs = getComputedStyle(el);
          const fs = parseFloat(cs.fontSize);
          const t = (el.textContent || "").trim();
          return fs >= 10 && fs <= 15 && t.length > 2 && t.length < 40 &&
            (cs.textTransform === "uppercase" || parseInt(cs.fontWeight) >= 500) &&
            el.children.length <= 2;
        });
        out.eyebrows = brows.slice(0, 8).map(pick);

        // Containers: elements that look like the centered wrapper
        const containers = [...document.querySelectorAll("div")].filter((el) => {
          const cs = getComputedStyle(el);
          const mw = parseFloat(cs.maxWidth);
          return mw >= 900 && mw <= 1600 && (cs.marginLeft === "auto" || cs.marginInlineStart === "auto");
        });
        out.containers = containers.slice(0, 6).map(pick);

        // Paragraph/body text samples
        out.paragraphs = [...document.querySelectorAll("p")].slice(0, 6).map(pick);

        // Marquee / animated rows
        out.animated = [...document.querySelectorAll("[class*='marquee' i], [class*='animate' i], [class*='slide' i]")]
          .slice(0, 6).map(pick);

        // Details/accordion
        out.details = [...document.querySelectorAll("details, [data-state], [class*='accordion' i]")]
          .slice(0, 6).map(pick);

        return out;
      });
      audit[page.name].styles = audit[page.name].styles || {};
      audit[page.name].styles[vp.name] = styles;
    }
    await ctx.close();
  }
  console.log(`audited ${page.name}`);
}

writeFileSync("docs/reference-audit-data.json", JSON.stringify(audit, null, 2));
await browser.close();
console.log("DONE -> docs/reference-audit-data.json + docs/reference-shots/");

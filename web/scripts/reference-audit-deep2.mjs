// Phase 0, pass 3 — feature-card anatomy, mock-UI panels, marquee, accordion, mobile.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
});
const p = await ctx.newPage();
await p.goto("https://cal.com/", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
await p.evaluate(async () => {
  await new Promise((res) => {
    let y = 0;
    const step = () => {
      y += 600;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(step, 60);
      else res();
    };
    step();
  });
});
await p.waitForTimeout(1200);

const data = await p.evaluate(() => {
  const out = {};
  const desc = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      cls: String(el.className).slice(0, 50),
      bg: cs.backgroundColor,
      border: `${cs.borderTopWidth}|${cs.borderTopColor}`,
      radius: cs.borderRadius,
      padding: cs.padding,
      rect: { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      font: `${cs.fontFamily.split(",")[0].replace(/"/g, "")} ${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ls:${cs.letterSpacing} ${cs.color}`,
      transition: `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`,
      animation: cs.animationName + " " + cs.animationDuration,
      gap: cs.gap,
    };
  };

  // All elements with a 1px solid border — candidate hairline cards
  const bordered = [...document.querySelectorAll("div,article,li,a,button")].filter((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return parseFloat(cs.borderTopWidth) >= 0.5 && cs.borderTopStyle === "solid" && r.width > 150 && r.height > 80;
  });
  out.borderedCards = bordered.slice(0, 25).map((el) => desc(el));

  // Grey inset panels: grey-ish bg inside white areas
  const insets = [...document.querySelectorAll("div")].filter((el) => {
    const cs = getComputedStyle(el);
    const m = cs.backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
    if (!m) return false;
    const v = Number(m[1]);
    const r = el.getBoundingClientRect();
    return v > 225 && v < 252 && Math.abs(Number(m[1]) - Number(m[2])) < 6 && Math.abs(Number(m[2]) - Number(m[3])) < 6 && r.width > 150 && r.height > 100 && r.height < 600;
  });
  const seen = new Set();
  out.insetPanels = insets.filter((el) => {
    const k = String(el.className);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 15).map((el) => desc(el));

  // Black filled elements (real button backgrounds)
  const blacks = [...document.querySelectorAll("div,a,button,span")].filter((el) => {
    const cs = getComputedStyle(el);
    const m = cs.backgroundColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
    if (!m) return false;
    const r = el.getBoundingClientRect();
    return Number(m[1]) < 50 && Number(m[2]) < 50 && Number(m[3]) < 50 && r.width > 70 && r.height > 24 && r.height < 64;
  });
  out.blackFills = blacks.slice(0, 12).map((el) => ({ text: (el.textContent || "").trim().slice(0, 30), ...desc(el) }));

  // Marquee candidates: any element with a CSS animation
  out.animatedEls = [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.animationName !== "none";
  }).slice(0, 10).map((el) => desc(el));

  // Transitions used on links/buttons
  const trans = new Set();
  [...document.querySelectorAll("a,button")].forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.transitionDuration !== "0s") trans.add(`${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`);
  });
  out.transitions = [...trans].slice(0, 20);

  // Eyebrow labels - find exact small texts
  out.labels = ["How it works", "Benefits", "Testimonials", "Apps", "FAQ", "…and so much more!"].map((txt) => {
    const el = [...document.querySelectorAll("p,span,div,h2,h3")].find((e) => (e.textContent || "").trim() === txt);
    if (!el) return { txt, found: false };
    // walk to the text-owning node
    let n = el;
    while (n.children.length && (n.textContent || "").trim() === txt) n = n.children[0];
    return { txt, ...desc(n) };
  });

  // FAQ question rows
  const faqRow = [...document.querySelectorAll("div,p,h3,span")].find((e) => (e.textContent || "").trim().startsWith("What is Cal.com and how does it work"));
  if (faqRow) {
    let n = faqRow;
    const chain = [];
    for (let i = 0; i < 6 && n; i++) {
      chain.push(desc(n));
      n = n.parentElement;
    }
    out.faqChain = chain;
  }
  return out;
});

writeFileSync("docs/reference-audit-deep2.json", JSON.stringify(data, null, 2));
console.log("bordered:", data.borderedCards.length, "insets:", data.insetPanels.length, "blacks:", data.blackFills.length);
console.log(JSON.stringify(data.labels, null, 1));
console.log(JSON.stringify(data.transitions, null, 1));
await ctx.close();

// Mobile pass
const m = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  isMobile: true,
  hasTouch: true,
});
const mp = await m.newPage();
await mp.goto("https://cal.com/", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await mp.waitForTimeout(1500);
const mdata = await mp.evaluate(() => {
  const h1 = document.querySelector("h1");
  const cs = getComputedStyle(h1);
  const r = h1.getBoundingClientRect();
  // hero card
  let n = h1;
  let card = null;
  while (n && n !== document.body) {
    n = n.parentElement;
    const c = getComputedStyle(n);
    if (c.backgroundColor === "rgb(255, 255, 255)") { card = n; break; }
  }
  const crs = card ? getComputedStyle(card) : null;
  const crr = card ? card.getBoundingClientRect() : null;
  return {
    h1: { font: `${cs.fontSize}/${cs.lineHeight}`, w: Math.round(r.width) },
    heroCard: card ? { x: Math.round(crr.x), w: Math.round(crr.width), radius: crs.borderRadius } : null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
});
console.log("MOBILE:", JSON.stringify(mdata, null, 1));
await browser.close();
console.log("DONE");

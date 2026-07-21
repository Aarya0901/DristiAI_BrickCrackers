// Phase 0, pass 2 — targeted measurement of cal.com home.
// Framer uses hashed classes, so we locate elements by text and walk ancestors.
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const browser = await chromium.launch();

async function measure(width, height, label) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  });
  const p = await ctx.newPage();
  await p.goto("https://cal.com/", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);

  const data = await p.evaluate(() => {
    const out = {};
    const desc = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: String(el.className).slice(0, 60),
        bg: cs.backgroundColor,
        border: `${cs.borderTopWidth}|${cs.borderTopStyle}|${cs.borderTopColor}`,
        radius: cs.borderRadius,
        padding: cs.padding,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        shadow: cs.boxShadow.slice(0, 120),
        font: `${cs.fontFamily.split(",")[0]} ${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ls:${cs.letterSpacing} ${cs.color}`,
        transition: cs.transitionDuration + " " + cs.transitionTimingFunction,
      };
    };
    const byText = (txt) => {
      const els = [...document.querySelectorAll("h1,h2,h3,p,span,a,button,div")];
      return els.find((e) => (e.textContent || "").trim().startsWith(txt) && e.children.length < 6);
    };

    // 1. Hero headline + ancestor chain
    const h1 = document.querySelector("h1");
    out.h1 = desc(h1);
    const chain = [];
    let node = h1;
    for (let i = 0; i < 8 && node && node !== document.body; i++) {
      node = node.parentElement;
      if (!node) break;
      const cs = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      if (cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderRadius !== "0px" || parseFloat(cs.borderTopWidth) > 0) {
        chain.push(desc(node));
      }
    }
    out.heroAncestors = chain;

    // 2. Black primary button(s): elements with near-black bg
    const blacks = [...document.querySelectorAll("a,button,div[role=button]")].filter((el) => {
      const cs = getComputedStyle(el);
      const m = cs.backgroundColor.match(/\d+/g);
      if (!m) return false;
      const [r, g, b] = m.map(Number);
      const rect = el.getBoundingClientRect();
      return r < 60 && g < 60 && b < 60 && rect.width > 80 && rect.width < 420 && rect.height > 28 && rect.height < 64;
    });
    out.primaryButtons = blacks.slice(0, 6).map((el) => ({ text: (el.textContent || "").trim().slice(0, 40), ...desc(el) }));

    // 3. Feature card: locate "Avoid meeting overload" and walk up to bordered card
    const f = byText("Avoid meeting overload");
    if (f) {
      const up = [];
      let n = f;
      for (let i = 0; i < 10 && n; i++) {
        n = n.parentElement;
        if (!n) break;
        const cs = getComputedStyle(n);
        if (parseFloat(cs.borderTopWidth) >= 0.5 || cs.backgroundColor === "rgb(255, 255, 255)") {
          up.push(desc(n));
          if (up.length >= 3) break;
        }
      }
      out.featureCard = up;
      out.featureCardHeading = desc(f);
    }

    // 4. Small tile: "...and so much more" grid item
    const t = byText("Avoid payments") || byText("Routing");
    if (t) {
      let n = t;
      const up = [];
      for (let i = 0; i < 8 && n; i++) {
        n = n.parentElement;
        if (!n) break;
        const cs = getComputedStyle(n);
        if (parseFloat(cs.borderTopWidth) >= 0.5 || cs.backgroundColor === "rgb(255, 255, 255)") {
          up.push(desc(n));
          if (up.length >= 2) break;
        }
      }
      out.smallTile = up;
    }

    // 5. Eyebrow labels: small grey texts ("How it works", "Benefits", "Testimonials")
    out.eyebrows = ["How it works", "Benefits", "Testimonials", "FAQ", "Features"].map((txt) => {
      const el = byText(txt);
      return el ? { txt, ...desc(el) } : null;
    }).filter(Boolean);

    // 6. Section spacing: vertical gaps between top-level white cards on the page
    const whiteCards = [...document.querySelectorAll("body div")].filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.backgroundColor === "rgb(255, 255, 255)" && r.width > 900 && r.height > 200;
    });
    out.bigWhiteCards = whiteCards.slice(0, 12).map((el) => desc(el));

    // 7. Marquee: find logo strip elements
    const logos = byText("Trusted by fast-growing");
    out.marqueeLabel = logos ? desc(logos) : null;

    // 8. FAQ accordion item
    const faq = byText("What is Cal.com and how does it work");
    if (faq) {
      let n = faq;
      for (let i = 0; i < 6 && n; i++) {
        n = n.parentElement;
        const cs = getComputedStyle(n);
        if (parseFloat(cs.borderTopWidth) >= 0.5 || cs.backgroundColor === "rgb(255, 255, 255)") {
          out.faqItem = desc(n);
          break;
        }
      }
      out.faqQuestion = desc(faq);
    }

    // 9. Footer
    const footer = [...document.querySelectorAll("div")].find((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return r.height > 300 && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && (el.textContent || "").includes("Solutions");
    });
    out.footer = footer ? desc(footer) : null;

    // 10. Body + html bg
    out.bodyBg = getComputedStyle(document.body).backgroundColor;

    // 11. Nav / header top bar: element at top containing "Sign in" or logo
    const nav = [...document.querySelectorAll("a,button")].find((el) => /sign in|get started/i.test(el.textContent || "") && el.getBoundingClientRect().top < 80);
    if (nav) {
      out.navLink = { text: nav.textContent.trim(), ...desc(nav) };
      let n = nav;
      for (let i = 0; i < 8 && n; i++) {
        n = n.parentElement;
        if (!n) break;
        const r = n.getBoundingClientRect();
        const cs = getComputedStyle(n);
        if (r.width >= innerWidth - 4 && r.top <= 40 && r.height > 40) {
          out.navBar = desc(n);
          break;
        }
      }
    }
    return out;
  });

  // Marquee speed: sample transform over time
  const marquee = await p.evaluate(async () => {
    const els = [...document.querySelectorAll("[class*='marquee'], [style*='transform']")];
    const el = els.find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > innerWidth && r.height < 200 && r.top > 0;
    });
    if (!el) return null;
    const before = getComputedStyle(el).transform;
    await new Promise((r) => setTimeout(r, 1000));
    const after = getComputedStyle(el).transform;
    return { before, after, animation: getComputedStyle(el).animation };
  });
  data.marqueeMotion = marquee;

  await ctx.close();
  return { label, data };
}

const desktop = await measure(1440, 1000, "1440x1000");
const mobile = await measure(390, 844, "390x844");

writeFileSync(
  "docs/reference-audit-deep.json",
  JSON.stringify({ desktop, mobile }, null, 2)
);
await browser.close();
console.log("DONE -> docs/reference-audit-deep.json");

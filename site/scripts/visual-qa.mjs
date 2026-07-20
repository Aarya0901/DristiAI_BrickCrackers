import { chromium, firefox, webkit } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.QA_BASE_URL || "http://localhost:3001";
const OUT_DIR = "visual-baselines";
mkdirSync(OUT_DIR, { recursive: true });

const routes = [
  "/",
  "/drishti",
  "/seat-graph",
  "/research",
  "/deployment",
  "/privacy",
  "/demo",
  "/roadmap",
  "/this-route-does-not-exist",
];

const viewports = [
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "desktop-1440x1000", width: 1440, height: 1000 },
];

async function auditPage(page, route) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(700);

  const checks = await page.evaluate(() => {
    const h1s = document.querySelectorAll("h1");
    const imgsWithoutAlt = Array.from(document.querySelectorAll("img")).filter(
      (img) => !img.hasAttribute("alt")
    );
    const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    return {
      h1Count: h1s.length,
      imgsWithoutAlt: imgsWithoutAlt.length,
      horizontalOverflow: overflow,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      title: document.title,
    };
  });

  return { errors, checks };
}

async function main() {
  const report = {};
  const browser = await chromium.launch();

  for (const route of routes) {
    report[route] = {};
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      try {
        const result = await auditPage(page, route);
        const slug = route === "/" ? "home" : route.replace(/\//g, "_");
        const path = `${OUT_DIR}/${slug}-${vp.name}.png`;
        await page.screenshot({ path, fullPage: true, timeout: 20000 });
        report[route][vp.name] = { ...result, screenshot: path };
        console.log(
          `${result.errors.length === 0 ? "OK  " : "ERR "} ${route.padEnd(32)} ${vp.name.padEnd(20)} h1=${result.checks.h1Count} overflow=${result.checks.horizontalOverflow}`
        );
        if (result.errors.length) {
          result.errors.forEach((e) => console.log("      console error:", e));
        }
      } catch (err) {
        console.log(`FAIL ${route.padEnd(32)} ${vp.name.padEnd(20)} ${err.message.split("\n")[0]}`);
        report[route][vp.name] = { error: err.message };
      } finally {
        await context.close();
      }
    }
  }
  await browser.close();

  // Cross-browser smoke test on homepage only (keep runtime reasonable).
  for (const [name, engine] of [["firefox", firefox], ["webkit", webkit]]) {
    try {
      const browser2 = await engine.launch();
      const page = await browser2.newPage({ viewport: { width: 1280, height: 900 } });
      const result = await auditPage(page, "/");
      console.log(`${name}: errors=${result.errors.length} h1=${result.checks.h1Count}`);
      await browser2.close();
    } catch (err) {
      console.log(`${name}: FAILED — ${err.message.split("\n")[0]}`);
    }
  }

  writeFileSync(`${OUT_DIR}/report.json`, JSON.stringify(report, null, 2));
  console.log("\nQA complete ->", `${OUT_DIR}/report.json`);
}

main();

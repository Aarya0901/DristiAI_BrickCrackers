// Dev-only helper: screenshots our own pages + collects console/page errors.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const routes = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];
const OUT_DIR = "docs/self-check";
mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));

    await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(600);
    const slug = route === "/" ? "home" : route.replace(/\//g, "_");
    await page.screenshot({ path: `${OUT_DIR}/${slug}-1440.png`, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT_DIR}/${slug}-390.png`, fullPage: true });

    console.log(`--- ${route} ---`);
    if (errors.length) {
      errors.forEach((e) => console.log("ERROR:", e));
    } else {
      console.log("no console errors");
    }
    await context.close();
  }
  await browser.close();
}

main();

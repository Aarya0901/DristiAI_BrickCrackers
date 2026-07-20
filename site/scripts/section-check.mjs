import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT_DIR = "docs/self-check";
mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const sections = ["hero", "capabilities", "what-vigil-does", "trust-principles", "faq"];
  for (const id of sections) {
    const el = id === "hero" ? page.locator("body > main > section").first() : page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await el.screenshot({ path: `${OUT_DIR}/section-${id}.png` });
    console.log("captured", id);
  }
  await browser.close();
}

main();

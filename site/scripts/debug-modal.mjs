import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL || "http://localhost:3001";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (m) => console.log("console:", m.text()));
  page.on("pageerror", (e) => console.log("pageerror:", e));
  await page.goto(`${BASE}/demo`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const buttons = await page.locator("button").allTextContents();
  console.log("buttons containing 'Reciprocal':", buttons.filter((b) => b.includes("Reciprocal")));
  await page.screenshot({ path: "docs/self-check/debug-before-click.png" });
  await page.locator("text=Reciprocal attention pattern").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/self-check/debug-after-click.png" });
  const dialogCount = await page.locator('[role="dialog"]').count();
  console.log("dialog count:", dialogCount);
  await browser.close();
}

main();

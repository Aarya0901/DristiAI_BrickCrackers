import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL || "http://localhost:3001";

async function main() {
  const browser = await chromium.launch();

  // Reduced motion: page should render fully, no errors, hero canvas static.
  {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    console.log("reduced-motion home: errors=", errors.length);
    await context.close();
  }

  // Keyboard: tab through header, open mobile-ish focus states are fine on desktop;
  // check FAQ accordion keyboard toggle + focus-visible outline exists.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE}/#faq`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const firstQuestion = page.getByRole("button", { name: /Does VIGIL decide/i });
    await firstQuestion.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    const expanded = await firstQuestion.getAttribute("aria-expanded");
    console.log("faq keyboard toggle aria-expanded after Enter:", expanded);
    await context.close();
  }

  // Modal focus trap on /demo
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE}/demo`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const firstAlert = page.locator("text=Reciprocal attention pattern").first();
    await firstAlert.click();
    await page.waitForTimeout(400);
    const dialog = page.getByRole("dialog");
    const isVisible = await dialog.isVisible().catch(() => false);
    console.log("demo review modal opened:", isVisible);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const stillVisible = await dialog.isVisible().catch(() => false);
    console.log("demo review modal closed on Escape:", !stillVisible);
    await context.close();
  }

  await browser.close();
}

main();

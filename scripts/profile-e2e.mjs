import { chromium } from "playwright-core";
import { USERS } from "./creds.mjs";
const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\ASUGIR\\Desktop\\Bumsa\\rrs-asv\\screenshots";
const URL = "https://cloth-particles-legend-juan.trycloudflare.com/";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: "networkidle" });
await page.locator('input[name="forceNumber"]').fill(USERS.ipo1.force);
await page.locator('input[name="password"]').fill(USERS.ipo1.password);
await page.getByRole("button", { name: /^Sign in$/i }).click();
await page.waitForSelector(".app-shell");
await page.locator(".mobile-only").click();
await page.waitForTimeout(200);
await page.locator(".nav-item", { hasText: "Cases" }).click();
await page.waitForSelector(".table-cases");
await page.locator(".table-cases tbody tr").last().click();
await page.waitForSelector(".case-head");
await page.locator(".tab", { hasText: "Persons" }).click();
await page.getByRole("button", { name: /Link person/i }).click();
await page.waitForSelector("#add-person-form");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}\\27-mobile-form-identity.png` });

await page.locator('#add-person-form input[placeholder="Surname first"]').fill("Profile Test");
await page.locator('#add-person-form input[placeholder="NIN-0000000000"]').fill("NIN-8888888888");
await page.locator("#add-person-form select").nth(3).selectOption("Lagos");
await page.locator("#add-person-form select").nth(4).selectOption("Ikeja");
await page.locator('#add-person-form input[placeholder="e.g. Tailor, driver, trader, student"]').fill("Tailor");
await page.locator('#add-person-form input[placeholder="e.g. Yoruba"]').fill("Yoruba");
await page.locator('#add-person-form input[placeholder="0803 000 0000"]').fill("0803 777 8888");
await page.locator('#add-person-form input[placeholder="Street, area, city"]').fill("12 Test Street, Ikeja");
await page.locator("#add-person-form select").nth(5).selectOption("Christianity");
await page.locator("#add-person-form select").nth(6).selectOption("Yoruba");
await page.locator("#add-person-form select").nth(7).selectOption("Recorded");
await page.locator('#add-person-form input[placeholder="e.g. FP-2026-00123"]').fill("FP-2026-0099");
await page.locator('#add-person-form input[placeholder="Make, model or serial number"]').fill("Demo scanner A1");
await page.locator('#add-person-form input[type="file"]').nth(1).setInputFiles({
  name: "suspect.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4YQAAAAASUVORK5CYII=", "base64"),
});
await page.locator('#add-person-form textarea[placeholder="Finger position, quality, scanner operator..."]').fill("Right thumb, good quality");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}\\28-mobile-form-filled.png` });
await page.getByRole("button", { name: /Link person/i }).last().click();
await page.waitForTimeout(700);
await page.locator(".person-name-btn", { hasText: "Profile Test" }).click();
await page.waitForSelector(".profile-grid");
await page.screenshot({ path: `${OUT}\\29-mobile-profile.png` });
console.log("profile opened; errors:", errors.length ? errors : "none");
await browser.close();

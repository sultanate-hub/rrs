import { chromium } from "playwright-core";
import { BASE, USERS, signIn, signOut } from "./creds.mjs";

const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\ASUGIR\\Desktop\\Bumsa\\rrs-asv\\screenshots";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`CONSOLE: ${m.text()}`));

async function shot(name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}\\${name}.png` });
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector(".login-page");
await shot("01-login");

await signIn(page, USERS.ipo1);
await shot("02-dashboard-ipo");

await page.locator(".nav-item", { hasText: "Cases" }).first().click();
await page.waitForSelector(".table-cases");
await shot("03-case-list");

await page.locator(".table-cases tbody tr").first().click();
await page.waitForSelector(".case-head");
await shot("04-case-detail");

await page.locator(".tab", { hasText: "Evidence" }).click();
await page.waitForTimeout(300);
await shot("05-evidence-tab");

const upload = page.getByRole("button", { name: /Upload evidence/i }).first();
if (await upload.count()) {
  await upload.click();
  await page.waitForSelector(".modal");
  await shot("06-evidence-modal");
  await page.locator('[aria-label="Close"]').click();
}

await signOut(page);
await signIn(page, USERS.commander);
await shot("07-dashboard-commander");

await page.locator(".nav-item", { hasText: "Audit trail" }).click();
await page.waitForSelector(".table");
await shot("08-audit");

console.log("ERRORS", errors.length ? errors : "none");
await browser.close();

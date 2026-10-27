import { chromium } from "playwright-core";
import { USERS, signIn } from "./creds.mjs";
const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\ASUGIR\\Desktop\\Bumsa\\rrs-asv\\screenshots";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
await signIn(page, USERS.ipo1);
await page.locator(".nav-item", { hasText: "Cases" }).click();
await page.waitForSelector(".table-cases");
await page.locator(".table-cases tbody tr").last().click();
await page.waitForSelector(".case-head");
await page.locator(".tab", { hasText: "Persons" }).click();
await page.getByRole("button", { name: /Link person/i }).click();
await page.waitForSelector("#add-person-form");

// Nigerian: state -> LGA
await page.locator("#add-person-form select").nth(3).selectOption("Lagos");
const lgaCount = await page.locator("#add-person-form select").nth(4).locator("option").count();
console.log("LGA options for Lagos:", lgaCount);
await page.locator("#add-person-form select").nth(4).selectOption("Ikeja");
await page.locator('#add-person-form input[placeholder="e.g. Tailor, driver, trader, student"]').fill("Tailor");
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}\\22-person-form-nigeria.png` });

// Foreign: country switch removes LGA list
await page.locator("#add-person-form select").nth(2).selectOption("Ghana");
await page.waitForTimeout(300);
const statePlaceholder = await page.locator('#add-person-form input[placeholder="State / province / region"]').count();
const cityPlaceholder = await page.locator('#add-person-form input[placeholder="City / district / local government"]').count();
console.log("foreign fields:", statePlaceholder, cityPlaceholder);
await page.screenshot({ path: `${OUT}\\23-person-form-foreign.png` });
await browser.close();

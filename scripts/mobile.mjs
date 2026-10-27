import { chromium } from "playwright-core";
import { BASE, USERS, signIn } from "./creds.mjs";

const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\ASUGIR\\Desktop\\Bumsa\\rrs-asv\\screenshots";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}\\16-mobile-login.png` });
await signIn(page, USERS.ipo1);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}\\17-mobile-dashboard.png` });
await page.locator(".mobile-only").click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}\\18-mobile-nav.png` });
console.log("ERRORS", errors.length ? errors : "none");
await browser.close();

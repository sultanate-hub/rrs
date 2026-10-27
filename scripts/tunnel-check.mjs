import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", headless: true });
const page = await (await browser.newContext()).newPage();
await page.goto("https://cloth-particles-legend-juan.trycloudflare.com/", { waitUntil: "networkidle" });
await page.waitForSelector(".login-page");
const sw = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? "registered" : "not-registered";
});
const manifest = await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute("href") ?? null);
console.log("serviceWorker:", sw, "manifest:", manifest);
await page.screenshot({ path: "screenshots/24-tunnel-login.png" });
await browser.close();

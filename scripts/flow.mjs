import { chromium } from "playwright-core";
import { BASE, USERS, signIn, signOut } from "./creds.mjs";

const CHROME = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\ASUGIR\\Desktop\\Bumsa\\rrs-asv\\screenshots";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`CONSOLE: ${m.text()}`));

const log = (...a) => console.log(...a);
async function shot(name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}\\${name}.png` });
}

await signIn(page, USERS.ipo1);

// New case
await page.getByRole("button", { name: /New case/i }).first().click();
await page.waitForSelector("#new-case-form");
await page.locator("#new-case-form select").nth(0).selectOption({ label: "Vandalism (VAN-07)" });
await page.locator('#new-case-form input[placeholder="Area, street, landmark"]').fill("Test Location, Lagos");
await page.locator('#new-case-form input[placeholder="Full name"]').fill("Test Complainant");
await page.locator('#new-case-form input[placeholder="0803 000 0000"]').fill("0803 111 2222");
await page.locator("#new-case-form select").nth(1).selectOption("High");
await page.locator("#new-case-form textarea").fill("Automated smoke test case. Synthetic data only.");
await page.getByRole("button", { name: /Register case/i }).click();
await page.waitForSelector(".case-head");
const caseNo = await page.locator(".case-number-row h2").innerText();
log("created case", caseNo);
await shot("09-new-case-created");

// Add person
await page.locator(".tab", { hasText: "Persons" }).click();
await page.getByRole("button", { name: /Link person/i }).click();
await page.waitForSelector("#add-person-form");
await page.locator("#add-person-form select").first().selectOption("Suspect");
await page.locator('#add-person-form input[placeholder="Surname first"]').fill("Test Suspect");
await page.locator('#add-person-form input[placeholder="0803 000 0000"]').fill("0803 333 4444");
await page.locator('#add-person-form input[placeholder="NIN-0000000000"]').fill("NIN-9999999999");
await page.locator('#add-person-form input[type="file"]').nth(1).setInputFiles({
  name: "suspect.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4YQAAAAASUVORK5CYII=", "base64"),
});
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Link person/i }).last().click();
await page.waitForTimeout(500);
if (!(await page.getByText("Test Suspect").count())) throw new Error("person not linked");
log("person linked");
await shot("10-person-linked");

// Evidence upload + hash
await page.locator(".tab", { hasText: "Evidence" }).click();
await page.getByRole("button", { name: /Upload evidence/i }).first().click();
await page.waitForSelector("#evidence-form");
await page.locator('#evidence-form input[type="file"]').first().setInputFiles({
  name: "test-evidence.txt",
  mimeType: "text/plain",
  buffer: Buffer.from("RRS demo evidence file"),
});
await page.waitForSelector(".hash-box");
const hashText = await page.locator(".hash-box code").innerText();
if (hashText.length < 32) throw new Error("hash not generated");
await page.locator("#evidence-form textarea").fill("Smoke test evidence file.");
await page.getByRole("button", { name: /Add to case/i }).click();
await page.waitForTimeout(500);
if (!(await page.getByText("test-evidence.txt").count())) throw new Error("evidence not added");
log("evidence added, hash", hashText.slice(0, 16));
await shot("11-evidence-added");

// Court hearing
await page.locator(".tab", { hasText: "Court" }).click();
await page.getByRole("button", { name: /Add hearing/i }).click();
await page.waitForSelector("#hearing-form");
await page.locator("#hearing-form input").nth(0).fill("Test Magistrate Court");
await page.locator("#hearing-form input").nth(2).fill("Test purpose");
await page.getByRole("button", { name: /Add hearing/i }).last().click();
await page.waitForTimeout(500);
if (!(await page.getByText("Test Magistrate Court").count())) throw new Error("hearing not added");
log("hearing added");
await shot("12-hearing-added");

// Offline draft + sync
await page.locator(".nav-item", { hasText: "Dashboard" }).click();
await page.getByRole("button", { name: /Simulate offline/i }).click();
await page.getByRole("button", { name: /New case/i }).first().click();
await page.waitForSelector("#new-case-form");
await page.locator("#new-case-form select").nth(0).selectOption({ label: "Loitering (LOI-06)" });
await page.locator('#new-case-form input[placeholder="Area, street, landmark"]').fill("Offline Test, Lagos");
await page.locator('#new-case-form input[placeholder="Full name"]').fill("Offline Complainant");
await page.locator("#new-case-form textarea").fill("Offline draft created by automated smoke test.");
await page.getByRole("button", { name: /Register case/i }).click();
await page.waitForSelector(".case-head");
if (!(await page.getByText("Offline draft").count())) throw new Error("offline badge missing");
await shot("13-offline-draft");
await page.getByRole("button", { name: /Sync now/i }).click();
await page.waitForTimeout(400);
log("offline synced");
await page.getByRole("button", { name: /Go online/i }).click();

// Search
await page.locator(".nav-item", { hasText: "Search" }).click();
await page.locator(".search-box-lg input").fill("Test Suspect");
await page.waitForTimeout(400);
if (!(await page.getByText("Test Suspect").count())) throw new Error("search failed");
log("search ok");
await shot("14-search");

// IPO isolation: login as off-2, test case must not be visible
await signOut(page);
await signIn(page, USERS.ipo2);
await page.locator(".nav-item", { hasText: "Cases" }).click();
await page.waitForSelector(".table-cases");
const bodyText = await page.locator(".table-cases").innerText();
if (bodyText.includes(caseNo)) throw new Error("IPO saw another officer's case");
log("IPO isolation ok");

// Auditor read-only
await signOut(page);
await signIn(page, USERS.auditor);
await page.locator(".nav-item", { hasText: "Cases" }).click();
await page.waitForSelector(".table-cases");
if (await page.getByRole("button", { name: /New case/i }).count()) throw new Error("auditor can create case");
log("auditor read-only ok");
await shot("15-auditor-case-list");

console.log("ERRORS", errors.length ? errors : "none");
await browser.close();

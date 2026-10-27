export const BASE = "http://localhost:3000";

export const USERS = {
  ipo1: { force: "51234", password: "RRS-51234" },
  ipo2: { force: "44120", password: "RRS-44120" },
  supervisor: { force: "39871", password: "RRS-39871" },
  commander: { force: "21007", password: "RRS-21007" },
  auditor: { force: "30218", password: "RRS-30218" },
  admin: { force: "90001", password: "RRS-90001" },
};

export async function signIn(page, user) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator('input[name="forceNumber"]').fill(user.force);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole("button", { name: /^Sign in$/i }).click();
  await page.waitForSelector(".app-shell");
}

export async function signOut(page) {
  await page.locator('[aria-label="Exit demo"]').click();
  await page.waitForSelector(".login-page");
}

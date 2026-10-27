import { chromium } from "playwright-core";
import fs from "node:fs";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = "C:\\Users\\aryan\\Desktop\\DocVerify\\screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });

const pages = [
  { url: "http://localhost:3000/overview", name: "01-overview" },
  { url: "http://localhost:3000/applications", name: "02-applications" },
  { url: "http://localhost:3000/review", name: "03-review" },
  { url: "http://localhost:3000/rules", name: "04-rules" },
  { url: "http://localhost:3000/audit", name: "05-audit" },
  { url: "http://localhost:3000/institution", name: "06-institution" },
];

for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(p.url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${p.name}.png` });
  console.log(`Saved screenshot: ${p.name}.png`);
  await page.close();
}

// Check dropup on overview
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto("http://localhost:3000/overview", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// Click profile card at bottom of sidebar
const userCard = await page.$('button[title="Account settings & user menu"]');
if (userCard) {
  await userCard.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/07-account-dropup.png` });
  console.log("Saved screenshot: 07-account-dropup.png");
}
await page.close();

await browser.close();
console.log("All verifications complete!");

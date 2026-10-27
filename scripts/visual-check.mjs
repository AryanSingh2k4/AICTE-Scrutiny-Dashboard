import { chromium } from "playwright-core";
import fs from "node:fs";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = "C:\\Users\\aryan\\Desktop\\DocVerify\\screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const pages = [
  { path: "/", name: "login", fullPage: false },
  { path: "/overview", name: "overview", fullPage: true },
  { path: "/applications", name: "applications", fullPage: true },
  { path: "/applications/APP-2026-0418", name: "application-detail", fullPage: true },
  { path: "/review", name: "review", fullPage: true },
  { path: "/rules", name: "rules", fullPage: true },
  { path: "/audit", name: "audit", fullPage: true },
  { path: "/institution", name: "institution", fullPage: true },
];

for (const item of pages) {
  await page.goto(`http://localhost:3000${item.path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${item.name}.png`, fullPage: item.fullPage });
  console.log(`captured ${item.name}`);
}

await browser.close();

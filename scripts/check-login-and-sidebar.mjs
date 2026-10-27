import { chromium } from "playwright-core";
import fs from "node:fs";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = "C:\\Users\\aryan\\Desktop\\DocVerify\\screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });

// Check 1: Login page
const pageLogin = await browser.newPage({ viewport: { width: 1440, height: 800 }, deviceScaleFactor: 1 });
await pageLogin.goto("http://localhost:3000", { waitUntil: "networkidle" });
await pageLogin.evaluate(() => document.fonts.ready);
await pageLogin.waitForTimeout(400);

const hasScrollbar = await pageLogin.evaluate(() => {
  return document.documentElement.scrollHeight > window.innerHeight;
});
console.log("Login page has vertical scrollbar:", hasScrollbar);
await pageLogin.screenshot({ path: `${outDir}/login-scrutinix.png`, fullPage: false });

// Check 2: Workspace expanded
const pageApp = await browser.newPage({ viewport: { width: 1440, height: 850 }, deviceScaleFactor: 1 });
await pageApp.goto("http://localhost:3000/overview", { waitUntil: "networkidle" });
await pageApp.evaluate(() => document.fonts.ready);
await pageApp.waitForTimeout(400);
await pageApp.screenshot({ path: `${outDir}/workspace-scrutinix-expanded.png` });

// Collapse via sidebar header button
const collapseBtn = await pageApp.$('button[title="Collapse sidebar"]');
if (collapseBtn) {
  await collapseBtn.click();
  await pageApp.waitForTimeout(300);
  await pageApp.screenshot({ path: `${outDir}/workspace-scrutinix-collapsed.png` });
  console.log("Captured collapsed sidebar");

  // Now expand by clicking on the logo!
  const logoBtn = await pageApp.$('button[title="Expand sidebar"]');
  if (logoBtn) {
    await logoBtn.click();
    await pageApp.waitForTimeout(300);
    console.log("Successfully re-expanded by clicking logo!");
  }
}

await browser.close();

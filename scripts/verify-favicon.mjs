import { chromium } from "playwright-core";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const browser = await chromium.launch({ executablePath, headless: true });

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Check favicon responses
const resSvg = await page.goto("http://localhost:3000/icon.svg");
console.log("/icon.svg status:", resSvg?.status(), "content-type:", resSvg?.headers()["content-type"]);

const resIco = await page.goto("http://localhost:3000/favicon.ico");
console.log("/favicon.ico status:", resIco?.status());

const resApple = await page.goto("http://localhost:3000/apple-touch-icon.png");
console.log("/apple-touch-icon.png status:", resApple?.status());

// Go to main page and check <link rel="icon">
await page.goto("http://localhost:3000/overview", { waitUntil: "networkidle" });
const faviconHrefs = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('link[rel*="icon"]'));
  return links.map(l => ({ rel: l.rel, href: l.href, type: l.type, sizes: l.sizes?.value }));
});
console.log("Favicon links found in HTML:", JSON.stringify(faviconHrefs, null, 2));

// Screenshot overview with updated logo
await page.screenshot({ path: "screenshots/favicon-verified-overview.png" });
console.log("Overview screenshot captured");

await browser.close();

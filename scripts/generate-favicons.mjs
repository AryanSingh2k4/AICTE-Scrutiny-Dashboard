import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="34" height="34">
  <rect width="34" height="34" rx="8" fill="#143d32"/>
  <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <path d="M22.5 13.2c0-2.4-1.9-4.2-5.5-4.2-3.8 0-6.2 1.8-6.2 4.6 0 2.9 2.1 4 5.6 4.7 3.3.7 4.5 1.4 4.5 3.2 0 2.1-1.9 3.5-4.8 3.5-3.6 0-5.4-1.6-5.8-3.8h-3.6c.4 4.2 3.8 6.8 9.4 6.8 5 0 8.5-2.6 8.5-6.5 0-3.2-2.3-4.5-6-5.2-3.1-.6-4.1-1.4-4.1-2.8 0-1.7 1.5-2.6 3.6-2.6 2.5 0 4.1 1.1 4.4 2.3h3.6Z" fill="#F7F4EA"/>
  <circle cx="24.5" cy="24.2" r="2.6" fill="#D9B56A"/>
</svg>`;

// Write public/icon.svg and app/icon.svg
fs.writeFileSync("public/icon.svg", svgContent, "utf-8");
fs.writeFileSync("app/icon.svg", svgContent, "utf-8");
console.log("Wrote public/icon.svg and app/icon.svg");

// High-res SVG for rasterization (512x512)
const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="120" fill="#143d32"/>
  <rect x="8" y="8" width="496" height="496" rx="112" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="12"/>
  <g transform="scale(15.0588) translate(0, 0)">
    <path d="M22.5 13.2c0-2.4-1.9-4.2-5.5-4.2-3.8 0-6.2 1.8-6.2 4.6 0 2.9 2.1 4 5.6 4.7 3.3.7 4.5 1.4 4.5 3.2 0 2.1-1.9 3.5-4.8 3.5-3.6 0-5.4-1.6-5.8-3.8h-3.6c.4 4.2 3.8 6.8 9.4 6.8 5 0 8.5-2.6 8.5-6.5 0-3.2-2.3-4.5-6-5.2-3.1-.6-4.1-1.4-4.1-2.8 0-1.7 1.5-2.6 3.6-2.6 2.5 0 4.1 1.1 4.4 2.3h3.6Z" fill="#F7F4EA"/>
    <circle cx="24.5" cy="24.2" r="2.6" fill="#D9B56A"/>
  </g>
</svg>`;

const svgBuffer = Buffer.from(svg512);

// Generate PNGs
await sharp(svgBuffer).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(svgBuffer).resize(180, 180).png().toFile("app/apple-icon.png");
await sharp(svgBuffer).resize(32, 32).png().toFile("public/favicon-32x32.png");
await sharp(svgBuffer).resize(16, 16).png().toFile("public/favicon-16x16.png");
await sharp(svgBuffer).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(svgBuffer).resize(512, 512).png().toFile("public/icon-512.png");

// Build a proper multi-image ICO file containing 16x16, 32x32, and 48x48 PNG frames
const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

function createIco(images) {
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type (1 for icon)
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset to image data
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

const icoBuffer = createIco([
  { width: 16, height: 16, buffer: p16 },
  { width: 32, height: 32, buffer: p32 },
  { width: 48, height: 48, buffer: p48 },
]);

fs.writeFileSync("public/favicon.ico", icoBuffer);
fs.writeFileSync("app/favicon.ico", icoBuffer);
console.log("Successfully generated public/favicon.ico and app/favicon.ico!");

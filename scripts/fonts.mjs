// Fetches Satoshi from Fontshare before every build (npm "prebuild").
//
// Why: Satoshi is licensed under the ITF Free Font License, which allows
// self-hosting it on our own site but forbids distributing the font files,
// including through a publicly accessible repository. This repo is public, so
// the files are never committed (see .gitignore): the build downloads the
// official package and copies the official files as they are (no subsetting
// or conversion, which the license also forbids).
//
//   node scripts/fonts.mjs              → src/fonts/Satoshi-Variable.woff2 (the site)
//   node scripts/fonts.mjs --lettering  → also assets/fonts/Satoshi-Variable.ttf
//                                         (source for scripts/lettering.py)
//
// Files already present are kept, so local builds only download once.
// Uses only Node built-ins: no unzip binary is assumed on the build machine.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const URL = "https://api.fontshare.com/v2/fonts/download/satoshi";
const WANT = [
  { entry: "Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Variable.woff2", to: "src/fonts/Satoshi-Variable.woff2" },
  ...(process.argv.includes("--lettering")
    ? [{ entry: "Satoshi_Complete/Fonts/TTF/Satoshi-Variable.ttf", to: "assets/fonts/Satoshi-Variable.ttf" }]
    : []),
];

const missing = WANT.filter((w) => !fs.existsSync(path.join(ROOT, w.to)));
if (!missing.length) process.exit(0);

console.log(`fonts: downloading Satoshi from Fontshare (${missing.map((m) => m.to).join(", ")})`);
let zip;
for (let attempt = 1; ; attempt++) {
  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    zip = Buffer.from(await res.arrayBuffer());
    break;
  } catch (err) {
    if (attempt === 3) {
      console.error(`fonts: could not download Satoshi (${err.message}). Retry the build.`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

// Minimal ZIP reader: find the central directory, then each wanted entry.
const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) throw new Error("fonts: not a zip archive");
const count = zip.readUInt16LE(eocd + 10);
let p = zip.readUInt32LE(eocd + 16);
const entries = new Map();
for (let i = 0; i < count; i++) {
  const method = zip.readUInt16LE(p + 10);
  const size = zip.readUInt32LE(p + 20);
  const nameLen = zip.readUInt16LE(p + 28);
  const extraLen = zip.readUInt16LE(p + 30);
  const commentLen = zip.readUInt16LE(p + 32);
  const local = zip.readUInt32LE(p + 42);
  const name = zip.toString("utf8", p + 46, p + 46 + nameLen);
  entries.set(name, { method, size, local });
  p += 46 + nameLen + extraLen + commentLen;
}

for (const w of missing) {
  const e = entries.get(w.entry);
  if (!e) throw new Error(`fonts: ${w.entry} not found in the Fontshare package`);
  const start = e.local + 30 + zip.readUInt16LE(e.local + 26) + zip.readUInt16LE(e.local + 28);
  const raw = zip.subarray(start, start + e.size);
  const data = e.method === 8 ? zlib.inflateRawSync(raw) : raw;
  fs.mkdirSync(path.dirname(path.join(ROOT, w.to)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, w.to), data);
  console.log(`fonts: wrote ${w.to} (${data.length} bytes)`);
}

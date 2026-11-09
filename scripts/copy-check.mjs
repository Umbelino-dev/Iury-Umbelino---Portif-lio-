// Copy check: counts em-dashes and lists sentences over 24 words in every visible
// string (messages/*.json and the pt/en fields in src/content/*.ts).
// Usage: npm run copy:check
import fs from "node:fs";

const MAX_WORDS = 24;
const strings = { pt: [], en: [] };

const walk = (v, loc) => {
  if (typeof v === "string") strings[loc].push(v);
  else if (Array.isArray(v)) v.forEach((x) => walk(x, loc));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => walk(x, loc));
};
for (const loc of ["pt", "en"]) walk(JSON.parse(fs.readFileSync(`messages/${loc}.json`, "utf8")), loc);

// Content files: pick string literals after `pt:` / `en:` (single strings and arrays of strings).
for (const f of fs.readdirSync("src/content").filter((n) => n.endsWith(".ts"))) {
  const src = fs.readFileSync(`src/content/${f}`, "utf8");
  for (const m of src.matchAll(/\b(pt|en):\s*(\[[\s\S]*?\]|"(?:[^"\\]|\\.)*")/g)) {
    for (const s of m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)) strings[m[1]].push(s[1]);
  }
}

let failed = false;
for (const loc of ["pt", "en"]) {
  // Quoted text (“…”) is someone's words: not counted.
  const dashes = strings[loc].map((s) => s.replace(/“[^”]*”/g, "")).filter((s) => s.includes("—"));
  const long = strings[loc]
    .flatMap((s) => s.split(/(?<=[.!?])\s+/))
    .filter((s) => s.split(/\s+/).length > MAX_WORDS);
  console.log(`${loc}: ${dashes.length} string(s) with an em-dash, ${long.length} sentence(s) over ${MAX_WORDS} words`);
  dashes.forEach((s) => console.log("  — ", s.slice(0, 120)));
  long.forEach((s) => console.log("  long:", s.slice(0, 140)));
  if (dashes.length > 3) failed = true;
}
process.exit(failed ? 1 : 0);

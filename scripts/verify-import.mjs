import { readFile } from "node:fs/promises";

const exportPath = process.argv[2];
if (!exportPath) throw new Error("Usage: node scripts/verify-import.mjs <lodestone-export.json>");
const catalog = JSON.parse(await readFile(new URL("../public/data/quests.json", import.meta.url), "utf8"));
const payload = JSON.parse(await readFile(exportPath, "utf8"));
const language = payload.language === "fr" || payload.source?.includes("://fr.finalfantasyxiv.com") ? "fr" : "en";
const imported = payload.quests.map((entry) => normalize(clean(entry.name ?? entry, language)));
const counts = new Map();
for (const name of imported) counts.set(name, (counts.get(name) ?? 0) + 1);
const matched = new Set();
for (const [name, count] of counts) {
  const candidates = catalog.quests.filter((quest) =>
    normalize(language === "fr" ? quest.nameFr : quest.name) === name
    || (language === "fr" && quest.nameFrAliases.some((alias) => normalize(alias) === name)));
  for (const quest of candidates.slice(0, count)) matched.add(quest.id);
}
console.log(JSON.stringify({ language, exported: payload.quests.length, uniqueNames: counts.size, matched: matched.size }));

function clean(value, selectedLanguage) {
  const cleaned = value.replace(/[\uE000-\uF8FF]/g, "").replace(/\s+/g, " ").trim();
  if (selectedLanguage === "fr") {
    const first = cleaned.indexOf('"');
    const last = cleaned.lastIndexOf('"');
    if (first >= 0 && last > first) return cleaned.slice(first + 1, last).trim();
  }
  const category = cleaned.lastIndexOf(") (");
  if (category >= 0) {
    const name = cleaned.slice(category + 3);
    return (name.endsWith(")") ? name.slice(0, -1) : name).trim();
  }
  return cleaned;
}

function normalize(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\uE000-\uF8FF]/g, "").replace(/[\u00AD\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").toLocaleLowerCase().trim();
}

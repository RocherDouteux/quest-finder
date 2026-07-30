import { readFile } from "node:fs/promises";

const [englishPath, frenchPath] = process.argv.slice(2);
if (!englishPath || !frenchPath) {
  throw new Error("Usage: node scripts/compare-exports.mjs <english-export.json> <french-export.json>");
}
const catalog = JSON.parse(await readFile(new URL("../public/data/quests.json", import.meta.url), "utf8"));
const english = JSON.parse(await readFile(englishPath, "utf8"));
const french = JSON.parse(await readFile(frenchPath, "utf8"));
const englishByHash = new Map(english.quests.map((quest) => [quest.lodestoneId, cleanEnglish(quest.name)]));
const catalogByEnglish = new Map(catalog.quests.map((quest) => [normalize(quest.name), quest]));

for (const exported of french.quests) {
  const exportedFrench = cleanFrench(exported.name);
  if (catalog.quests.some((quest) => normalize(quest.nameFr) === normalize(exportedFrench))) continue;
  const englishName = englishByHash.get(exported.lodestoneId);
  const catalogQuest = catalogByEnglish.get(normalize(englishName ?? ""));
  console.log(JSON.stringify({
    hash: exported.lodestoneId,
    englishExport: englishName,
    frenchExport: exportedFrench,
    frenchCatalog: catalogQuest?.nameFr,
  }));
}

function cleanFrench(value) {
  const cleaned = value.replace(/[\uE000-\uF8FF]/g, "").replace(/\s+/g, " ").trim();
  const first = cleaned.indexOf('"');
  const last = cleaned.lastIndexOf('"');
  return first >= 0 && last > first ? cleaned.slice(first + 1, last).trim() : cleaned;
}
function cleanEnglish(value) {
  const cleaned = value.replace(/[\uE000-\uF8FF]/g, "").replace(/\s+/g, " ").trim();
  const category = cleaned.lastIndexOf(") (");
  if (category < 0) return cleaned;
  const name = cleaned.slice(category + 3);
  return (name.endsWith(")") ? name.slice(0, -1) : name).trim();
}
function normalize(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\uE000-\uF8FF]/g, "").replace(/[’‘]/g, "'").toLocaleLowerCase().trim();
}

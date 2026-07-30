import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://v2.xivapi.com/api/sheet/Quest";
const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/data/quests.json");
const validExpansions = new Set(["A Realm Reborn", "Heavensward", "Stormblood", "Shadowbringers", "Endwalker", "Dawntrail"]);
const english = await readLanguage("en");
const french = await readLanguage("fr");
const byNameAndExpansion = new Map();

for (const row of english.rows) {
  const f = row.fields;
  const name = f.Name?.trim();
  const expansion = f.Expansion?.fields?.Name;
  if (!name || !validExpansions.has(expansion)) continue;
  const localized = french.byId.get(row.row_id)?.fields ?? {};
  const key = `${expansion}\0${name.toLocaleLowerCase()}`;
  const existing = byNameAndExpansion.get(key);
  if (existing) {
    existing.ids.push(row.row_id);
    const frenchName = localized.Name?.trim();
    if (frenchName && frenchName !== existing.nameFr && !existing.nameFrAliases.includes(frenchName)) {
      existing.nameFrAliases.push(frenchName);
    }
    continue;
  }
  const rawLevel = f.ClassJobLevel;
  byNameAndExpansion.set(key, {
    id: row.row_id, ids: [row.row_id], name,
    nameFr: localized.Name?.trim() || name,
    nameFrAliases: name === "The Steps of Faith" ? ["Le Siège de la sainte Cité d'Ishgard"] : [],
    expansion,
    genre: f.JournalGenre?.fields?.Name || "Uncategorized",
    genreFr: localized.JournalGenre?.fields?.Name || f.JournalGenre?.fields?.Name || "Sans catégorie",
    area: f.PlaceName?.fields?.Name || "Unknown area",
    areaFr: localized.PlaceName?.fields?.Name || f.PlaceName?.fields?.Name || "Zone inconnue",
    level: Array.isArray(rawLevel) ? rawLevel[0] : rawLevel || 0,
    repeatable: Boolean(f.IsRepeatable),
  });
}

const quests = [...byNameAndExpansion.values()].sort((a, b) =>
  a.expansion.localeCompare(b.expansion) || a.area.localeCompare(b.area) || a.genre.localeCompare(b.genre) || a.name.localeCompare(b.name));
await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), gameVersion: english.version, quests }, null, 2)}\n`);
console.log(`Wrote ${quests.length} bilingual unique quests to ${OUTPUT}`);

async function readLanguage(language) {
  let after = 0;
  let version = "unknown";
  const rows = [];
  while (true) {
    const params = new URLSearchParams({
      fields: "Name,ClassJobLevel,Expansion.Name,JournalGenre.Name,PlaceName.Name,IsRepeatable",
      language, limit: "1000", after: String(after),
    });
    const response = await fetch(`${API}?${params}`);
    if (!response.ok) throw new Error(`XIVAPI returned ${response.status} for ${language}`);
    const page = await response.json();
    version = page.version ?? version;
    if (!page.rows?.length) break;
    rows.push(...page.rows);
    after = page.rows.at(-1).row_id;
  }
  return { rows, byId: new Map(rows.map((row) => [row.row_id, row])), version };
}

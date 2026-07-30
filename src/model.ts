export const EXPANSIONS = [
  "A Realm Reborn",
  "Heavensward",
  "Stormblood",
  "Shadowbringers",
  "Endwalker",
  "Dawntrail",
] as const;

export type Expansion = (typeof EXPANSIONS)[number];

export interface Quest {
  id: number;
  ids: number[];
  name: string;
  nameFr: string;
  nameFrAliases: string[];
  expansion: Expansion;
  genre: string;
  genreFr: string;
  area: string;
  areaFr: string;
  level: number;
  repeatable: boolean;
}

export interface QuestData {
  generatedAt: string;
  gameVersion: string;
  quests: Quest[];
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/[\u00AD\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, " ").toLocaleLowerCase().trim();
}

export function cleanExportedQuestName(value: string, language: "en" | "fr"): string {
  const cleaned = value.replace(/[\uE000-\uF8FF]/g, "").replace(/\s+/g, " ").trim();
  if (language === "fr") {
    const firstQuote = cleaned.indexOf('"');
    const lastQuote = cleaned.lastIndexOf('"');
    if (firstQuote >= 0 && lastQuote > firstQuote) {
      return cleaned.slice(firstQuote + 1, lastQuote).trim();
    }
  }
  const categoryParenthesis = cleaned.lastIndexOf(") (");
  if (categoryParenthesis >= 0) {
    const questName = cleaned.slice(categoryParenthesis + 3);
    return (questName.endsWith(")") ? questName.slice(0, -1) : questName).trim();
  }
  return cleaned;
}

export function findQuests(quests: Quest[], query: string, limit = 40): Quest[] {
  const needle = normalizeSearch(query);
  if (!needle) return [];
  return quests
    .map((quest, index) => {
      const names = [normalizeSearch(quest.name), normalizeSearch(quest.nameFr)];
      const score = Math.min(...names.map((name) =>
        name === needle ? 0 : name.startsWith(needle) ? 1 : name.includes(needle) ? 2 : 3));
      return { quest, score, index };
    })
    .filter(({ score }) => score < 3)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit).map(({ quest }) => quest);
}

export function matchImportedNames(quests: Quest[], names: string[]): Set<number> {
  const importedCounts = new Map<string, number>();
  for (const name of names) {
    const key = normalizeSearch(name);
    importedCounts.set(key, (importedCounts.get(key) ?? 0) + 1);
  }
  const candidates = new Map<string, number[]>();
  for (const quest of quests) {
    const keys = new Set([quest.name, quest.nameFr, ...quest.nameFrAliases].map(normalizeSearch));
    for (const key of keys) candidates.set(key, [...(candidates.get(key) ?? []), quest.id]);
  }
  const matched = new Set<number>();
  for (const [key, count] of importedCounts) {
    const available = (candidates.get(key) ?? []).filter((id) => !matched.has(id));
    for (const id of available.slice(0, count)) matched.add(id);
  }
  return matched;
}

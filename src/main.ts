import "./style.css";
import { cleanExportedQuestName, EXPANSIONS, findQuests, matchImportedNames, type Expansion, type Quest, type QuestData } from "./model";

type CatalogLanguage = "en" | "fr";
type LodestoneExport = {
  language?: string;
  source?: string;
  quests?: Array<string | { name?: string }>;
};

const response = await fetch("./data/quests.json");
if (!response.ok) throw new Error(`Could not load quest catalog (${response.status})`);
const data = await response.json() as QuestData;
const progressKey = "quest-finder.completed";
const catalogLanguageKey = "quest-finder.catalog-language";
let completed = new Set<number>(JSON.parse(localStorage.getItem(progressKey) ?? "[]"));
let catalogLanguage: CatalogLanguage = localStorage.getItem(catalogLanguageKey) === "fr" ? "fr" : "en";
let selectedExpansion: Expansion | null = null;
let query = "";
const app = document.querySelector<HTMLElement>("#app")!;

app.innerHTML = `
  <header class="topbar"><span>QUEST FINDER</span><span id="catalog-language"></span></header>
  <section class="hero compact"><p class="eyebrow">FINAL FANTASY XIV · COMPLETION TRACKER</p><h1>Every quest. Every expansion.</h1>
    <p class="lede">Import your private Lodestone quest history, then explore what remains by zone and category.</p>
    <div class="actions"><label class="import-button">Import Lodestone export<input id="import-file" type="file" accept=".json,application/json" hidden></label>
    <button id="reset" class="secondary">Reset progress</button></div>
    <p id="import-status" class="prompt">The export language automatically controls quest, zone, and category names.</p></section>
  <section><div class="section-heading"><div><p class="eyebrow">PROGRESS</p><h2>Quests left by expansion</h2></div>
    <p class="data-stamp">${data.quests.length.toLocaleString()} catalogued · ${new Date(data.generatedAt).toLocaleDateString("en-US")}</p></div>
    <div id="progress-grid" class="progress-grid"></div></section>
  <section id="expansion-details" class="expansion-details" hidden></section>
  <section class="catalog"><div class="section-heading"><div><p class="eyebrow">MANUAL REVIEW</p><h2>Quest catalog</h2></div></div>
    <input id="catalog-search" class="catalog-search" type="search" placeholder="Search a quest name…" autocomplete="off"><div id="quest-list" class="quest-list"></div></section>
  <aside class="note"><strong>Accuracy note.</strong> Lodestone has no supported public quest API. Mutually exclusive, retired, seasonal, repeatable, and hidden quests may require manual correction.</aside>
  <footer><span>Unofficial fan-made tool. Not affiliated with Square Enix.</span><span>Lodestone Helper is included with the project.</span></footer>`;

document.querySelector<HTMLInputElement>("#import-file")!.addEventListener("change", importFile);
document.querySelector<HTMLButtonElement>("#reset")!.addEventListener("click", () => {
  if (!confirm("Clear all imported and manually checked progress?")) return;
  completed.clear();
  localStorage.removeItem(progressKey);
  render();
});
document.querySelector<HTMLInputElement>("#catalog-search")!.addEventListener("input", (event) => {
  query = (event.target as HTMLInputElement).value;
  renderList();
});
render();

function render(): void {
  document.querySelector<HTMLElement>("#catalog-language")!.textContent =
    `Catalog data: ${catalogLanguage === "fr" ? "Français" : "English"}`;
  document.querySelector<HTMLElement>("#progress-grid")!.innerHTML = EXPANSIONS.map((expansion, index) => {
    const quests = data.quests.filter((quest) => quest.expansion === expansion);
    const done = quests.filter((quest) => completed.has(quest.id)).length;
    const percent = quests.length ? Math.round(done / quests.length * 100) : 0;
    return `<button class="card ${selectedExpansion === expansion ? "active" : ""}" data-expansion="${expansion}">
      <div class="card-top"><span class="roman">${["II","III","IV","V","VI","VII"][index]}</span><span class="percent">${percent}%</span></div>
      <h3>${expansion}</h3><div class="count"><strong>${(quests.length - done).toLocaleString()}</strong><span>quests left</span></div>
      <div class="bar"><span style="width:${percent}%"></span></div><p>${done.toLocaleString()} completed · ${quests.length.toLocaleString()} catalogued</p></button>`;
  }).join("");
  document.querySelectorAll<HTMLButtonElement>("[data-expansion]").forEach((button) => button.addEventListener("click", () => {
    selectedExpansion = button.dataset.expansion as Expansion;
    render();
    document.querySelector("#expansion-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  renderDetails();
  renderList();
}

function renderDetails(): void {
  const section = document.querySelector<HTMLElement>("#expansion-details")!;
  if (!selectedExpansion) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  const areas = new Map<string, Quest[]>();
  for (const quest of data.quests.filter((item) => item.expansion === selectedExpansion)) {
    const area = localArea(quest);
    areas.set(area, [...(areas.get(area) ?? []), quest]);
  }
  section.innerHTML = `<div class="details-heading"><div><p class="eyebrow">ZONE BREAKDOWN</p><h2>${selectedExpansion}</h2></div>
    <button id="close-details" class="secondary">Close details</button></div><div class="zone-grid">${[...areas.entries()]
    .sort(([a], [b]) => a.localeCompare(b, dataLocale())).map(([area, quests]) => zoneBlock(area, quests)).join("")}</div>`;
  document.querySelector("#close-details")!.addEventListener("click", () => {
    selectedExpansion = null;
    render();
  });
  bindQuestCheckboxes(section);
}

function zoneBlock(area: string, quests: Quest[]): string {
  const remaining = quests.filter((quest) => !completed.has(quest.id)).length;
  const genres = new Map<string, Quest[]>();
  for (const quest of quests) {
    const genre = localGenre(quest);
    genres.set(genre, [...(genres.get(genre) ?? []), quest]);
  }
  return `<details class="zone"><summary><span>${escapeHtml(area)}</span><small>${remaining.toLocaleString()} quests left</small></summary>
    <div class="genre-list">${[...genres.entries()].sort(([a], [b]) => a.localeCompare(b, dataLocale())).map(([genre, genreQuests]) =>
      `<section class="genre"><h4>${escapeHtml(genre)}</h4>${genreQuests.map(questRow).join("")}</section>`).join("")}</div></details>`;
}

function renderList(): void {
  const list = document.querySelector<HTMLElement>("#quest-list")!;
  const matches = query.trim() ? findQuests(data.quests, query) : [];
  list.innerHTML = query.trim() && !matches.length ? `<p class="prompt">No quest found.</p>` : matches.map(questRow).join("");
  bindQuestCheckboxes(list);
}

function questRow(quest: Quest): string {
  return `<div class="quest-row"><input aria-label="Completed" data-id="${quest.id}" type="checkbox" ${completed.has(quest.id) ? "checked" : ""}>
    <a href="${wikiUrl(quest)}" target="_blank" rel="noreferrer" title="Open on FFXIV Wiki"><strong>${escapeHtml(localName(quest))}</strong>
      <small>${escapeHtml(localArea(quest))} · Lv. ${quest.level}${quest.repeatable ? " · Repeatable" : ""} ↗</small></a></div>`;
}

function bindQuestCheckboxes(root: ParentNode): void {
  root.querySelectorAll<HTMLInputElement>("input[data-id]").forEach((input) => input.addEventListener("change", () => {
    const id = Number(input.dataset.id);
    input.checked ? completed.add(id) : completed.delete(id);
    saveProgress();
    render();
  }));
}

async function importFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text()) as LodestoneExport;
    catalogLanguage = detectExportLanguage(payload);
    const names = (payload.quests ?? [])
      .map((entry) => typeof entry === "string" ? entry : entry.name ?? "")
      .filter(Boolean)
      .map((name) => cleanExportedQuestName(name, catalogLanguage));
    completed = matchImportedNames(data.quests, names);
    localStorage.setItem(catalogLanguageKey, catalogLanguage);
    saveProgress();
    render();
    document.querySelector<HTMLElement>("#import-status")!.textContent =
      `Imported ${names.length.toLocaleString()} ${catalogLanguage.toUpperCase()} entries; matched ${completed.size.toLocaleString()} catalog quests.`;
  } catch {
    document.querySelector<HTMLElement>("#import-status")!.textContent = "That file is not a valid Quest Finder Lodestone export.";
  }
}

function detectExportLanguage(payload: LodestoneExport): CatalogLanguage {
  if (payload.language?.toLowerCase().startsWith("fr")) return "fr";
  if (payload.source?.includes("://fr.finalfantasyxiv.com")) return "fr";
  return "en";
}
function localName(quest: Quest): string { return catalogLanguage === "fr" ? quest.nameFr : quest.name; }
function localArea(quest: Quest): string { return catalogLanguage === "fr" ? quest.areaFr : quest.area; }
function localGenre(quest: Quest): string { return catalogLanguage === "fr" ? quest.genreFr : quest.genre; }
function dataLocale(): string { return catalogLanguage === "fr" ? "fr-FR" : "en-US"; }
function wikiUrl(quest: Quest): string { return `https://ffxiv.consolegameswiki.com/wiki/${encodeURIComponent(quest.name.replaceAll(" ", "_"))}`; }
function saveProgress(): void { localStorage.setItem(progressKey, JSON.stringify([...completed])); }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[character]!); }

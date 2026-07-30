import { describe, expect, it } from "vitest";
import { cleanExportedQuestName, findQuests, matchImportedNames, type Quest } from "./model";

const quests: Quest[] = [
  { id: 1, ids: [1], name: "Close to Home", nameFr: "Près du foyer", nameFrAliases: [], expansion: "A Realm Reborn", genre: "Main Scenario", genreFr: "Épopée", area: "Gridania", areaFr: "Gridania", level: 1, repeatable: false },
  { id: 2, ids: [2], name: "A Test of Will", nameFr: "Une volonté à l'épreuve", nameFrAliases: [], expansion: "Heavensward", genre: "Sidequests", genreFr: "Quêtes annexes", area: "Ishgard", areaFr: "Ishgard", level: 50, repeatable: false },
];

describe("quest matching", () => {
  it("searches case-insensitively", () => {
    expect(findQuests(quests, "TEST").map(({ id }) => id)).toEqual([2]);
  });

  it("searches French quest names", () => {
    expect(findQuests(quests, "volonté").map(({ id }) => id)).toEqual([2]);
  });

  it("matches a Lodestone export by normalized quest name", () => {
    expect([...matchImportedNames(quests, ["close to home"])]).toEqual([1]);
  });

  it("matches French Lodestone quest names", () => {
    expect([...matchImportedNames(quests, ["Une volonté à l’épreuve"])]).toEqual([2]);
  });

  it("extracts a quest from the French Lodestone display format", () => {
    expect(cleanExportedQuestName('Quêtes de DPS magique (Shadowbringers) "Un siècle de larmes"', "fr"))
      .toBe("Un siècle de larmes");
  });

  it("repairs the old English helper output for categories with parentheses", () => {
    expect(cleanExportedQuestName("Shadowbringers) (A Tearful Reunion", "en")).toBe("A Tearful Reunion");
  });

  it("ignores soft hyphens and quote typography", () => {
    expect(matchImportedNames([{ ...quests[0], nameFr: "Un acte im­par­don­na­ble", nameFrAliases: ['Il dit “pardonné” ?'] }], ['Il dit "pardonné" ?']).size).toBe(1);
  });

  it("does not mark more same-name catalog rows than the export contains", () => {
    const duplicate = { ...quests[0], id: 3 };
    expect(matchImportedNames([quests[0], duplicate], ["Près du foyer"]).size).toBe(1);
  });
});

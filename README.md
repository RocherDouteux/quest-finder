# Quest Finder

Quest Finder is an external, local-first completion tracker for every
catalogued quest in Final Fantasy XIV. It displays remaining quests by
expansion, zone, and quest category without requiring an in-game plugin.

## Features

- Progress totals for A Realm Reborn through Dawntrail
- Expansion drill-down by zone and quest category
- Links from individual quests to the FFXIV Community Wiki
- English and French quest data, selected automatically from the export
- Searchable manual completion corrections
- Progress stored only in the browser

## Requirements

Quest Finder requires [Node.js](https://nodejs.org/) 22 or newer. npm is
installed automatically with Node.js.

On Windows, either download the current LTS installer from the Node.js website
or install it with Windows Package Manager:

```powershell
winget install OpenJS.NodeJS.LTS
```

Open a new terminal after installation and verify both commands are available:

```powershell
node --version
npm --version
```

## Run Quest Finder

Clone the repository and enter its directory:

```powershell
git clone https://github.com/RocherDouteux/quest-finder.git
cd quest-finder
```

Install the dependencies:

```powershell
npm install
```

Start the local development server:

```powershell
npm run dev
```

Open the address printed by Vite, normally
[http://localhost:5173](http://localhost:5173).

## Install the Lodestone Helper

The included browser extension reads the completed quests visible to you on
your private Lodestone pages. It does not export your password, cookies, or
other account credentials.

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** in the upper-right corner.
3. Select **Load unpacked**.
4. Select the repository's `lodestone-helper` directory.

### Microsoft Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Select the repository's `lodestone-helper` directory.

When the helper is updated, return to the extensions page and select
**Reload** on its card.

## Export completed quests

1. Sign in to the
   [English Lodestone](https://eu.finalfantasyxiv.com/lodestone/) or
   [French Lodestone](https://fr.finalfantasyxiv.com/lodestone/).
2. Open your character profile.
3. Select the **Quests** tab to open **My Quests**.
4. Select **Export quests for Quest Finder** in the lower-right corner.
5. Wait while the helper reads every results page.
6. The browser downloads `quest-finder-lodestone.json`.

The export records its Lodestone language. Quest Finder uses that value
automatically for quest, zone, and category names. The application interface
itself remains in English.

## Import the export

1. Return to Quest Finder.
2. Select **Import Lodestone export**.
3. Choose the downloaded `quest-finder-lodestone.json`.
4. Review the matched total and use manual search for any exceptional quests.
5. Select an expansion card to browse remaining quests by zone and category.

Importing a new file replaces the previously imported completion set. Manual
changes and imported progress remain in that browser's local storage.

## How it works

Dalamud plugins such as
[keifufu/QuestTracker](https://github.com/keifufu/QuestTracker) can read
completion flags directly from the running game's `QuestManager`. An external
application cannot use that in-game API.

Quest Finder combines:

- bilingual game data generated from [XIVAPI v2](https://v2.xivapi.com/);
- a narrowly scoped Lodestone browser helper;
- normalized English and French quest-name matching;
- local browser storage for progress and manual corrections.

No Lodestone credentials are sent to Quest Finder.

## Development and validation

Run the tests and production build:

```powershell
npm run check
```

Refresh the committed XIVAPI catalog after a game patch:

```powershell
npm run update-data
```

The production build is written to `dist`:

```powershell
npm run build
```

## Limitations

- Wiki links use canonical English quest titles because the linked community
  wiki is English.
- Mutually exclusive, retired, seasonal, repeatable, hidden, and levequest
  entries can differ between current game data and Lodestone history.
- The helper may require selector updates if Square Enix changes Lodestone
  markup.

## License

Quest Finder is licensed under
[AGPL-3.0-or-later](LICENSE.md).

FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.
FINAL FANTASY XIV (C) SQUARE ENIX CO., LTD. This project is not affiliated
with or endorsed by Square Enix.

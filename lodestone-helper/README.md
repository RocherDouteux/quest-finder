# Lodestone Helper

This unpacked Chromium extension exports the completed quests visible in your private Lodestone **My Quests** pages. It never reads or exports passwords, cookies, or account credentials.

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `lodestone-helper` directory.
4. Sign in to the English Lodestone and open your character's **My Quests** page.
5. Click **Export quests for Quest Finder** in the lower-right corner.
6. Import the downloaded JSON file into Quest Finder.

The helper is intentionally limited to Lodestone pages and performs its work locally in your browser session.
The export records whether it came from the English or French Lodestone.
Quest Finder uses that value automatically for quest, zone, and category names;
there is no language setting to configure.

If the helper directory is updated, click **Reload** on its card in
`chrome://extensions` or `edge://extensions` before exporting again.

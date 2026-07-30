(() => {
  if (document.querySelector("#quest-finder-export")) return;
  const button = document.createElement("button");
  button.id = "quest-finder-export";
  button.textContent = "Export quests for Quest Finder";
  Object.assign(button.style, {
    position: "fixed", right: "20px", bottom: "20px", zIndex: "99999",
    padding: "12px 18px", background: "#12343a", color: "white",
    border: "1px solid #53d6da", borderRadius: "4px", cursor: "pointer",
  });
  document.body.append(button);
  button.addEventListener("click", exportQuests);

  async function exportQuests() {
    button.disabled = true;
    button.textContent = "Reading My Quests...";
    try {
      const questRoot = location.pathname.match(/^(\/lodestone\/character\/\d+\/quest\/)/)?.[1];
      if (!questRoot) throw new Error("This is not a character My Quests page.");
      const firstUrl = new URL(location.href);
      firstUrl.hash = "";
      firstUrl.searchParams.delete("page");
      const listingParameters = normalizedParameters(firstUrl);
      const pending = [firstUrl.href];
      const visited = new Set();
      const quests = new Map();

      while (pending.length && visited.size < 250) {
        const url = pending.shift();
        if (visited.has(url)) continue;
        visited.add(url);
        button.textContent = `Reading My Quests... page ${visited.size}`;
        const html = url === location.href
          ? document.documentElement.outerHTML
          : await (await fetch(url, { credentials: "include" })).text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        doc.querySelectorAll("li.entry__quest").forEach((entry) => {
          const questElement = entry.querySelector('[href*="/lodestone/playguide/db/quest/"]');
          const nameElement = entry.querySelector(".entry__quest__name p");
          if (!questElement || !nameElement) return;
          const href = questElement.getAttribute("href") ?? "";
          const id = href.match(/\/quest\/([^/]+)/)?.[1];
          const name = extractQuestName(nameElement, location.hostname.startsWith("fr.") ? "fr" : "en");
          if (name) quests.set(`${id}:${name}`, { name, lodestoneId: id });
        });
        doc.querySelectorAll("a[href]").forEach((anchor) => {
          const next = new URL(anchor.getAttribute("href"), location.origin);
          next.hash = "";
          if (
            next.origin === location.origin
            && next.pathname === questRoot
            && normalizedParameters(next) === listingParameters
            && next.searchParams.has("page")
            && !visited.has(next.href)
          ) {
            pending.push(next.href);
          }
        });
      }

      const payload = {
        format: "quest-finder-lodestone-v1",
        exportedAt: new Date().toISOString(),
        source: location.origin,
        language: location.hostname.startsWith("fr.") ? "fr" : "en",
        quests: [...quests.values()],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "quest-finder-lodestone.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      button.textContent = `Exported ${quests.size} quests`;
    } catch (error) {
      console.error(error);
      button.textContent = "Export failed - see console";
    } finally {
      button.disabled = false;
    }
  }

  function normalizedParameters(url) {
    const parameters = new URLSearchParams(url.search);
    parameters.delete("page");
    parameters.sort();
    return parameters.toString();
  }

  function extractQuestName(nameElement, language) {
    const breakElement = nameElement.querySelector("br");
    let displayText = "";
    if (breakElement) {
      for (let node = breakElement.nextSibling; node; node = node.nextSibling) {
        displayText += node.textContent ?? "";
      }
    } else {
      displayText = nameElement.textContent ?? "";
    }
    displayText = displayText.replace(/[\uE000-\uF8FF]/g, "").replace(/\s+/g, " ").trim();
    if (language === "fr") {
      const firstQuote = displayText.indexOf('"');
      const lastQuote = displayText.lastIndexOf('"');
      if (firstQuote >= 0 && lastQuote > firstQuote) {
        return displayText.slice(firstQuote + 1, lastQuote).trim();
      }
    }
    const categoryParenthesis = displayText.lastIndexOf(") (");
    if (categoryParenthesis >= 0 && displayText.endsWith(")")) {
      return displayText.slice(categoryParenthesis + 3, -1).trim();
    }
    const openingParenthesis = displayText.indexOf("(");
    if (openingParenthesis >= 0 && displayText.endsWith(")")) {
      return displayText.slice(openingParenthesis + 1, -1).trim();
    }
    return displayText;
  }
})();

// background.js
const BASE_ID = "sendToSitesUrl_";

const preferenceLabels = {
  1: "Save (Low Priority)",
  2: "Save (Below Average)",
  3: "Save (Medium)",
  4: "Save (Above Average)",
  5: "Save (High Priority)"
};

// Create context menu items on install
chrome.runtime.onInstalled.addListener(() => {
  for (let i = 1; i <= 5; i++) {
    chrome.contextMenus.create({
      id: `${BASE_ID}${i}`,
      title: preferenceLabels[i],
      contexts: ["page"]
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info, tab);

  const match = info.menuItemId.match(/^sendToSitesUrl_(\d)$/);
  if (match && tab?.url) {
    const preference = parseInt(match[1], 10);
    collectAndSend(tab.id, tab.url, tab.title || null, preference);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  console.log("Command received:", command);
  const match = command.match(/^save_preference_(\d)$/);
  if (match) {
    const preference = parseInt(match[1], 10);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      console.log(`Saving tab with preference ${preference}:`, tab.url);
      collectAndSend(tab.id, tab.url, tab.title || null, preference);
    }
  }
});

// Collect extra data if Instagram, then send all data to API
function collectAndSend(tabId, url, title, preference) {
  console.log(`collectAndSend → url: ${url}, preference: ${preference}`);
  if (url.includes("instagram.com")) {
    chrome.tabs.sendMessage(tabId, { action: "scrape_instagram" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Content script not responding:", chrome.runtime.lastError.message);
        sendToApi(url, title, preference);
        return;
      }
      console.log("Scraped data received from content script:", response);
      const extra = response?.scrapedData || null;
      sendToApi(url, title, preference, extra);
    });
  } else {
    sendToApi(url, title, preference);
  }
}

// Send POST to backend with optional extra data
function sendToApi(url, title, preference, extraData = null) {
  console.log(`sendToApi → url: ${url}, title: ${title}, preference: ${preference}, extraData:`, extraData);

  chrome.storage.local.get("authToken", ({ authToken }) => {
    if (!authToken) {
      console.error("❌ No auth token found. Please set it in the options page.");
      return;
    }

    // Use extraData as description string if present, fallback to title
    const description = extraData
      ? Object.entries(extraData)
          .map(([key, val]) => `${key}: ${val}`)
          .join("\n")
      : title;

    const dto = {
      url,
      description,
      preference,
    };

    console.log("📡 Sending to API:", dto);

    fetch("http://localhost:3000/api/sites-url", {
      method: "POST",
      headers: {
        'x-api-key': authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dto)
    })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`❌ Failed to save: ${res.status} ${errText}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log(`✅ Saved with preference ${preference}:`, data);
    })
    .catch((err) => {
      console.error(`🚫 Error sending data (pref ${preference}):`, err);
    });
  });
}


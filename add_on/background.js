const BASE_ID = "sendToSitesUrl_";

const preferenceLabels = {
  1: "Save (Low Priority)",
  2: "Save (Below Average)",
  3: "Save (Medium)",
  4: "Save (Above Average)",
  5: "Save (High Priority)",
  6: "Save (Highest Priority)"
};

chrome.storage.local.get("authToken", ({ authToken }) => {
  console.log("🔍 Background sees authToken:", authToken);
});

chrome.runtime.onInstalled.addListener(() => {
  for (let i = 1; i <= 6; i++) {
    chrome.contextMenus.create({
      id: `${BASE_ID}${i}`,
      title: preferenceLabels[i],
      contexts: ["page"]
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const match = info.menuItemId.match(/^sendToSitesUrl_(\d)$/);
  if (match && tab?.url) {
    const preference = parseInt(match[1], 10);
    collectAndSend(tab.id, tab.url, tab.title || null, preference);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const match = command.match(/^save_preference_(\d)$/);
  if (match) {
    const preference = parseInt(match[1], 10);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      collectAndSend(tab.id, tab.url, tab.title || null, preference);
    }
  }
});

function collectAndSend(tabId, url, title, preference) {
  if (!url.startsWith("http")) {
    console.warn("Skipping unsupported URL scheme:", url);
    notify("Invalid URL", `Unsupported scheme: ${url}`, true);
    return;
  }

  if (url.includes("instagram.com")) {
    chrome.tabs.sendMessage(tabId, { action: "scrape_instagram" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Content script not responding:", chrome.runtime.lastError.message);
        sendToApi(url, 0, title, preference);
        return;
      }
      const extra = response?.scrapedData || null;
      const posts = parseInt(response?.scrapedData.posts, 10) || 0;
      sendToApi(url, posts, title, preference, extra);
    });
  } else {
    sendToApi(url, 0, title, preference);
  }
}

function sendToApi(url, posts, title, preference, extraData = null) {
  chrome.storage.local.get("authToken", ({ authToken }) => {
    if (!authToken) {
      console.error("❌ No auth token found. Please set it in the options page.");
      notify("Missing Auth Token", "Please configure the token in extension options.", true);
      chrome.runtime.openOptionsPage();
      return;
    }

    const description = extraData
      ? Object.entries(extraData)
          .map(([key, val]) => `${key}: ${val}`)
          .join("\n")
      : title;

    const dto = {
      url,
      posts,
      description,
      preference,
    };

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
      notify("✅ Saved Successfully",  `${url} saved with preference ${preference}`);
    })
    .catch((err) => {
      console.error(`🚫 Error sending data (pref ${preference}):`, err);
      notify("❌ Failed to Save", err.message || "An error occurred", true);
    });
  });
}

// Show Chrome notification
function notify(title, message, isError = false) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png", // Make sure this exists in your extension!
    title,
    message,
    priority: 1
  });
}

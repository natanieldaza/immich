function scrapeInstagram() {
  const desc = document.querySelector('meta[name="description"]')?.content || "";

  console.log("🔍 Scraping Instagram profile meta description:", desc);

  const match = desc.match(/^([\d.,KM]+) Followers, ([\d.,KM]+) Following, ([\d.,KM]+) Posts - (.+?) on Instagram: (.+)$/s);

  if (!match) {
    console.log("❌ Instagram profile meta description not matched.");
    return null;
  }

  const [_, followers, following, posts, identity, bioRaw] = match;

  let full_name = null;
  let username = null;

  if (identity.startsWith('@')) {
    username = identity.slice(1).trim();
  } else {
    const nameMatch = identity.match(/^(.+?) \(@(.+?)\)$/);
    if (nameMatch) {
      full_name = nameMatch[1].trim();
      username = nameMatch[2].trim();
    } else {
      full_name = identity.trim();
    }
  }

  const bio = bioRaw.replace(/^["']|["']$/g, "").trim(); // remove surrounding quotes if any

  return {
    full_name,
    username,
    bio,
    followers,
    following,
    posts,
  };
}




// Listen for background script requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrape_instagram") {
    const data = scrapeInstagram();
    sendResponse({ scrapedData: data });
    console.log("✅ Responding with scraped Instagram profile:", data);
    return true; // Important to keep sendResponse async
  }
});

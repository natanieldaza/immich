// options.js
const tokenInput = document.getElementById("token");
const saveBtn = document.getElementById("save");
const statusText = document.getElementById("status");

// Load existing token on page load
chrome.storage.local.get("authToken", ({ authToken }) => {
  if (authToken) tokenInput.value = authToken;
});

// Save the token
saveBtn.onclick = () => {
  const token = tokenInput.value.trim();
  if (!token) {
    statusText.textContent = "❌ Token cannot be empty.";
    return;
  }

  chrome.storage.local.set({ authToken: token }, () => {
    statusText.textContent = "✅ Token saved successfully.";
    setTimeout(() => statusText.textContent = "", 3000);
  });
};

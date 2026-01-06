let offscreenReady = false;

async function ensureOffscreen() {
  if (offscreenReady) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["DOM_SCRAPING"],
    justification: "Local AI reasoning"
  });
  offscreenReady = true;
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  await ensureOffscreen();

  if (msg.action === "INDEX_PAGE") {
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: "INDEX",
      tabId: msg.tabId
    });
    sendResponse({ success: true });
  }

  if (msg.action === "SUMMARIZE_PAGE") {
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: "SUMMARIZE",
      tabId: msg.tabId
    });
    sendResponse({ success: true });
  }

  if (msg.action === "FILL_FORM") {
    chrome.scripting.executeScript({
      target: { tabId: msg.tabId },
      func: () => {
        const input = document.querySelector("input[type=email], input[name*=user]");
        if (input) input.style.border = "2px solid orange";
      }
    });
    sendResponse({ success: true, message: "Username field highlighted" });
  }

  return true;
});

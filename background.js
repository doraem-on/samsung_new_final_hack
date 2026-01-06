let offscreenReady = false;

async function ensureOffscreen() {
  if (offscreenReady) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["DOM_SCRAPING"],
    justification: "Local AI agent"
  });

  offscreenReady = true;
}

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  await ensureOffscreen();

  // Forward ONLY agent-related messages
  if (msg.type === "INDEX" || msg.type === "ASK_AGENT") {
    chrome.runtime.sendMessage(msg);
  }

  // Handle UI-only actions
  if (msg.action === "HIGHLIGHT_USERNAME") {
    chrome.scripting.executeScript({
      target: { tabId: msg.tabId },
      func: () => {
        const input = document.querySelector(
          "input[type=email], input[name*=user], input[id*=user]"
        );
        if (input) input.style.outline = "2px solid orange";
      }
    });
  }
});

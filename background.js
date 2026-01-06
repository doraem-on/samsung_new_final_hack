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

// DEMO-SAFE credential helper
function fillDemoCredentials(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const user = document.querySelector(
        "input[type=email], input[type=text], input[name*=user], input[id*=user]"
      );
      const pass = document.querySelector("input[type=password]");

      if (user) {
        user.value = "demo_user";
        user.style.outline = "2px solid red";
      }
      if (pass) {
        pass.value = "demo_password";
        pass.style.outline = "2px solid red";
      }
    }
  });
}

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  await ensureOffscreen();

  if (msg.type === "INDEX" || msg.type === "ASK_AGENT") {
    chrome.runtime.sendMessage(msg);
  }

  if (msg.action === "FILL_DEMO_CREDENTIALS") {
    fillDemoCredentials(msg.tabId);
  }
});

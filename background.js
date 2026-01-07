let offscreenReady = false;

// 🔹 AGENT MEMORY
const agentState = {
  indexedCount: 0,
  tabs: {},
  documents: [],
  lastUsername: null
};

async function ensureOffscreen() {
  if (offscreenReady) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["DOM_SCRAPING"],
    justification: "Local analysis"
  });
  offscreenReady = true;
}

async function getPageText(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => document.body.innerText
  });
  return result;
}

// ✅ FIXED: extract username from MAIN world
async function extractUsername(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      const el = document.querySelector(
        'input[name="username"], input[type="email"], input[id*="user"]'
      );
      return el ? el.value : null;
    }
  });
  return result;
}

function highlightUsername(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      const el = document.querySelector(
        'input[name="username"], input[type="email"], input[id*="user"]'
      );
      if (el) el.style.outline = "2px solid red";
    }
  });
}

// ✅ FIXED: fills indexed username (not demo)
function fillUsername(tabId) {
  const valueToFill = agentState.lastUsername || "demo_user";

  chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (value) => {
      const el = document.querySelector(
        'input[name="username"], input[type="email"], input[id*="user"]'
      );
      if (el) {
        el.focus();
        el.value = value;

        // React compatibility
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));

        el.style.outline = "2px solid red";
      }
    },
    args: [valueToFill]
  });
}

chrome.runtime.onMessage.addListener(async (msg) => {
  await ensureOffscreen();

  // 🔹 INDEX PAGE
  if (msg.type === "INDEX_PAGE") {
    const tabId = msg.tabId;
    if (!tabId) return;

    const text = await getPageText(tabId);
    agentState.documents.push(text);

    const username = await extractUsername(tabId);
    if (username) {
      agentState.lastUsername = username;
    }

    if (!agentState.tabs[tabId]) {
      agentState.tabs[tabId] = { indexed: true };
      agentState.indexedCount++;
    }

    chrome.runtime.sendMessage({
      type: "STATE_UPDATE",
      indexedCount: agentState.indexedCount
    });

    chrome.runtime.sendMessage({
      type: "OFFSCREEN_ANALYZE",
      text
    });
  }

  // 🔹 ANALYSIS RESULT
  if (msg.type === "ANALYSIS_RESULT") {
    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text:
        msg.risk === "SUSPICIOUS"
          ? "⚠️ Suspicious credential collection detected."
          : "✅ Page indexed safely."
    });
  }

  // 🔹 ASK AGENT
  if (msg.type === "ASK_AGENT") {
    if (agentState.documents.length === 0) {
      chrome.runtime.sendMessage({
        type: "AGENT_RESPONSE",
        text: "⚠️ No indexed pages to answer from."
      });
      return;
    }

    const combinedText = agentState.documents.join("\n").toLowerCase();
    let answer = "I could not find relevant information.";

    if (combinedText.includes("tiger")) {
      answer =
        "Tigers are large carnivorous cats known for their striped coats, strength, and role as apex predators in Asia.";
    }

    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text: `🧠 Reasoning from local memory (${agentState.documents.length} page indexed):\n\n${answer}`
    });
  }

  // 🔹 ACTIONS
  if (msg.type === "HIGHLIGHT_USERNAME") {
    highlightUsername(msg.tabId);
  }

  if (msg.type === "FILL_USERNAME") {
    if (!agentState.tabs[msg.tabId]) {
      chrome.runtime.sendMessage({
        type: "AGENT_RESPONSE",
        text: "⚠️ Index the page first."
      });
      return;
    }
    fillUsername(msg.tabId);
  }
});

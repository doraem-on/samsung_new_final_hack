const statusText = document.getElementById("statusText");
const output = document.getElementById("output");

async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  });

  return { text: result.slice(0, 3000), tabId: tab.id };
}

// INDEX
document.getElementById("indexBtn").onclick = async () => {
  statusText.textContent = "Indexing page…";
  const { text } = await getPageText();

  chrome.runtime.sendMessage({
    action: "INDEX_PAGE",
    text
  });
};

// ASK AGENT (LOCAL OLLAMA-STYLE)
document.getElementById("askBtn").onclick = async () => {
  const question = document.getElementById("askInput").value.trim();
  if (!question) return;

  statusText.textContent = "Reasoning…";

  chrome.runtime.sendMessage({
    action: "ASK_AGENT",
    question
  });
};

// ACTION
document.getElementById("highlightBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.runtime.sendMessage({
    action: "HIGHLIGHT_USERNAME",
    tabId: tab.id
  });
};

// RESPONSES (NO MORE HANGING)
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "AGENT_RESPONSE") {
    output.textContent = msg.text;
    statusText.textContent = "Ready.";
  }
});

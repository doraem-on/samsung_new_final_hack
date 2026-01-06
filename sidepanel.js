const statusText = document.getElementById("statusText");
const output = document.getElementById("output");
const memoryBadge = document.getElementById("memoryBadge");

async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  });

  return { text: result.slice(0, 3000), tabId: tab.id };
}

document.getElementById("indexBtn").onclick = async () => {
  statusText.textContent = "Indexing page…";
  const { text } = await getPageText();

  chrome.runtime.sendMessage({
    type: "INDEX",
    text
  });
};

document.getElementById("askBtn").onclick = () => {
  const question = document.getElementById("askInput").value.trim();
  if (!question) return;

  statusText.textContent = "Reasoning…";

  chrome.runtime.sendMessage({
    type: "ASK_AGENT",
    question
  });
};

document.getElementById("highlightBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.runtime.sendMessage({
    action: "HIGHLIGHT_USERNAME",
    tabId: tab.id
  });
};

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "AGENT_RESPONSE") {
    output.textContent = msg.text;
    statusText.textContent = "Ready.";
    if (msg.memoryCount !== undefined) {
      memoryBadge.textContent = `Indexed pages: ${msg.memoryCount}`;
    }
  }
});

const output = document.getElementById("output");

async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  });

  return { text: result.slice(0, 3000), tabId: tab.id };
}

document.getElementById("indexBtn").onclick = async () => {
  output.textContent = "Indexing page...";
  const { text } = await getPageText();
  chrome.runtime.sendMessage({ action: "INDEX_PAGE", text });
};

document.getElementById("summarizeBtn").onclick = async () => {
  output.textContent = "Summarizing...";
  const { text } = await getPageText();
  chrome.runtime.sendMessage({ action: "SUMMARIZE_PAGE", text });
};

document.getElementById("highlightBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const res = await chrome.runtime.sendMessage({
    action: "HIGHLIGHT_USERNAME",
    tabId: tab.id
  });
  output.textContent = res.message;
};

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "AGENT_RESPONSE") {
    output.textContent = msg.text;
  }
});

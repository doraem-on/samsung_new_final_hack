const out = document.getElementById("out");

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.id;
}

document.getElementById("index").onclick = async () => {
  chrome.runtime.sendMessage({
    action: "INDEX_PAGE",
    tabId: await activeTab()
  });
  out.textContent = "Indexing page…";
};

document.getElementById("summarize").onclick = async () => {
  chrome.runtime.sendMessage({
    action: "SUMMARIZE_PAGE",
    tabId: await activeTab()
  });
  out.textContent = "Summarizing…";
};

document.getElementById("fill").onclick = async () => {
  const res = await chrome.runtime.sendMessage({
    action: "FILL_FORM",
    tabId: await activeTab()
  });
  out.textContent = res.message;
};

chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "AGENT_RESPONSE") {
    out.textContent = msg.text;
  }
});

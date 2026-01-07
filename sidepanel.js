const output = document.getElementById("output");
const counter = document.getElementById("counter");

document.getElementById("indexBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.runtime.sendMessage({
    type: "INDEX_PAGE",
    tabId: tab.id
  });
};

document.getElementById("highlightBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.runtime.sendMessage({
    type: "HIGHLIGHT_USERNAME",
    tabId: tab.id
  });
};

document.getElementById("fillBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.runtime.sendMessage({
    type: "FILL_USERNAME",
    tabId: tab.id
  });
};

document.getElementById("askBtn").onclick = () => {
  const query = document.querySelector("textarea").value;

  chrome.runtime.sendMessage({
    type: "ASK_AGENT",
    query
  });
};

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "STATE_UPDATE") {
    counter.innerText = `Indexed pages: ${msg.indexedCount}`;
  }

  if (msg.type === "AGENT_RESPONSE") {
    output.innerText = msg.text;
  }
});

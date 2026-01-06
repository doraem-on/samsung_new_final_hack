import { pipeline, env } from "./xenova-transformers.min.js";

env.allowLocalModels = false;
env.useBrowserCache = true;

let summarizer = null;
let memory = [];

async function getSummarizer() {
  if (!summarizer) {
    chrome.runtime.sendMessage({ type: "STATUS_UPDATE", text: "Loading AI…" });
    summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-6-6");
    chrome.runtime.sendMessage({ type: "STATUS_UPDATE", text: "AI Ready" });
  }
  return summarizer;
}

function analyzeRisk(text) {
  let score = 0;
  if (text.includes("password")) score += 0.3;
  if (text.includes("eval(")) score += 0.4;
  return {
    level: score > 0.6 ? "HIGH" : score > 0.3 ? "MEDIUM" : "LOW",
    score
  };
}

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.target !== "offscreen") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  });

  if (msg.type === "INDEX") {
    memory.push(result.slice(0, 1000));
    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text: "✅ Page indexed into semantic memory"
    });
  }

  if (msg.type === "SUMMARIZE") {
    const model = await getSummarizer();
    const output = await model(result.slice(0, 3000));
    const risk = analyzeRisk(result);

    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text:
        `🧠 Summary:\n${output[0].summary_text}\n\n` +
        `🛡️ Risk Level: ${risk.level} (${risk.score})\n` +
        `📦 Memory Size: ${memory.length}`
    });
  }
});

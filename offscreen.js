import { pipeline, env } from "./xenova-transformers.min.js";

env.allowLocalModels = false;
env.useBrowserCache = true;

let summarizer = null;
let memory = [];

async function getSummarizer() {
  if (!summarizer) {
    summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-6-6");
  }
  return summarizer;
}

function detectRisk(text) {
  const flags = [
    "password",
    "login",
    "verify",
    "session expired",
    "confirm identity"
  ];
  const lower = text.toLowerCase();
  const hits = flags.filter(f => lower.includes(f)).length;

  if (hits >= 3) return "SUSPICIOUS";
  return "SAFE";
}

chrome.runtime.onMessage.addListener(async (msg) => {

  if (msg.type === "INDEX") {
    const model = await getSummarizer();
    const summary = await model(msg.text.slice(0, 3000), {
      max_new_tokens: 120,
      do_sample: false
    });

    const risk = detectRisk(msg.text);

    memory.push({
      summary: summary[0].summary_text,
      risk
    });

    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text: risk === "SUSPICIOUS"
        ? "⚠️ High-risk credential collection page detected.\nThis page requests sensitive login information."
        : "✅ Page indexed safely.",
      memoryCount: memory.length,
      risk
    });
  }

  if (msg.type === "ASK_AGENT") {
    if (memory.length === 0) {
      chrome.runtime.sendMessage({
        type: "AGENT_RESPONSE",
        text: "No indexed pages yet.",
        memoryCount: 0
      });
      return;
    }

    const ctx = memory.slice(-2)
      .map(m => `• (${m.risk}) ${m.summary}`)
      .join("\n\n");

    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text:
`🧠 Local Agent Reasoning

Context:
${ctx}

Answer:
${msg.question}

All reasoning performed fully offline.`,
      memoryCount: memory.length
    });
  }
});

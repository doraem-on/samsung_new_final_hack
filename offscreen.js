import { pipeline, env } from "./xenova-transformers.min.js";

env.allowLocalModels = false;
env.useBrowserCache = true;

let summarizer = null;

// Store clean summaries, not raw pages
let memory = [];

async function getSummarizer() {
  if (!summarizer) {
    summarizer = await pipeline(
      "summarization",
      "Xenova/distilbart-cnn-6-6"
    );
  }
  return summarizer;
}

// Clean + summarize page before storing
async function summarizeForMemory(text) {
  const model = await getSummarizer();

  const summary = await model(text, {
    max_new_tokens: 120,
    do_sample: false
  });

  return summary[0].summary_text;
}

// Reason ONLY from clean summaries
function reasonFromMemory(question) {
  if (memory.length === 0) {
    return "⚠️ No pages indexed yet. Index a page first.";
  }

  const context = memory.slice(-3).join("\n\n");

  return `🧠 Local Agent Reasoning (${memory.length} pages indexed)

Context:
${context}

Answer:
• ${question}

This response is generated fully offline using on-device models.`;
}

chrome.runtime.onMessage.addListener(async (msg) => {

  // INDEX PAGE
  if (msg.type === "INDEX") {
    const cleanSummary = await summarizeForMemory(msg.text);

    memory.push(cleanSummary);

    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text: "✅ Page indexed and summarized successfully.",
      memoryCount: memory.length
    });
  }

  // ASK AGENT
  if (msg.type === "ASK_AGENT") {
    const answer = reasonFromMemory(msg.question);

    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text: answer,
      memoryCount: memory.length
    });
  }

});

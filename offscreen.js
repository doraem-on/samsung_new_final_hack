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

function answerFromMemory(question) {
  if (memory.length === 0) {
    return "No indexed pages yet. Please index a page first.";
  }

  // Simple but effective MVP reasoning
  return (
    "Based on indexed content:\n\n" +
    memory.slice(-2).join("\n\n").slice(0, 800)
  );
}

chrome.runtime.onMessage.addListener(async msg => {

  if (msg.type === "INDEX") {
    memory.push(msg.text);
    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text: `✅ Page indexed successfully.\nMemory size: ${memory.length}`
    });
  }

  if (msg.type === "ASK_AGENT") {
    const answer = answerFromMemory(msg.question);
    chrome.runtime.sendMessage({
      type: "AGENT_RESPONSE",
      text: answer
    });
  }

});

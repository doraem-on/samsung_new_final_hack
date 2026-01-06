// Import from your local file
import { pipeline, env } from './xenova-transformers.min.js';

// Configuration: Skip local checks to use cached models from CDN first (easier for MVP)
env.allowLocalModels = false; 
env.useBrowserCache = true;

// Singleton to hold the model
class SummarizerPipeline {
  static task = 'summarization';
  static model = 'Xenova/distilbart-cnn-6-6';
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      // Send message to UI that we are loading
      chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', text: 'Loading AI Model...' });
      this.instance = await pipeline(this.task, this.model);
      chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', text: 'AI Ready' });
    }
    return this.instance;
  }
}

// Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  if (message.type === 'SUMMARIZE') {
    (async () => {
      try {
        chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', text: 'Processing...' });
        
        // Get the model
        const generator = await SummarizerPipeline.getInstance();
        
        // Run inference
        const output = await generator(message.text, {
          max_new_tokens: 100,
          do_sample: false
        });

        // Send back result
        chrome.runtime.sendMessage({
          type: 'AGENT_RESPONSE',
          text: output[0].summary_text
        });

        chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', text: 'Done.' });

      } catch (err) {
        console.error("AI Error:", err);
        chrome.runtime.sendMessage({
          type: 'AGENT_RESPONSE',
          text: "Error: " + err.message
        });
      }
    })();
  }
});
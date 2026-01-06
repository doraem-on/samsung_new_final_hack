const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const responseDiv = document.getElementById('response');

// Helper to update status UI
function updateStatus(text, type) {
  statusText.innerText = text;
  statusDot.className = 'status-dot'; // reset
  if (type === 'ready') statusDot.classList.add('active');
  if (type === 'busy') statusDot.classList.add('busy');
}

// Button Click Listener
document.getElementById('summarizeBtn').addEventListener('click', async () => {
  try {
    updateStatus('Extracting Text...', 'busy');
    responseDiv.innerText = "Reading page content...";

    // 1. Get current tab text
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Safety check: Cannot script restricted pages (chrome://)
    if (tab.url.startsWith('chrome://')) {
      responseDiv.innerText = "Cannot summarize internal Chrome pages.";
      updateStatus('Error', '');
      return;
    }

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    });
    
    const pageText = result[0].result;
    
    // 2. Send to Offscreen AI
    updateStatus('Analyzing...', 'busy');
    responseDiv.innerText = "Thinking...";
    
    // Truncate text to prevent token overflow (simple fix for MVP)
    const truncatedText = pageText.substring(0, 3000); 

    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'SUMMARIZE',
      text: truncatedText
    });

  } catch (err) {
    console.error(err);
    responseDiv.innerText = "Error: " + err.message;
    updateStatus('Error', '');
  }
});

// Listen for messages from Offscreen
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATUS_UPDATE') {
    if (msg.text.includes("Processing")) updateStatus(msg.text, 'busy');
    else if (msg.text.includes("Ready") || msg.text.includes("Done")) updateStatus(msg.text, 'ready');
    else updateStatus(msg.text, '');
  }
  else if (msg.type === 'AGENT_RESPONSE') {
    responseDiv.innerText = msg.text;
    updateStatus('Ready', 'ready');
  }
});
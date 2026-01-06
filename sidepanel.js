document.getElementById('summarizeBtn').addEventListener('click', async () => {
  // 1. Get text from the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 2. Update UI
  document.getElementById('response').innerText = "Analyzing page...";

  // 3. Send message to background/offscreen to process
  chrome.runtime.sendMessage({ 
    target: 'offscreen', 
    type: 'SUMMARIZE',
    tabId: tab.id 
  });
});

// 4. Listen for the answer coming back
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AGENT_RESPONSE') {
    document.getElementById('response').innerText = msg.text;
  }
});
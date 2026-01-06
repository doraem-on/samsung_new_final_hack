chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === "AGENT_RESPONSE") {
    document.getElementById("response").innerText = msg.text;
  }
});

function detectRisk(text) {
  const signals = [
    "password",
    "login",
    "verify",
    "session",
    "confirm identity",
    "reset password"
  ];

  let score = 0;
  const lower = text.toLowerCase();

  for (const s of signals) {
    if (lower.includes(s)) score++;
  }

  return score >= 2 ? "SUSPICIOUS" : "SAFE";
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "OFFSCREEN_ANALYZE") return;

  const risk = detectRisk(msg.text);

  chrome.runtime.sendMessage({
    type: "ANALYSIS_RESULT",
    risk
  });
});

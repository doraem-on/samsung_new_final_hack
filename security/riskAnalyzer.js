export function analyzePageRisk() {
  let score = 0;
  let reasons = [];

  const forms = document.querySelectorAll("form");
  forms.forEach(form => {
    const action = form.getAttribute("action") || "";
    if (action.startsWith("http") && !action.includes(location.hostname)) {
      score += 0.3;
      reasons.push("External form submission detected");
    }

    const hiddenInputs = form.querySelectorAll("input[type='hidden']");
    if (hiddenInputs.length > 2) {
      score += 0.2;
      reasons.push("Multiple hidden fields");
    }
  });

  const scripts = document.querySelectorAll("script");
  scripts.forEach(s => {
    if (s.src && !s.src.includes(location.hostname)) {
      score += 0.2;
      reasons.push("Third-party external scripts");
    }
  });

  score = Math.min(score, 1.0);

  return {
    score,
    level: score > 0.7 ? "High" : score > 0.4 ? "Medium" : "Low",
    reasons
  };
}

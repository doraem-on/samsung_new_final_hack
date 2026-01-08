// content.js - Runs on every webpage to blur PII

// 1. Screen Shield Logic
function applyScreenShield(active) {
    // If turning off, remove the blur class
    if (!active) {
        document.querySelectorAll('.vessel-blur').forEach(el => el.classList.remove('vessel-active'));
        return;
    }

    const PII_REGEX = {
        email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/g,
        phone: /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g
    };

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    
    while (node = walker.nextNode()) {
        // Skip scripts and styles
        if (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE') continue;

        const text = node.nodeValue;
        if (PII_REGEX.email.test(text) || PII_REGEX.phone.test(text)) {
            const span = document.createElement('span');
            // Wrap PII in a blur span
            span.innerHTML = text.replace(PII_REGEX.email, '<span class="vessel-blur vessel-active" title="Click to reveal">$1</span>')
                                 .replace(PII_REGEX.phone, '<span class="vessel-blur vessel-active" title="Click to reveal">$&</span>');
            
            if (node.parentNode) {
                node.parentNode.replaceChild(span, node);
            }
        }
    }
}

// 2. Inject CSS for the Blur Effect
const style = document.createElement('style');
style.textContent = `
    .vessel-blur.vessel-active {
        filter: blur(6px);
        background: #e0e0e0;
        cursor: pointer;
        transition: all 0.3s ease;
        user-select: none;
        display: inline-block;
    }
    .vessel-blur.vessel-active:hover {
        filter: blur(0px);
        background: transparent;
    }
`;
document.head.appendChild(style);

// 3. Listen for Toggle Command from Sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TOGGLE_SHIELD") {
        applyScreenShield(request.value);
        sendResponse({status: "Shield Toggled"});
    }
});
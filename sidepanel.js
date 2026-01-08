document.addEventListener('DOMContentLoaded', () => {

    // --- 1. KNOX VAULT LOGIC (New) ---
    const authBtn = document.getElementById('authBtn');
    const vaultOverlay = document.getElementById('vault-overlay');
    const agentContent = document.getElementById('agent-content');

    authBtn.addEventListener('click', () => {
        // Simulate Biometric Scan Delay
        authBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...';
        
        setTimeout(() => {
            // Success State
            authBtn.innerHTML = '<i class="fa-solid fa-check"></i> Verified';
            authBtn.style.background = '#00c851'; // Green
            
            setTimeout(() => {
                // Unlock Animation
                vaultOverlay.style.opacity = '0';
                setTimeout(() => vaultOverlay.style.display = 'none', 300); // Remove from DOM
                
                // Reveal Agent
                agentContent.style.filter = 'none';
                agentContent.style.opacity = '1';
                agentContent.style.pointerEvents = 'auto';
            }, 500);
        }, 1200); // 1.2s delay for realism
    });

    // --- 2. QUICK SHARE LOGIC (New) ---
    document.getElementById('quickShareBtn').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Use Native Share Sheet (Windows/Android)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Vessel Agent Link',
                    text: 'Shared from Vessel Agent:',
                    url: tab.url
                });
            } catch (err) {
                console.log('Share canceled:', err);
            }
        } else {
            alert("Quick Share not detected on this device. Use QR Code fallback.");
        }
    });

    // --- 3. QR CODE LOGIC (Fallback) ---
    document.getElementById('qrBtn').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const qrContainer = document.getElementById('qr-code');
        
        // Reset
        qrContainer.innerHTML = "";
        qrContainer.style.display = "block";
        qrContainer.innerHTML += '<div class="scan-hint">Scan with Samsung Camera</div>';

        // Create QR
        new QRCode(qrContainer, {
            text: tab.url,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    });

    // --- 4. ORIGINAL CORE LOGIC ---
    const output = document.getElementById("output");
    const counter = document.getElementById("counter");

    // Index Page
    document.getElementById("indexBtn").onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            document.getElementById("indexBtn").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Indexing...';
            chrome.runtime.sendMessage({ type: "INDEX_PAGE", tabId: tab.id });
        }
    };

    // Ask Agent
    document.getElementById("askBtn").onclick = () => {
        const query = document.getElementById("query").value;
        if(query) {
             output.innerHTML = '<i class="fa-solid fa-ellipsis fa-bounce"></i> Thinking...';
             chrome.runtime.sendMessage({ type: "ASK_AGENT", query });
        }
    };

    // Form Tools
    document.getElementById("highlightBtn").onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if(tab?.id) chrome.runtime.sendMessage({ type: "HIGHLIGHT_USERNAME", tabId: tab.id });
    };

    document.getElementById("fillBtn").onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if(tab?.id) chrome.runtime.sendMessage({ type: "FILL_USERNAME", tabId: tab.id });
    };

    // Privacy Shield Toggle
    document.getElementById('shieldToggle').addEventListener('change', async (e) => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { 
                action: "TOGGLE_SHIELD", 
                value: e.target.checked 
            }).catch(err => console.log("Inject content script first or refresh page"));
        }
    });

    // Background Message Listener
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "STATE_UPDATE") {
            counter.innerText = `Indexed pages: ${msg.indexedCount}`;
            document.getElementById("indexBtn").innerHTML = '<i class="fa-solid fa-check"></i> Indexed';
        }
        if (msg.type === "AGENT_RESPONSE") {
            output.innerText = msg.text;
        }
    });

});
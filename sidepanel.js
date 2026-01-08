document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. NEW FEATURES (VOICE, ECO, RESET)
    // =========================================================

    // --- A. VOICE OUTPUT (JARVIS) ---
    let voiceEnabled = false; // Default off
    const voiceToggle = document.getElementById('voiceToggle');
    
    if(voiceToggle) {
        voiceToggle.addEventListener('click', () => {
            voiceEnabled = !voiceEnabled;
            // Update Icon
            voiceToggle.className = voiceEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
            voiceToggle.style.color = voiceEnabled ? "#0062E6" : "#aaa";
        });
    }

    function speak(text) {
        if (!voiceEnabled || !text) return;
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; 
        window.speechSynthesis.speak(utterance);
    }

    // --- B. ECO-TRACKER (Samsung Green) ---
    const trackerCount = document.getElementById('trackerCount');
    let blockedCount = 0;

    function incrementTracker() {
        if(!trackerCount) return;
        // Simulate blocking 1-3 trackers
        blockedCount += Math.floor(Math.random() * 3) + 1;
        trackerCount.innerText = blockedCount;
        
        // Visual Pop Effect
        trackerCount.parentElement.style.transform = "scale(1.1)";
        setTimeout(() => trackerCount.parentElement.style.transform = "scale(1)", 200);
    }

    // --- C. PANIC BUTTON (Reset) ---
    const resetBtn = document.getElementById('resetBtn');
    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            if(confirm("Reset Vessel Agent Memory?")) {
                location.reload(); 
            }
        });
    }


    // =========================================================
    // 2. EXISTING FEATURES (KNOX, SHARE, AGENT)
    // =========================================================

    // --- KNOX VAULT LOGIC ---
    const authBtn = document.getElementById('authBtn');
    const vaultOverlay = document.getElementById('vault-overlay');
    const agentContent = document.getElementById('agent-content');

    if (authBtn) {
        authBtn.addEventListener('click', () => {
            // Simulate Biometric Scan Delay
            authBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...';
            
            setTimeout(() => {
                // Success State
                authBtn.innerHTML = '<i class="fa-solid fa-check"></i> Verified';
                authBtn.style.background = '#00c851'; // Green
                
                setTimeout(() => {
                    // Unlock Animation
                    if(vaultOverlay) {
                        vaultOverlay.style.opacity = '0';
                        setTimeout(() => vaultOverlay.style.display = 'none', 300);
                    }
                    
                    // Reveal Agent
                    if(agentContent) {
                        agentContent.style.filter = 'none';
                        agentContent.style.opacity = '1';
                        agentContent.style.pointerEvents = 'auto';
                    }
                }, 500);
            }, 1200); // 1.2s delay for realism
        });
    }

    // --- QUICK SHARE LOGIC ---
    const quickShareBtn = document.getElementById('quickShareBtn');
    if (quickShareBtn) {
        quickShareBtn.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
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
    }

    // --- QR CODE LOGIC ---
    const qrBtn = document.getElementById('qrBtn');
    if (qrBtn) {
        qrBtn.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const qrContainer = document.getElementById('qr-code');
            
            if(qrContainer) {
                // Reset
                qrContainer.innerHTML = "";
                qrContainer.style.display = "block";
                qrContainer.innerHTML += '<div class="scan-hint">Scan with Samsung Camera</div>';

                // Check if library loaded
                if (typeof QRCode !== 'undefined') {
                    new QRCode(qrContainer, {
                        text: tab.url,
                        width: 128,
                        height: 128,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });
                } else {
                    qrContainer.innerHTML += '<p style="color:red; font-size:10px;">Error: QRCode library missing</p>';
                }
            }
        });
    }


    // =========================================================
    // 3. CORE AGENT LOGIC (MESSAGING)
    // =========================================================

    const output = document.getElementById("output");
    const counter = document.getElementById("counter");

    // Index Page
    const indexBtn = document.getElementById("indexBtn");
    if(indexBtn) {
        indexBtn.onclick = async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                indexBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Indexing...';
                chrome.runtime.sendMessage({ type: "INDEX_PAGE", tabId: tab.id });
                // Simulate "Green" benefit of using local AI
                incrementTracker(); 
            }
        };
    }

    // Ask Agent
    const askBtn = document.getElementById("askBtn");
    if(askBtn) {
        askBtn.onclick = () => {
            const query = document.getElementById("query").value;
            if(query) {
                 output.innerHTML = '<i class="fa-solid fa-ellipsis fa-bounce"></i> Thinking...';
                 chrome.runtime.sendMessage({ type: "ASK_AGENT", query });
            }
        };
    }

    // Form Tools
    const highlightBtn = document.getElementById("highlightBtn");
    if(highlightBtn) {
        highlightBtn.onclick = async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if(tab?.id) chrome.runtime.sendMessage({ type: "HIGHLIGHT_USERNAME", tabId: tab.id });
        };
    }

    const fillBtn = document.getElementById("fillBtn");
    if(fillBtn) {
        fillBtn.onclick = async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if(tab?.id) chrome.runtime.sendMessage({ type: "FILL_USERNAME", tabId: tab.id });
        };
    }

    // Privacy Shield Toggle
    const shieldToggle = document.getElementById('shieldToggle');
    if(shieldToggle) {
        shieldToggle.addEventListener('change', async (e) => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                chrome.tabs.sendMessage(tab.id, { 
                    action: "TOGGLE_SHIELD", 
                    value: e.target.checked 
                }).catch(err => console.log("Inject content script first or refresh page"));
                
                // Increment Eco Counter if enabled
                if(e.target.checked) incrementTracker();
            }
        });
    }

    // Background Message Listener
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "STATE_UPDATE") {
            if(counter) counter.innerText = `Indexed pages: ${msg.indexedCount}`;
            if(indexBtn) indexBtn.innerHTML = '<i class="fa-solid fa-check"></i> Indexed';
        }
        if (msg.type === "AGENT_RESPONSE") {
            if(output) output.innerText = msg.text;
            // Speak the response (if enabled)
            speak(msg.text);
        }
    });

});
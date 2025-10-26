// popup.js (Full Code - Modified for file: URL Testing)

const indexButton = document.getElementById('indexPageButton');
const statusDiv = document.getElementById('status');
const askButton = document.getElementById('askButton');
const promptInput = document.getElementById('promptInput');
const responseArea = document.getElementById('responseArea');
// Added for form filling
const fillFormButton = document.getElementById('fillFormButton');
const actionStatusDiv = document.getElementById('actionStatus');


console.log("Popup script loaded!");

// --- Indexing ---
indexButton.addEventListener('click', async () => {
    statusDiv.textContent = 'Requesting page content...';
    indexButton.disabled = true;
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) { throw new Error("Could not get active tab."); }

        // --- MODIFIED URL CHECK TO ALLOW file: ---
        // This allows indexing local HTML files for firewall testing.
        if (!tab.url || (!tab.url.startsWith('http:') && !tab.url.startsWith('https:') && !tab.url.startsWith('file:'))) {
            throw new Error("Cannot index this type of URL.");
        }
        // --- END MODIFICATION ---

        console.log("[Popup] Sending indexPage message for tab:", tab.id);
        const response = await chrome.runtime.sendMessage({
            action: "indexPage", tabId: tab.id, url: tab.url
        });
        console.log("[Popup] Response from background (indexPage):", response); // Log index response
        if (response && response.success) {
            statusDiv.textContent = `Indexed: ${response.url || 'current page'}`;
        } else {
            statusDiv.textContent = `Error: ${response?.error || 'Unknown error during indexing'}`;
        }
    } catch (error) {
        console.error("[Popup] Error sending 'indexPage' message:", error);
        statusDiv.textContent = `Error: ${error.message}`;
    } finally {
        indexButton.disabled = false;
    }
});


// --- Ollama Interaction ---
askButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    responseArea.textContent = 'Thinking...'; // Set thinking message
    askButton.disabled = true;
    console.log("[Popup] Ask button clicked. Sending askOllama message..."); // Log click

    try {
        // Send prompt to background script
        const response = await chrome.runtime.sendMessage({
            action: "askOllama",
            prompt: prompt
        });

        // Debugging logs remain helpful
        console.log("[Popup] Received response object from background (askOllama):", response);
        if (!response) {
             console.log("[Popup] Response object is null or undefined.");
             // Handle null/undefined explicitly to prevent errors accessing properties
             throw new Error("Received no response from background service.");
        }
        console.log(`[Popup] Type of response: ${typeof response}`);
        console.log(`[Popup] response.success = ${response.success}`);
        console.log(`[Popup] response.error = ${response.error}`);
        console.log(`[Popup] response.answer exists? = ${response.hasOwnProperty('answer')}`);

        if (response.success === true && typeof response.answer === 'string') { // Check answer type
            console.log("[Popup] Success condition met.");
            console.log("[Popup] Answer content received:", response.answer);

            // Update the UI
            responseArea.textContent = response.answer.trim() || "[Received empty response]";
        } else {
            console.error("[Popup] Success condition NOT met or answer invalid. Response:", response);
            responseArea.textContent = `Error: ${response?.error || 'Invalid or failed response from background'}`;
        }

    } catch(error) {
        // This catch block handles errors sending the message or if the connection breaks
        console.error("[Popup] Error during chrome.runtime.sendMessage or connection:", error);
        responseArea.textContent = `Error communicating with background: ${error.message}`;
    } finally {
        askButton.disabled = false; // Re-enable button
        console.log("[Popup] Ask operation finished."); // Log completion
    }
});


// --- Form Filling (Added previously) ---
fillFormButton.addEventListener('click', async () => {
    actionStatusDiv.textContent = 'Attempting to fill form...';
    fillFormButton.disabled = true;
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) { throw new Error("Could not get active tab."); }

        console.log("[Popup] Sending fillForm message for tab:", tab.id);
        const response = await chrome.runtime.sendMessage({
            action: "fillForm",
            tabId: tab.id
        });

        if (response && response.success) {
            actionStatusDiv.textContent = `Action completed: ${response.message}`;
        } else {
            actionStatusDiv.textContent = `Action Error: ${response?.error || 'Unknown error'}`;
        }
    } catch (error) {
        console.error("[Popup] Error sending 'fillForm' message:", error);
        actionStatusDiv.textContent = `Error: ${error.message}`;
    } finally {
        fillFormButton.disabled = false;
    }
});
// offscreen.js (FINAL MODULE VERSION)

// --- CRITICAL FIX: Import the pipeline function directly as a module ---
// This works because offscreen.html loads this file as type="module".
import { pipeline } from './xenova-transformers.min.js';
// --- END CRITICAL FIX ---

console.log("[Offscreen] Script started. Initializing embedding pipeline...");

let embedder = null; 
let modelLoadError = null; 

async function initializeEmbedder() {
    if (embedder) return embedder;
    
    // We can use 'pipeline' directly because we imported it.
    if (typeof pipeline !== 'function') {
        modelLoadError = "The 'pipeline' function could not be imported. Check that 'xenova-transformers.min.js' is the correct ESM file.";
        throw new Error(modelLoadError);
    }
    
    try {
        console.log("[Offscreen] Found pipeline function. Starting model download/load...");
        
        embedder = await pipeline( 
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2',
            { 
                quantized: true 
            }
        );
        console.log("[Offscreen] Embedding model loaded and ready!");
        return embedder;
    } catch (error) {
        console.error("[Offscreen] Failed to load embedding model:", error);
        modelLoadError = error.message;
        throw error;
    }
}

const embedderPromise = initializeEmbedder();

// --- Message Listener (This code is correct) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) {
        return false;
    }

    if (message.action === 'OFFSCREEN_READY_CHECK') {
        sendResponse({ 
            success: true, 
            ready: true, 
            model_status: modelLoadError ? 'error' : 'loading' 
        });
        return false; 
    }

    if (message.action === 'getEmbedding' && message.text) {
        console.log(`[Offscreen Listener] Received 'getEmbedding' request for text length: ${message.text.length}`);
        
        (async () => {
            if (modelLoadError) {
                sendResponse({ success: false, error: `Model failed to load: ${modelLoadError}` });
                return;
            }

            try {
                const embedderInstance = await embedderPromise;
                
                const output = await embedderInstance(message.text, { 
                    pooling: 'mean', 
                    normalize: true 
                });
                
                const embeddingArray = Array.from(output.data);
                
                console.log(`[Offscreen] Embedding complete. Size: ${embeddingArray.length}`);
                sendResponse({ success: true, embedding: embeddingArray });

            } catch (error) {
                console.error("[Offscreen] Embedding generation error:", error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        
        return true; 
    }
    
    return false;
});

console.log("[Offscreen] Listener active.");
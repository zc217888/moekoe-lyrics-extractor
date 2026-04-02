const DEFAULT_SETTINGS = {
    enabled: true,
    includeTimestamp: false,
    includeTranslation: true,
    autoDownload: false
};

async function getSettings() {
    try {
        const result = await chrome.storage.local.get('lyricsExtractorSettings');
        return { ...DEFAULT_SETTINGS, ...(result.lyricsExtractorSettings || {}) };
    } catch (error) {
        console.error('[LyricsExtractor-Background] Failed to get settings:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

async function saveSettings(settings) {
    try {
        await chrome.storage.local.set({ lyricsExtractorSettings: settings });
        console.log('[LyricsExtractor-Background] Settings saved');
    } catch (error) {
        console.error('[LyricsExtractor-Background] Failed to save settings:', error);
    }
}

async function broadcastToContent(message) {
    const tabs = await chrome.tabs.query({});
    const results = [];
    
    for (const tab of tabs) {
        try {
            const response = await chrome.tabs.sendMessage(tab.id, {
                source: '__lyrics_extractor_background__',
                ...message
            });
            if (response && response.success) {
                results.push({ tabId: tab.id, response });
            }
        } catch (e) {
            // Tab might not have content script loaded
        }
    }
    
    return results;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[LyricsExtractor-Background] Received message:', message);

    const handleMessage = async () => {
        try {
            switch (message.action) {
                case 'get-settings':
                    const settings = await getSettings();
                    return { success: true, settings };

                case 'save-settings':
                    await saveSettings(message.settings);
                    return { success: true };
                    
                case 'get-current-song':
                    const results = await broadcastToContent({ type: 'get-current-song' });
                    if (results.length > 0) {
                        return { success: true, data: results[0].response.data };
                    }
                    return { success: false, error: 'No active song found' };
                    
                case 'download-lyrics':
                    const downloadResults = await broadcastToContent({ 
                        type: 'download-lyrics',
                        settings: message.settings
                    });
                    if (downloadResults.length > 0) {
                        return { success: true };
                    }
                    return { success: false, error: 'Failed to download' };

                default:
                    return { success: false, error: 'Unknown action' };
            }
        } catch (error) {
            console.error('[LyricsExtractor-Background] Error handling message:', error);
            return { success: false, error: error.message };
        }
    };

    handleMessage().then(sendResponse);
    return true;
});

chrome.runtime.onInstalled.addListener(async () => {
    console.log('[LyricsExtractor-Background] Extension installed');
    await saveSettings(DEFAULT_SETTINGS);
});

chrome.runtime.onStartup.addListener(() => {
    console.log('[LyricsExtractor-Background] Extension started');
});

console.log('[LyricsExtractor-Background] Service worker initialized');

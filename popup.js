const DEFAULT_SETTINGS = {
    enabled: true,
    includeTimestamp: false,
    includeTranslation: true
};

let currentSettings = { ...DEFAULT_SETTINGS };
let currentSongInfo = null;
let hasLyrics = false;

const elements = {
    songCover: null,
    songName: null,
    songArtist: null,
    statusDot: null,
    statusText: null,
    optionTimestamp: null,
    optionTranslation: null,
    refreshBtn: null,
    downloadBtn: null,
    message: null
};

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    loadSettings();
    setupEventListeners();
    refreshSongInfo();
});

function initElements() {
    elements.songCover = document.getElementById('song-cover');
    elements.songName = document.getElementById('song-name');
    elements.songArtist = document.getElementById('song-artist');
    elements.statusDot = document.getElementById('status-dot');
    elements.statusText = document.getElementById('status-text');
    elements.optionTimestamp = document.getElementById('option-timestamp');
    elements.optionTranslation = document.getElementById('option-translation');
    elements.refreshBtn = document.getElementById('refresh-btn');
    elements.downloadBtn = document.getElementById('download-btn');
    elements.message = document.getElementById('message');
}

async function loadSettings() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'get-settings' });
        if (response && response.success && response.settings) {
            currentSettings = { ...DEFAULT_SETTINGS, ...response.settings };
            
            if (elements.optionTimestamp) {
                elements.optionTimestamp.checked = currentSettings.includeTimestamp;
            }
            if (elements.optionTranslation) {
                elements.optionTranslation.checked = currentSettings.includeTranslation;
            }
        }
    } catch (error) {
        console.error('[LyricsExtractor-Popup] Failed to load settings:', error);
    }
}

async function saveSettings() {
    try {
        await chrome.runtime.sendMessage({
            action: 'save-settings',
            settings: currentSettings
        });
    } catch (error) {
        console.error('[LyricsExtractor-Popup] Failed to save settings:', error);
    }
}

function setupEventListeners() {
    if (elements.optionTimestamp) {
        elements.optionTimestamp.addEventListener('change', (e) => {
            currentSettings.includeTimestamp = e.target.checked;
            saveSettings();
        });
    }
    
    if (elements.optionTranslation) {
        elements.optionTranslation.addEventListener('change', (e) => {
            currentSettings.includeTranslation = e.target.checked;
            saveSettings();
        });
    }
    
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', refreshSongInfo);
    }
    
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', downloadLyrics);
    }
}

async function refreshSongInfo() {
    setStatus('loading', '正在获取...');
    disableDownload();
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'get-current-song' });
        
        if (response && response.success && response.data) {
            currentSongInfo = response.data;
            updateSongUI(currentSongInfo);
            
            if (currentSongInfo.hasLyrics) {
                setStatus('success', '歌词可用');
                enableDownload();
                hasLyrics = true;
            } else {
                setStatus('empty', '暂无歌词');
                hasLyrics = false;
            }
        } else {
            updateSongUI(null);
            setStatus('empty', '未检测到播放歌曲');
            hasLyrics = false;
        }
    } catch (error) {
        console.error('[LyricsExtractor-Popup] Failed to get song info:', error);
        setStatus('empty', '获取失败');
        hasLyrics = false;
    }
}

function updateSongUI(songInfo) {
    if (!songInfo) {
        if (elements.songName) elements.songName.textContent = '-';
        if (elements.songArtist) elements.songArtist.textContent = '-';
        if (elements.songCover) {
            elements.songCover.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            `;
        }
        return;
    }
    
    if (elements.songName) {
        elements.songName.textContent = songInfo.name || '-';
    }
    
    if (elements.songArtist) {
        elements.songArtist.textContent = songInfo.author || '-';
    }
    
    if (elements.songCover && songInfo.img) {
        elements.songCover.innerHTML = `<img src="${songInfo.img}" alt="封面">`;
    }
}

function setStatus(type, text) {
    if (elements.statusDot) {
        elements.statusDot.className = 'status-dot';
        if (type === 'loading') {
            elements.statusDot.classList.add('loading');
        } else if (type === 'empty') {
            elements.statusDot.classList.add('empty');
        }
    }
    
    if (elements.statusText) {
        elements.statusText.textContent = text;
    }
}

function showMessage(text, type = 'info') {
    if (elements.message) {
        elements.message.textContent = text;
        elements.message.className = `message ${type}`;
        
        setTimeout(() => {
            elements.message.className = 'message';
        }, 3000);
    }
}

function enableDownload() {
    if (elements.downloadBtn) {
        elements.downloadBtn.disabled = false;
    }
}

function disableDownload() {
    if (elements.downloadBtn) {
        elements.downloadBtn.disabled = true;
    }
}

async function downloadLyrics() {
    if (!hasLyrics) {
        showMessage('暂无歌词可下载', 'error');
        return;
    }
    
    disableDownload();
    showMessage('正在准备下载...', 'info');
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'download-lyrics',
            settings: currentSettings
        });
        
        if (response && response.success) {
            showMessage('歌词已下载！', 'success');
        } else {
            showMessage(response?.error || '下载失败', 'error');
        }
    } catch (error) {
        console.error('[LyricsExtractor-Popup] Failed to download lyrics:', error);
        showMessage('下载失败', 'error');
    } finally {
        enableDownload();
    }
}

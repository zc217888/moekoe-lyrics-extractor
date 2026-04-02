(function() {
    'use strict';
    
    if (window.__LYRICS_EXTRACTOR_CONTENT__) {
        console.log('[LyricsExtractor-Content] Already initialized, skipping');
        return;
    }
    window.__LYRICS_EXTRACTOR_CONTENT__ = true;
    
    console.log('[LyricsExtractor-Content] Content script initializing...');
    
    const CSS_STYLES = `
        :host {
            all: initial;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        .lyrics-extractor-fab {
            position: fixed;
            bottom: 80px;
            right: 70px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 99998;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
        }
        
        .lyrics-extractor-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        
        .lyrics-extractor-fab svg {
            width: 20px;
            height: 20px;
            fill: white;
        }
        
        .lyrics-extractor-panel {
            position: fixed;
            bottom: 130px;
            right: 70px;
            width: 320px;
            max-height: 80vh;
            background: rgba(30, 30, 30, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
            z-index: 99999;
            overflow: hidden;
            display: none;
            flex-direction: column;
            pointer-events: auto;
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .lyrics-extractor-panel.visible {
            display: flex;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 16px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .panel-title {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #fff;
            font-size: 15px;
            font-weight: 600;
        }
        
        .panel-title svg {
            width: 20px;
            height: 20px;
            fill: #667eea;
        }
        
        .close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: none;
            background: rgba(255, 80, 80, 0.2);
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .close-btn:hover {
            background: rgba(255, 80, 80, 0.4);
            color: #fff;
        }
        
        .close-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
        }
        
        .panel-body {
            padding: 14px;
            overflow-y: auto;
            flex: 1;
        }
        
        .song-info-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 10px 12px;
            margin-bottom: 12px;
        }
        
        .song-info-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }
        
        .song-info-row:last-child {
            margin-bottom: 0;
        }
        
        .song-info-label {
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            min-width: 36px;
        }
        
        .song-info-value {
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .options-row {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .option-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .option-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .option-btn.active {
            background: rgba(102, 126, 234, 0.3);
            border-color: rgba(102, 126, 234, 0.5);
            color: #fff;
        }
        
        .option-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
        }
        
        .lyrics-preview {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 12px;
            max-height: 120px;
            overflow-y: auto;
        }
        
        .lyrics-preview-title {
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .lyrics-preview-content {
            color: rgba(255, 255, 255, 0.8);
            font-size: 12px;
            line-height: 1.5;
            white-space: pre-wrap;
        }
        
        .lyrics-preview-empty {
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            text-align: center;
            padding: 15px;
        }
        
        .action-buttons {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 10px 12px;
            border-radius: 8px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .action-btn svg {
            width: 15px;
            height: 15px;
            fill: currentColor;
        }
        
        .action-btn.primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .action-btn.primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .action-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .action-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.15);
        }
        
        .action-btn.warning {
            background: rgba(243, 156, 18, 0.2);
            color: #f39c12;
            border: 1px solid rgba(243, 156, 18, 0.3);
        }
        
        .action-btn.warning:hover {
            background: rgba(243, 156, 18, 0.3);
        }
        
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .status-message {
            text-align: center;
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
            margin-top: 8px;
        }
        
        .status-message.success {
            background: rgba(46, 204, 113, 0.2);
            color: #2ecc71;
        }
        
        .status-message.error {
            background: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
        }
        
        .status-message.info {
            background: rgba(52, 152, 219, 0.2);
            color: #3498db;
        }
        
        .status-message.warning {
            background: rgba(243, 156, 18, 0.2);
            color: #f39c12;
        }
        
        .tip-text {
            color: rgba(255, 255, 255, 0.4);
            font-size: 10px;
            text-align: center;
            margin-top: 8px;
            line-height: 1.4;
        }
    `;
    
    let shadowRef = null;
    let isPanelVisible = false;
    let currentSettings = {
        enabled: true,
        includeTimestamp: false,
        includeTranslation: true
    };
    let currentSongInfo = null;
    let currentLyrics = null;
    let isLoading = false;
    
    function createUI() {
        const host = document.createElement('div');
        host.id = 'lyrics-extractor-host';
        host.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 99997;';
        
        const shadow = host.attachShadow({ mode: 'closed' });
        shadowRef = shadow;
        
        const style = document.createElement('style');
        style.textContent = CSS_STYLES;
        shadow.appendChild(style);
        
        const fab = document.createElement('button');
        fab.className = 'lyrics-extractor-fab';
        fab.id = 'fab';
        fab.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
        `;
        fab.addEventListener('click', togglePanel);
        shadow.appendChild(fab);
        
        const panel = document.createElement('div');
        panel.className = 'lyrics-extractor-panel';
        panel.id = 'panel';
        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <svg viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    <span>歌词提取器</span>
                </div>
                <button class="close-btn" id="close-btn">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            <div class="panel-body">
                <div class="song-info-card" id="song-info-card">
                    <div class="song-info-row">
                        <span class="song-info-label">歌曲</span>
                        <span class="song-info-value" id="song-name">-</span>
                    </div>
                    <div class="song-info-row">
                        <span class="song-info-label">歌手</span>
                        <span class="song-info-value" id="song-author">-</span>
                    </div>
                </div>
                
                <div class="options-row">
                    <button class="option-btn" id="btn-timestamp" title="包含时间戳">
                        <svg viewBox="0 0 24 24">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        时间戳
                    </button>
                    <button class="option-btn active" id="btn-translation" title="包含翻译">
                        <svg viewBox="0 0 24 24">
                            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                        </svg>
                        翻译
                    </button>
                </div>
                
                <div class="lyrics-preview" id="lyrics-preview">
                    <div class="lyrics-preview-title">歌词预览</div>
                    <div class="lyrics-preview-content" id="lyrics-content">点击下方按钮加载歌词</div>
                </div>
                
                <div class="action-buttons">
                    <button class="action-btn warning" id="load-btn" title="展开歌词页面并加载">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                        加载
                    </button>
                    <button class="action-btn secondary" id="refresh-btn">
                        <svg viewBox="0 0 24 24">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                        刷新
                    </button>
                </div>
                
                <div class="action-buttons">
                    <button class="action-btn primary" id="download-btn" disabled>
                        <svg viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        下载歌词
                    </button>
                </div>
                
                <div class="status-message" id="status-message" style="display: none;"></div>
                
                <div class="tip-text">
                    提示：如歌词加载失败，请先点击底部播放栏展开歌词页面
                </div>
            </div>
        `;
        shadow.appendChild(panel);
        
        document.body.appendChild(host);
        
        setupEventListeners();
        loadSettings();
    }
    
    function setupEventListeners() {
        const closeBtn = shadowRef.getElementById('close-btn');
        const loadBtn = shadowRef.getElementById('load-btn');
        const refreshBtn = shadowRef.getElementById('refresh-btn');
        const downloadBtn = shadowRef.getElementById('download-btn');
        const btnTimestamp = shadowRef.getElementById('btn-timestamp');
        const btnTranslation = shadowRef.getElementById('btn-translation');
        
        closeBtn.addEventListener('click', () => togglePanel(false));
        loadBtn.addEventListener('click', loadLyrics);
        refreshBtn.addEventListener('click', refreshLyrics);
        downloadBtn.addEventListener('click', downloadLyrics);
        
        btnTimestamp.addEventListener('click', () => {
            currentSettings.includeTimestamp = !currentSettings.includeTimestamp;
            btnTimestamp.classList.toggle('active', currentSettings.includeTimestamp);
            saveSettings();
            updateLyricsPreview();
        });
        
        btnTranslation.addEventListener('click', () => {
            currentSettings.includeTranslation = !currentSettings.includeTranslation;
            btnTranslation.classList.toggle('active', currentSettings.includeTranslation);
            saveSettings();
            updateLyricsPreview();
        });
    }
    
    function togglePanel(show) {
        const panel = shadowRef.getElementById('panel');
        isPanelVisible = show !== undefined ? show : !isPanelVisible;
        
        if (isPanelVisible) {
            panel.classList.add('visible');
            refreshLyrics();
        } else {
            panel.classList.remove('visible');
        }
    }
    
    async function loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'get-settings' });
            if (response && response.success && response.settings) {
                currentSettings = { ...currentSettings, ...response.settings };
                
                const btnTimestamp = shadowRef.getElementById('btn-timestamp');
                const btnTranslation = shadowRef.getElementById('btn-translation');
                
                if (btnTimestamp) btnTimestamp.classList.toggle('active', currentSettings.includeTimestamp);
                if (btnTranslation) btnTranslation.classList.toggle('active', currentSettings.includeTranslation);
            }
        } catch (error) {
            console.error('[LyricsExtractor-Content] Failed to load settings:', error);
        }
    }
    
    async function saveSettings() {
        try {
            await chrome.runtime.sendMessage({
                action: 'save-settings',
                settings: currentSettings
            });
        } catch (error) {
            console.error('[LyricsExtractor-Content] Failed to save settings:', error);
        }
    }
    
    function sendMessageToMain(type, data = {}) {
        window.postMessage({
            source: '__lyrics_extractor_content__',
            type,
            ...data
        }, window.location.origin);
    }
    
    async function loadLyrics() {
        if (isLoading) return;
        isLoading = true;
        
        const loadBtn = shadowRef.getElementById('load-btn');
        loadBtn.disabled = true;
        showStatus('正在加载歌词...', 'info');
        
        sendMessageToMain('load-lyrics');
        
        setTimeout(() => {
            isLoading = false;
            loadBtn.disabled = false;
            refreshLyrics();
        }, 2000);
    }
    
    async function refreshLyrics() {
        showStatus('正在获取歌词...', 'info');
        
        sendMessageToMain('get-song-info');
        sendMessageToMain('get-lyrics');
    }
    
    function updateLyricsPreview() {
        const previewContent = shadowRef.getElementById('lyrics-content');
        const downloadBtn = shadowRef.getElementById('download-btn');
        
        if (!currentLyrics || currentLyrics.length === 0) {
            previewContent.innerHTML = '<div class="lyrics-preview-empty">暂无歌词\n点击"加载"按钮尝试获取</div>';
            downloadBtn.disabled = true;
            return;
        }
        
        downloadBtn.disabled = false;
        
        const previewLines = currentLyrics.slice(0, 4);
        let previewText = '';
        
        previewLines.forEach(line => {
            let lineText = '';
            let startTime = null;
            
            if (line.characters && line.characters.length > 0) {
                lineText = line.characters.map(c => c.char).join('');
                startTime = line.characters[0].startTime;
            } else if (line.text) {
                lineText = line.text;
                startTime = line.startTime;
            }
            
            if (currentSettings.includeTimestamp && startTime !== null && startTime !== undefined) {
                const mins = Math.floor(startTime / 60000);
                const secs = Math.floor((startTime % 60000) / 1000);
                const ms = Math.floor((startTime % 1000) / 10);
                previewText += `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]`;
            }
            
            previewText += lineText + '\n';
            
            if (currentSettings.includeTranslation && line.translated) {
                previewText += line.translated + '\n';
            }
        });
        
        if (currentLyrics.length > 4) {
            previewText += '...';
        }
        
        previewContent.textContent = previewText;
    }
    
    async function downloadLyrics() {
        const downloadBtn = shadowRef.getElementById('download-btn');
        downloadBtn.disabled = true;
        showStatus('正在准备下载...', 'info');
        
        sendMessageToMain('download-lyrics', { settings: currentSettings });
    }
    
    function downloadTextFile(text, fileName) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function showStatus(message, type = 'info') {
        const statusEl = shadowRef.getElementById('status-message');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
    }
    
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        const { source, type, data, error } = event.data;
        if (source !== '__lyrics_extractor_main__') return;
        
        console.log('[LyricsExtractor-Content] Received message from main:', type);
        
        switch (type) {
            case 'song-info-response':
                if (data) {
                    currentSongInfo = data;
                    const songNameEl = shadowRef.getElementById('song-name');
                    const songAuthorEl = shadowRef.getElementById('song-author');
                    
                    if (songNameEl) songNameEl.textContent = data.name || '-';
                    if (songAuthorEl) songAuthorEl.textContent = data.author || '-';
                }
                break;
                
            case 'lyrics-response':
                currentLyrics = data;
                updateLyricsPreview();
                
                if (!data || data.length === 0) {
                    showStatus('暂无歌词，请点击"加载"按钮', 'warning');
                } else {
                    showStatus(`已获取 ${data.length} 行歌词`, 'success');
                }
                break;
                
            case 'load-lyrics-response':
                if (data && data.success) {
                    showStatus('歌词加载中，请稍候...', 'info');
                } else {
                    showStatus('加载失败，请手动展开歌词页面', 'warning');
                }
                break;
                
            case 'download-ready':
                if (data) {
                    downloadTextFile(data.text, data.fileName);
                    showStatus('歌词已保存！', 'success');
                }
                const downloadBtn = shadowRef.getElementById('download-btn');
                if (downloadBtn) downloadBtn.disabled = false;
                break;
                
            case 'download-error':
                showStatus(error || '下载失败', 'error');
                const btn = shadowRef.getElementById('download-btn');
                if (btn) btn.disabled = false;
                break;
        }
    });
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[LyricsExtractor-Content] Received message from background:', message);
        
        if (message.source === '__lyrics_extractor_background__') {
            switch (message.type) {
                case 'get-current-song':
                    sendMessageToMain('get-song-info');
                    setTimeout(() => {
                        sendResponse({ success: true, data: currentSongInfo });
                    }, 100);
                    return true;
                    
                case 'download-lyrics':
                    sendMessageToMain('download-lyrics', { settings: message.settings });
                    sendResponse({ success: true });
                    return true;
            }
        }
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
    
    console.log('[LyricsExtractor-Content] Content script ready');
    
})();

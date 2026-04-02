(function() {
    'use strict';
    
    if (window.__LYRICS_EXTRACTOR_MAIN__) {
        console.log('[LyricsExtractor-Main] Already initialized, skipping');
        return;
    }
    window.__LYRICS_EXTRACTOR_MAIN__ = true;
    
    console.log('[LyricsExtractor-Main] Inject script initializing...');
    
    let currentSongInfo = {
        name: '',
        author: '',
        hash: '',
        album: '',
        img: '',
        duration: 0,
        hasLyrics: false
    };
    
    let vueApp = null;
    
    function initVueObserver() {
        const checkVueApp = () => {
            const app = document.querySelector('#app');
            if (app && app.__vue_app__) {
                vueApp = app.__vue_app__;
                console.log('[LyricsExtractor-Main] Vue app found');
                return true;
            }
            return false;
        };
        
        if (!checkVueApp()) {
            setTimeout(initVueObserver, 1000);
        }
    }
    
    function extractSongInfo() {
        try {
            const songTitleEl = document.querySelector('.song-title');
            const artistEl = document.querySelector('.artist');
            const albumArtEl = document.querySelector('.album-art img');
            const audioEl = document.querySelector('audio');
            
            if (songTitleEl) {
                currentSongInfo.name = songTitleEl.textContent.trim();
            }
            
            if (artistEl) {
                currentSongInfo.author = artistEl.textContent.trim();
            }
            
            if (albumArtEl) {
                currentSongInfo.img = albumArtEl.src;
            }
            
            if (audioEl) {
                currentSongInfo.duration = audioEl.duration || 0;
            }
            
            const lyricsContainer = document.getElementById('lyrics');
            currentSongInfo.hasLyrics = lyricsContainer && lyricsContainer.children.length > 0;
            
            return { ...currentSongInfo };
        } catch (error) {
            console.error('[LyricsExtractor-Main] Error extracting song info:', error);
            return null;
        }
    }
    
    function extractLyricsFromVue() {
        try {
            const app = document.querySelector('#app');
            if (!app || !app.__vue_app__) {
                console.log('[LyricsExtractor-Main] Vue app not found');
                return null;
            }
            
            const vueApp = app.__vue_app__;
            const rootComponent = vueApp._instance;
            
            if (!rootComponent) {
                console.log('[LyricsExtractor-Main] Root component not found');
                return null;
            }
            
            const findLyricsData = (component) => {
                if (!component) return null;
                
                if (component.ctx && component.ctx.lyricsData && component.ctx.lyricsData.value) {
                    console.log('[LyricsExtractor-Main] Found lyricsData in component ctx');
                    return component.ctx.lyricsData.value;
                }
                
                if (component.setupState && component.setupState.lyricsData) {
                    console.log('[LyricsExtractor-Main] Found lyricsData in setupState');
                    return component.setupState.lyricsData;
                }
                
                return null;
            };
            
            let lyricsData = findLyricsData(rootComponent);
            
            if (!lyricsData) {
                const allComponents = document.querySelectorAll('[data-v-app]');
                for (const el of allComponents) {
                    if (el.__vue_app__) {
                        const instance = el.__vue_app__._instance;
                        lyricsData = findLyricsData(instance);
                        if (lyricsData) break;
                    }
                }
            }
            
            if (lyricsData && lyricsData.length > 0) {
                console.log('[LyricsExtractor-Main] Found lyrics from Vue, lines:', lyricsData.length);
                return lyricsData;
            }
            
            return null;
        } catch (error) {
            console.error('[LyricsExtractor-Main] Error extracting lyrics from Vue:', error);
            return null;
        }
    }
    
    function extractLyricsFromDOM() {
        try {
            const lyricsContainer = document.getElementById('lyrics');
            if (!lyricsContainer) {
                console.log('[LyricsExtractor-Main] Lyrics container not found');
                return null;
            }
            
            const lineGroups = lyricsContainer.querySelectorAll('.line-group');
            if (lineGroups.length === 0) {
                console.log('[LyricsExtractor-Main] No line groups found');
                return null;
            }
            
            const lyrics = [];
            
            lineGroups.forEach((lineGroup, index) => {
                const lineEl = lineGroup.querySelector('.line');
                const translatedEl = lineGroup.querySelector('.line.translated');
                const romanizedEl = lineGroup.querySelector('.line.romanized');
                
                if (lineEl) {
                    const charEls = lineEl.querySelectorAll('.char');
                    let text = '';
                    
                    if (charEls.length > 0) {
                        charEls.forEach(charEl => {
                            text += charEl.textContent;
                        });
                    } else {
                        text = lineEl.textContent.trim();
                    }
                    
                    const lineData = {
                        text: text,
                        translated: translatedEl ? translatedEl.textContent.trim() : '',
                        romanized: romanizedEl ? romanizedEl.textContent.trim() : '',
                        index: index
                    };
                    
                    if (text) {
                        lyrics.push(lineData);
                    }
                }
            });
            
            console.log('[LyricsExtractor-Main] Extracted from DOM, lines:', lyrics.length);
            return lyrics.length > 0 ? lyrics : null;
        } catch (error) {
            console.error('[LyricsExtractor-Main] Error extracting lyrics from DOM:', error);
            return null;
        }
    }
    
    function extractLyrics() {
        let lyrics = extractLyricsFromVue();
        
        if (!lyrics || lyrics.length === 0) {
            console.log('[LyricsExtractor-Main] Trying DOM extraction...');
            lyrics = extractLyricsFromDOM();
        }
        
        return lyrics;
    }
    
    function triggerLyricsLoad() {
        try {
            const app = document.querySelector('#app');
            if (!app || !app.__vue_app__) {
                console.log('[LyricsExtractor-Main] Vue app not found for triggering');
                return false;
            }
            
            const vueApp = app.__vue_app__;
            const rootComponent = vueApp._instance;
            
            if (!rootComponent || !rootComponent.ctx) {
                return false;
            }
            
            const ctx = rootComponent.ctx;
            
            if (ctx.getLyrics && currentSongInfo.hash) {
                console.log('[LyricsExtractor-Main] Calling getLyrics with hash:', currentSongInfo.hash);
                ctx.getLyrics(currentSongInfo.hash);
                return true;
            }
            
            if (ctx.toggleLyrics && currentSongInfo.hash) {
                console.log('[LyricsExtractor-Main] Toggling lyrics to load');
                const wasShowing = ctx.showLyrics?.value;
                ctx.toggleLyrics(currentSongInfo.hash, 0);
                if (!wasShowing) {
                    setTimeout(() => {
                        ctx.toggleLyrics(currentSongInfo.hash, 0);
                    }, 500);
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[LyricsExtractor-Main] Error triggering lyrics load:', error);
            return false;
        }
    }
    
    function formatTime(seconds, includeMs = false) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        if (includeMs) {
            const ms = Math.floor((seconds % 1) * 100);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        }
        
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function getLineStartTime(line) {
        if (line.characters && line.characters.length > 0) {
            return line.characters[0].startTime;
        }
        if (line.startTime !== undefined) {
            return line.startTime;
        }
        return null;
    }
    
    function formatLyricsText(lyrics, settings = {}) {
        if (!lyrics || lyrics.length === 0) {
            return '';
        }
        
        let text = '';
        
        if (currentSongInfo.name) {
            text += `歌曲：${currentSongInfo.name}\n`;
        }
        if (currentSongInfo.author) {
            text += `歌手：${currentSongInfo.author}\n`;
        }
        text += '\n' + '='.repeat(40) + '\n\n';
        
        lyrics.forEach((line, index) => {
            let lineText = '';
            let startTime = null;
            
            if (line.characters && line.characters.length > 0) {
                lineText = line.characters.map(c => c.char).join('');
                startTime = line.characters[0].startTime;
            } else if (line.text) {
                lineText = line.text;
                startTime = line.startTime;
            }
            
            if (settings.includeTimestamp && startTime !== null && startTime !== undefined) {
                const timeStr = formatTime(startTime / 1000, true);
                text += `[${timeStr}]`;
            }
            
            text += lineText + '\n';
            
            const translated = line.translated || '';
            const romanized = line.romanized || '';
            
            if (settings.includeTranslation && translated) {
                if (settings.includeTimestamp && startTime !== null && startTime !== undefined) {
                    text += '    ';
                }
                text += translated + '\n';
            }
            
            if (romanized) {
                if (settings.includeTimestamp && startTime !== null && startTime !== undefined) {
                    text += '    ';
                }
                text += romanized + '\n';
            }
        });
        
        text += '\n' + '='.repeat(40) + '\n';
        text += `\n提取时间：${new Date().toLocaleString()}\n`;
        text += '提取工具：MoeKoe 歌词提取器插件\n';
        
        return text;
    }
    
    function generateFileName() {
        let fileName = '';
        if (currentSongInfo.name) {
            fileName += currentSongInfo.name;
        }
        if (currentSongInfo.author) {
            fileName += ` - ${currentSongInfo.author}`;
        }
        if (!fileName) {
            fileName = `lyrics_${Date.now()}`;
        }
        
        fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');
        return fileName;
    }
    
    function updateSongHash() {
        try {
            const audioEl = document.querySelector('audio');
            if (audioEl && audioEl.src) {
                const url = new URL(audioEl.src);
                const hash = url.searchParams.get('hash') || url.pathname.split('/').pop();
                if (hash) {
                    currentSongInfo.hash = hash;
                }
            }
        } catch (error) {
            // Ignore
        }
    }
    
    window.addEventListener('message', async (event) => {
        if (event.source !== window) return;
        
        const { source, type, settings } = event.data;
        if (source !== '__lyrics_extractor_content__') return;
        
        console.log('[LyricsExtractor-Main] Received message:', type);
        
        switch (type) {
            case 'get-song-info':
                extractSongInfo();
                updateSongHash();
                window.postMessage({
                    source: '__lyrics_extractor_main__',
                    type: 'song-info-response',
                    data: { ...currentSongInfo }
                }, window.location.origin);
                break;
                
            case 'get-lyrics':
                const lyrics = extractLyrics();
                window.postMessage({
                    source: '__lyrics_extractor_main__',
                    type: 'lyrics-response',
                    data: lyrics
                }, window.location.origin);
                break;
                
            case 'load-lyrics':
                extractSongInfo();
                updateSongHash();
                const loaded = triggerLyricsLoad();
                window.postMessage({
                    source: '__lyrics_extractor_main__',
                    type: 'load-lyrics-response',
                    success: loaded
                }, window.location.origin);
                break;
                
            case 'download-lyrics':
                extractSongInfo();
                updateSongHash();
                
                let lyricsData = extractLyrics();
                
                if (!lyricsData || lyricsData.length === 0) {
                    triggerLyricsLoad();
                    
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    lyricsData = extractLyrics();
                }
                
                if (lyricsData && lyricsData.length > 0) {
                    const lyricsText = formatLyricsText(lyricsData, settings || {});
                    const fileName = generateFileName();
                    
                    window.postMessage({
                        source: '__lyrics_extractor_main__',
                        type: 'download-ready',
                        data: {
                            text: lyricsText,
                            fileName: fileName,
                            songInfo: currentSongInfo
                        }
                    }, window.location.origin);
                } else {
                    window.postMessage({
                        source: '__lyrics_extractor_main__',
                        type: 'download-error',
                        error: '暂无歌词可提取，请先展开歌词页面'
                    }, window.location.origin);
                }
                break;
        }
    });
    
    setTimeout(initVueObserver, 2000);
    
    window.__LYRICS_EXTRACTOR_API__ = {
        getCurrentSongInfo: () => {
            extractSongInfo();
            updateSongHash();
            return { ...currentSongInfo };
        },
        getLyrics: extractLyrics,
        formatLyrics: formatLyricsText,
        loadLyrics: triggerLyricsLoad
    };
    
    console.log('[LyricsExtractor-Main] Inject script ready');
    
})();

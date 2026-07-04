import { getState } from './state.js';
import { parseYouTubeId, showToast } from './utils.js';

let ytPlayer = null;
let ytReady = false;
let ytLoading = false;

export function initYoutube(){
    const loadButton = document.getElementById('load-video-btn');
    const videoPlaceholder = document.getElementById('video-placeholder');
    const ytPlayerContainer = document.getElementById('yt-player');
    
    loadButton.addEventListener('click', () => {
        const url = document.getElementById('yt-url').value;
        const { id, reason } = parseYouTubeId(url);
        
        if (!id) {
            if (reason === 'playlist') {
                showToast('That\'s a playlist link — open one video from it and paste that URL instead');
            } else if (reason === 'empty') {
                showToast('Paste a YouTube link first');
            } else {
                showToast('Could not read a video ID from that link');
            }
            return;
        }
        
        // Show loading state immediately
        videoPlaceholder.style.display = 'none';
        ytPlayerContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">Loading YouTube player...</div>';
        ytLoading = true;
        
        if (!ytReady) {
            showToast('YouTube API loading, please wait...');
            return;
        }
        
        // Player is ready, load the video
        if (!ytPlayer) {
            ytPlayer = new YT.Player('yt-player', {
                videoId: id,
                playerVars: { rel: 0 },
                events: {
                    onReady: () => {
                        ytLoading = false;
                        showToast('Video loaded');
                    },
                    onError: (event) => {
                        ytLoading = false;
                        showToast('YouTube error: ' + event.data);
                        ytPlayerContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#d32f2f;">YouTube player failed to load</div>';
                    }
                }
            });
        } else {
            ytPlayer.loadVideoById(id);
            ytLoading = false;
            showToast('Video loaded');
        }
    });
}

export function onYouTubeApiReady(){
    ytReady = true;
    
    if (ytLoading) {
        // If user tried to load before API was ready, try again
        const loadButton = document.getElementById('load-video-btn');
        const url = document.getElementById('yt-url').value;
        if (url) {
            const { id } = parseYouTubeId(url);
            if (id) {
                loadButton.click();
            }
        }
    }
}

export function getVideoSeconds(){
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        try {
            return ytPlayer.getCurrentTime() || 0;
        } catch {
            return 0;
        }
    }
    return 0;
}

window.onYouTubeIframeAPIReady = () => {
    onYouTubeApiReady();
};
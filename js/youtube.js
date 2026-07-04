import { getState } from './state.js';
import { parseYouTubeId, showToast } from './utils.js';

let ytPlayer = null;
let ytReady = false;

export function initYoutube(){
  const loadButton = document.getElementById('load-video-btn');
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
    document.getElementById('video-placeholder').style.display = 'none';
    if (!ytReady) {
      showToast('YouTube player still loading, try again in a second');
      return;
    }
    if (!ytPlayer) {
      ytPlayer = new YT.Player('yt-player', {
        videoId: id,
        playerVars: { rel: 0 },
        events: { onReady: () => showToast('Video loaded') }
      });
    } else {
      ytPlayer.loadVideoById(id);
      showToast('Video loaded');
    }
  });
}

export function onYouTubeApiReady(){
  ytReady = true;
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

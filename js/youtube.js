import { parseYouTubeId, showToast } from './utils.js';

let ytPlayer = null;
let ytReady = false;
let pendingVideoId = null; // ONLY set by explicit Load button click — never at page init

window.onYouTubeIframeAPIReady = function () {
  ytReady = true;
  if (pendingVideoId) {
    _loadVideo(pendingVideoId);
    pendingVideoId = null;
  }
};

if (window.YT && window.YT.Player) {
  ytReady = true;
} else {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }
}

function _loadVideo(id) {
  if (!ytPlayer) {
    ytPlayer = new YT.Player('yt-player', {
      videoId: id,
      playerVars: {
        rel: 0
      },
      events: {
        onReady: () => showToast('Video loaded')
      }
    });
  } else {
    ytPlayer.loadVideoById(id);
    showToast('Video loaded');
  }
}

export function initYoutube() {
  // Wire the Load button — this is the ONLY place pendingVideoId gets set
  document.getElementById('load-video-btn').addEventListener('click', () => {
    const url = document.getElementById('yt-url').value;
    const result = parseYouTubeId(url);
    if (result.reason === 'playlist') {
      showToast("That's a playlist link — open one video from it and paste that URL instead.");
      return;
    }
    if (!result.id) {
      showToast('Could not read a video ID from that link');
      return;
    }
    const id = result.id;
    document.getElementById('video-placeholder').style.display = 'none';
    if (!ytReady) {
      pendingVideoId = id; // queued — will fire when API is ready
      showToast('YouTube API loading, please wait...');
      return;
    }
    _loadVideo(id);
  });
}

export function getVideoSeconds() {
  if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
    try {
      return ytPlayer.getCurrentTime() || 0;
    } catch (e) {
      return 0;
    }
  }
  return 0;
}
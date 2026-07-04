import { getState, persist } from './state.js';
import { fmtTime, showToast } from './utils.js';
import { getVideoSeconds } from './youtube.js';
import { renderVerifyBox } from './verify.js';

let eventIdCounter = 0;
function nextEventId(){
  return 'ev' + (Date.now()) + '_' + (eventIdCounter++);
}

// Replays a round's raw events to derive per-tap durations, totals, streak counts.
// Matching is done by stable event `id`, not by timestamp — two taps landing on
// the same video second (realistic during fast scrubbing) must not collide.
export function controlComputeRound(events){
  let baseline = null, aLast = null, bLast = null, aCount = 0, bCount = 0;
  const taps = [];
  events.forEach(ev => {
    if (ev.kind === 'S') {
      baseline = ev.t; aLast = ev.t; bLast = ev.t; aCount = 0; bCount = 0;
    } else if (ev.kind === 'tap') {
      if (ev.site === 'A') {
        aCount++;
        const duration = (aLast === null) ? null : ev.t - aLast;
        aLast = ev.t;
        taps.push({ id: ev.id, site: 'A', streakNum: aCount, t: ev.t, duration });
      } else {
        bCount++;
        const duration = (bLast === null) ? null : ev.t - bLast;
        bLast = ev.t;
        taps.push({ id: ev.id, site: 'B', streakNum: bCount, t: ev.t, duration });
      }
    } else if (ev.kind === 'allout') {
      taps.push({ id: ev.id, site: ev.site, streakNum: null, t: ev.t, duration: null, allout: true });
    }
  });
  const totalA = taps.filter(t => t.site === 'A' && !t.allout).reduce((s,t) => s + (t.duration || 0), 0);
  const totalB = taps.filter(t => t.site === 'B' && !t.allout).reduce((s,t) => s + (t.duration || 0), 0);
  return { baseline, aCount, bCount, taps, totalA, totalB };
}

export function ctrlCurrentComputed(){
  return controlComputeRound(getState().control.events);
}

export function renderControlBars(){
  const comp = ctrlCurrentComputed();
  ['A', 'B'].forEach(site => {
    const track = document.getElementById('ctrl-bar-' + site);
    track.innerHTML = '';
    const count = site === 'A' ? comp.aCount : comp.bCount;
    for (let i = 0; i < 3; i++) {
      const seg = document.createElement('div');
      seg.className = 'capture-bar-seg' + (i < count ? ' filled ' + site : '');
      track.appendChild(seg);
    }
    document.getElementById('ctrl-time-' + site).textContent = Math.round(site === 'A' ? comp.totalA : comp.totalB) + 's';
  });
  document.getElementById('ctrl-btn-A').disabled = comp.aCount >= 3;
  document.getElementById('ctrl-btn-B').disabled = comp.bCount >= 3;
}

// Which streak number (1st/2nd/3rd) a given raw-event index corresponds to,
// found by replaying the event list up to that index.
export function computeStreakIdx(events, idx){
  let aCount = 0, bCount = 0;
  for (let i = 0; i <= idx; i++) {
    const ev = events[i];
    if (ev.kind === 'S') { aCount = 0; bCount = 0; }
    else if (ev.kind === 'tap') { if (ev.site === 'A') aCount++; else bCount++; }
  }
  return events[idx].site === 'A' ? aCount : bCount;
}

export function tapStreakNumFor(idx){
  return computeStreakIdx(getState().control.events, idx);
}

export function streakDurationFor(idx, comp){
  const ev = getState().control.events[idx];
  if (ev.kind !== 'tap') return null;
  const match = comp.taps.find(t => t.id === ev.id);
  return match ? match.duration : null;
}

export function renderControlMiniLog(){
  const wrap = document.getElementById('ctrl-mini-log');
  if (getState().control.events.length === 0) {
    wrap.innerHTML = '<div class="mini-log-empty">No events yet this round. Press S when the round starts.</div>';
    return;
  }
  const comp = ctrlCurrentComputed();
  let html = '';
  getState().control.events.forEach((ev, idx) => {
    if (ev.kind === 'S') {
      html += '<div class="mini-log-row"><span><span class="tag S">S</span>Round start</span><span>' + fmtTime(ev.t) + '</span></div>';
    } else if (ev.kind === 'allout') {
      html += '<div class="mini-log-row"><span><span class="tag allout">OUT</span>All Out — ' + ev.site + '</span><span>' + fmtTime(ev.t) + '</span></div>';
    } else {
      const streakLabel = tapStreakNumFor(idx);
      const dur = streakDurationFor(idx, comp);
      html += '<div class="mini-log-row"><span><span class="tag ' + ev.site + '">' + ev.site + '</span>Streak ' + streakLabel + (dur !== null ? ' &mdash; ' + Math.round(dur) + 's' : '') + '</span><span>' + fmtTime(ev.t) + '</span></div>';
    }
  });
  wrap.innerHTML = html;
  wrap.scrollTop = wrap.scrollHeight;
}

export function renderControlHeaderReadouts(){
  document.getElementById('ctrl-roundnum').textContent = getState().control.roundNum;
}

function ctrlLogEvent(ev){
  ev.id = nextEventId();
  getState().control.events.push(ev);
  renderControlBars();
  renderControlMiniLog();
  persist();
}

function ctrlTapSite(site){
  const comp = ctrlCurrentComputed();
  if (comp.baseline === null) { showToast('Press S first to mark round start'); return; }
  const count = site === 'A' ? comp.aCount : comp.bCount;
  if (count >= 3) { showToast('Site ' + site + ' already fully captured this round'); return; }
  ctrlLogEvent({ kind: 'tap', site, t: getVideoSeconds() });
}

export function initControl(){
  document.getElementById('ctrl-btn-S').addEventListener('click', () => ctrlLogEvent({ kind: 'S', t: getVideoSeconds() }));
  document.getElementById('ctrl-btn-A').addEventListener('click', () => ctrlTapSite('A'));
  document.getElementById('ctrl-btn-B').addEventListener('click', () => ctrlTapSite('B'));

  document.getElementById('ctrl-btn-allout').addEventListener('click', () => {
    document.getElementById('allout-menu').classList.toggle('open');
  });

  document.querySelectorAll('#allout-menu button').forEach(btn => {
    btn.addEventListener('click', () => {
      ctrlLogEvent({ kind: 'allout', site: btn.dataset.site, t: getVideoSeconds() });
      document.getElementById('allout-menu').classList.remove('open');
    });
  });

  document.getElementById('ctrl-save-btn').addEventListener('click', () => {
    if (getState().control.events.length === 0) {
      if (!confirm('No events logged this round. Save an empty round anyway?')) return;
    }
    getState().control.rounds.push({
      roundNum: getState().control.roundNum,
      sideUs: document.getElementById('ctrl-side').value,
      result: document.getElementById('ctrl-result').value,
      livesUs: document.getElementById('ctrl-lives-us').value,
      livesOpp: document.getElementById('ctrl-lives-opp').value,
      notes: document.getElementById('ctrl-notes').value,
      events: getState().control.events.slice()
    });
    getState().control.roundNum++;
    getState().control.events = [];
    document.getElementById('ctrl-lives-us').value = '';
    document.getElementById('ctrl-lives-opp').value = '';
    document.getElementById('ctrl-notes').value = '';
    document.getElementById('ctrl-result').value = 'Win'; // reset — don't silently carry last round's result forward
    renderControlHeaderReadouts();
    renderControlBars();
    renderControlMiniLog();
    renderVerifyBox();
    persist();
    showToast('Round ' + (getState().control.roundNum - 1) + ' saved');
  });
}

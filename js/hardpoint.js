import { getState, persist } from './state.js';
import { showToast } from './utils.js';
import { renderVerifyBox } from './verify.js';

// HILL SCORE US / OPP is the raw HUD reading, which is already the match's
// cumulative score (Hardpoint score never resets per hill). So cumUs/cumOpp
// are stored as-is, and the actual per-hill point gain is derived as a delta
// against the previous row's cumulative value. Held% and Time Wasted must be
// computed from that delta, not the raw cumulative number, or they blow past
// 100%/negative respectively on every hill after the first.
export function hpComputeRows(){
  const rows = getState().hp.rows;
  let prevUs = 0, prevOpp = 0;
  return rows.map(r => {
    const cumUs = Number(r.scoreUs) || 0;
    const cumOpp = Number(r.scoreOpp) || 0;
    const perHillUs = Math.max(0, cumUs - prevUs);
    const perHillOpp = Math.max(0, cumOpp - prevOpp);
    const isMatchEnd = cumUs >= 250 || cumOpp >= 250;
    // The match-ending hill can end at any second (whenever 250 is hit), so
    // "time wasted out of 60s" isn't a meaningful number for that row.
    const timeWasted = isMatchEnd ? 0 : Math.max(0, 60 - perHillUs - perHillOpp);
    const heldPctUs = Math.round((perHillUs / 60) * 1000) / 10;
    prevUs = cumUs;
    prevOpp = cumOpp;
    return Object.assign({}, r, { cumUs, cumOpp, perHillUs, perHillOpp, timeWasted, heldPctUs, isMatchEnd });
  });
}

export function isMatchOver(){
  const rows = getState().hp.rows;
  if (!rows.length) return false;
  const last = rows[rows.length - 1];
  return (Number(last.scoreUs) || 0) >= 250 || (Number(last.scoreOpp) || 0) >= 250;
}

export function currentHillNum(){
  const n = getState().hp.rows.length;
  return (n % getState().hillCycle) + 1;
}

function requiredFieldsFilled(){
  const state = getState();
  const matchIdOk = /^[A-Za-z]\d{3}$/.test(state.matchId.trim());
  const teamOk = state.team.trim().length > 0;
  const oppOk = state.opponent.trim().length > 0;
  const usVal = document.getElementById('hp-score-us').value;
  const oppVal = document.getElementById('hp-score-opp').value;
  return matchIdOk && teamOk && oppOk && usVal !== '' && oppVal !== '';
}

export function updateSaveButtonState(){
  const btn = document.getElementById('hp-save-btn');
  if (!btn) return;
  if (isMatchOver()) {
    btn.disabled = true;
    btn.textContent = 'Match Complete';
    return;
  }
  btn.textContent = 'Save Hill';
  btn.disabled = !requiredFieldsFilled();
}

export function renderHP(){
  document.getElementById('hp-hillnum').textContent = currentHillNum();
  updateSaveButtonState();
}

function showMatchWonModal(winnerLabel, us, opp){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal-box">' +
      '<h3>Match Complete</h3>' +
      '<p><strong>' + winnerLabel + '</strong> won ' + us + ' – ' + opp + '</p>' +
      '<p class="modal-sub">Hardpoint logging is locked for this match. Click <strong>New Match</strong> to start the next one.</p>' +
      '<button class="btn btn-cyan" id="modal-close-btn">Got it</button>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-close-btn').addEventListener('click', () => overlay.remove());
}

export function initHardpoint(){
  const usInput = document.getElementById('hp-score-us');
  const oppInput = document.getElementById('hp-score-opp');
  const matchIdInput = document.getElementById('match-id-input');
  const teamInput = document.getElementById('team-input');
  const oppTeamInput = document.getElementById('opp-input');

  // Re-check the gate on every keystroke that could affect it, not just on save-click.
  [usInput, oppInput, matchIdInput, teamInput, oppTeamInput].forEach(el => {
    if (el) el.addEventListener('input', updateSaveButtonState);
  });

  document.getElementById('hp-save-btn').addEventListener('click', () => {
    if (isMatchOver()) return;
    if (!requiredFieldsFilled()) {
      showToast('Fill in Match ID (e.g. M0012), Team, Opponent, and both hill scores first');
      return;
    }
    const scoreUs = Number(usInput.value);
    const scoreOpp = Number(oppInput.value);
    getState().hp.rows.push({
      hillNum: currentHillNum(),
      scoreUs,
      scoreOpp,
      notes: document.getElementById('hp-notes').value
    });
    usInput.value = '';
    oppInput.value = '';
    document.getElementById('hp-notes').value = '';
    usInput.focus();
    renderHP();
    renderVerifyBox();
    persist();
    showToast('Hill ' + getState().hp.rows.length + ' saved');

    if (scoreUs >= 250 || scoreOpp >= 250) {
      const winnerLabel = scoreUs >= 250 ? (getState().team || 'Us') : (getState().opponent || 'Opponent');
      showMatchWonModal(winnerLabel, scoreUs, scoreOpp);
    }
  });
}
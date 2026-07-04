import { getState, setState, loadState, persist, defaultState } from './state.js';
import { showToast } from './utils.js';
import { initYoutube } from './youtube.js';
import { initHardpoint, renderHP } from './hardpoint.js';
import { initSnd, populateSndPlayerDropdown, renderSnd } from './snd.js';
import { initControl, renderControlBars, renderControlHeaderReadouts, renderControlMiniLog } from './control.js';
import { renderVerifyBox } from './verify.js';
import { exportHp, exportSnd, exportControlRounds, exportControlEvents } from './export.js';

function initTopbar(){
  const state = getState();
  document.getElementById('match-id-input').value = state.matchId;
  document.getElementById('team-input').value = state.team;
  document.getElementById('opp-input').value = state.opponent;
  document.getElementById('hill-cycle-select').value = state.hillCycle;
  document.querySelectorAll('.roster-input').forEach(inp => {
    inp.value = state.roster[+inp.dataset.i] || '';
  });
}

function checkWarn(){
  const banner = document.getElementById('warn-banner');
  if (!getState().matchId.trim()) {
    banner.textContent = 'No Match ID set — rows will still log, but fill this in before exporting.';
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

function renderAll(){
  initTopbar();
  populateSndPlayerDropdown();
  renderHP();
  renderSnd();
  renderControlHeaderReadouts();
  renderControlBars();
  renderControlMiniLog();
  renderVerifyBox();
  checkWarn();
}

initYoutube();
initHardpoint();
initSnd();
initControl();

const matchIdInput = document.getElementById('match-id-input');
const teamInput = document.getElementById('team-input');
const oppInput = document.getElementById('opp-input');
const hillCycleSelect = document.getElementById('hill-cycle-select');

matchIdInput.addEventListener('input', () => { getState().matchId = matchIdInput.value; persist(); checkWarn(); });
teamInput.addEventListener('input', () => { getState().team = teamInput.value; persist(); });
oppInput.addEventListener('input', () => { getState().opponent = oppInput.value; persist(); });
hillCycleSelect.addEventListener('change', () => { getState().hillCycle = +hillCycleSelect.value; renderHP(); persist(); });

document.querySelectorAll('.roster-input').forEach(inp => {
  inp.addEventListener('input', () => {
    getState().roster[+inp.dataset.i] = inp.value;
    populateSndPlayerDropdown();
    persist();
  });
});

document.getElementById('roster-toggle').addEventListener('click', () => {
  document.getElementById('roster-panel').classList.toggle('open');
});

document.getElementById('new-match-btn').addEventListener('click', () => {
  if (!confirm('Start a new match? This clears all logged Hardpoint, S&D, and Control data currently in the tool (export CSVs first if you need them).')) return;
  const keepRoster = getState().roster.slice();
  const keepTeam = getState().team;
  setState(defaultState());
  getState().roster = keepRoster;
  getState().team = keepTeam;
  initTopbar();
  renderAll();
  persist();
  showToast('New match — all logs cleared');
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    getState().activeMode = btn.dataset.mode;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(btn.dataset.mode + '-panel').classList.add('active');
    renderVerifyBox();
    persist();
  });
});

document.addEventListener('keydown', (e) => {
  if (getState().activeMode !== 'control') return;
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 's') document.getElementById('ctrl-btn-S').click();
  else if (k === 'a') document.getElementById('ctrl-btn-A').click();
  else if (k === 'b') document.getElementById('ctrl-btn-B').click();
});

document.getElementById('export-current-btn').addEventListener('click', () => {
  if (getState().activeMode === 'hp') exportHp();
  else if (getState().activeMode === 'snd') exportSnd();
  else { exportControlRounds(); exportControlEvents(); }
  showToast('CSV exported');
});

document.getElementById('export-all-btn').addEventListener('click', () => {
  exportHp(); exportSnd(); exportControlRounds(); exportControlEvents();
  showToast('All CSVs exported');
});

renderAll();
if (getState().hp.rows.length || getState().snd.rows.length || getState().control.rounds.length) {
  showToast('Restored previous session from this browser');
}

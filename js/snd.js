import { getState, persist } from './state.js';
import { showToast } from './utils.js';
import { renderVerifyBox } from './verify.js';

export function populateSndPlayerDropdown(){
  const sel = document.getElementById('snd-fbplayer');
  const prev = sel.value;
  sel.innerHTML = '';
  getState().roster.forEach((name, i) => {
    const label = name && name.trim() ? name : ('Player ' + (i + 1));
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    sel.appendChild(opt);
  });
  ['Oppo', 'Manual entry...'].forEach(label => {
    const opt = document.createElement('option');
    opt.value = label === 'Manual entry...' ? 'manual' : label;
    opt.textContent = label;
    sel.appendChild(opt);
  });
  if (prev) sel.value = prev;
}

export function sndMethodLabel(v){
  const map = {
    elim_us_win: 'Elimination (Us win)',
    elim_opp_win: 'Elimination (Opp win)',
    elim_us_diffuse: 'Elim Us – Opp Diffuses',
    elim_opp_diffuse: 'Elim Opp – Us Diffuses',
    detonated: 'Bomb Detonated',
    time_expired: 'Time Expired'
  };
  return map[v] || v;
}

export function sndDeriveWinner(row){
  switch (row.method) {
    case 'elim_us_win': return 'Us';
    case 'elim_opp_win': return 'Opp';
    case 'elim_us_diffuse': return 'Opp';
    case 'elim_opp_diffuse': return 'Us';
    case 'detonated': return row.side === 'Attack' ? 'Us' : 'Opp';
    case 'time_expired': return row.side === 'Defense' ? 'Us' : 'Opp';
    case 'manual': return row.manualResult || 'Us';
    default: return 'Us';
  }
}

export function sndComputeRows(){
  let cumUs = 0, cumOpp = 0;
  return getState().snd.rows.map(r => {
    const winner = sndDeriveWinner(r);
    if (winner === 'Us') cumUs++; else cumOpp++;
    return Object.assign({}, r, { cumUs, cumOpp, winner });
  });
}

export function renderSnd(){
  document.getElementById('snd-roundnum').textContent = getState().snd.rows.length + 1;
}

export function initSnd(){
  populateSndPlayerDropdown();

  document.getElementById('snd-fbplayer').addEventListener('change', (e) => {
    document.getElementById('snd-fbplayer-manual-wrap').style.display = (e.target.value === 'manual') ? 'flex' : 'none';
  });

  document.getElementById('snd-method').addEventListener('change', (e) => {
    const isManual = e.target.value === 'manual';
    document.getElementById('snd-manual-result-wrap').style.display = isManual ? 'flex' : 'none';
    document.getElementById('snd-manual-method-wrap').style.display = isManual ? 'flex' : 'none';
  });

  function saveSndRound(){
    const method = document.getElementById('snd-method').value;
    let fbPlayer = document.getElementById('snd-fbplayer').value;
    if (fbPlayer === 'manual') fbPlayer = document.getElementById('snd-fbplayer-manual').value || 'Unknown';

    const row = {
      side: document.getElementById('snd-side').value,
      site: document.getElementById('snd-site').value,
      plant: document.getElementById('snd-plant').value,
      fbSide: document.getElementById('snd-fbside').value,
      fbPlayer,
      method,
      methodLabel: method === 'manual' ? (document.getElementById('snd-manual-method').value || 'Manual') : sndMethodLabel(method),
      manualResult: method === 'manual' ? document.getElementById('snd-manual-result').value : null,
      ot: document.getElementById('snd-ot').value,
      notes: document.getElementById('snd-notes').value
    };
    getState().snd.rows.push(row);

    document.getElementById('snd-site').value = 'N/A';
    document.getElementById('snd-plant').value = 'N';
    document.getElementById('snd-ot').value = 'N';
    document.getElementById('snd-notes').value = '';
    document.getElementById('snd-fbplayer-manual').value = '';
    document.getElementById('snd-fbplayer-manual-wrap').style.display = 'none';
    document.getElementById('snd-manual-result-wrap').style.display = 'none';
    document.getElementById('snd-manual-method-wrap').style.display = 'none';
    document.getElementById('snd-manual-method').value = '';

    renderSnd();
    renderVerifyBox();
    persist();
    showToast('Round ' + getState().snd.rows.length + ' saved');
  }

  document.getElementById('snd-save-btn').addEventListener('click', saveSndRound);
  document.getElementById('snd-panel').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      saveSndRound();
    }
  });
}

import { getState, persist } from './state.js';
import { fmtTime } from './utils.js';
import { hpComputeRows, renderHP } from './hardpoint.js';
import { sndComputeRows, sndMethodLabel, renderSnd } from './snd.js';
import { controlComputeRound, computeStreakIdx } from './control.js';

export function emptyDiv(msg){
  const d = document.createElement('div');
  d.className = 'empty-state';
  d.textContent = msg;
  return d;
}

// Generic inline-edit helper. Uses a single `settle()` guarded by a flag so
// Enter-then-blur can never double-fire the commit callback with stale values.
function editRow(tr, fields, onCommit){
  fields.forEach(f => {
    const cell = tr.querySelector('[data-edit="' + f + '"]');
    cell.innerHTML = '<input type="text" value="' + cell.textContent.replace(/"/g, '&quot;') + '">';
  });
  const inputs = fields.map(f => tr.querySelector('[data-edit="' + f + '"] input'));
  let settled = false;
  function settle(){
    if (settled) return;
    settled = true;
    const vals = {};
    fields.forEach((f, i) => vals[f] = inputs[i].value);
    onCommit(vals);
  }
  inputs.forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); settle(); } });
    inp.addEventListener('blur', () => settle());
  });
  inputs[0].focus();
}

function buildHpTable(){
  const computed = hpComputeRows();
  if (computed.length === 0) return emptyDiv('No hills logged yet.');
  const table = document.createElement('table');
  table.className = 'vt';
  table.innerHTML = '<thead><tr>' + ['Hill #', 'Score Us', 'Score Opp', 'Cum Us', 'Cum Opp', 'Time Wasted', 'Held % Us', 'Notes', ''].map(h => '<th>' + h + '</th>').join('') + '</tr></thead>';
  const tbody = document.createElement('tbody');
  computed.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + r.hillNum + '</td>' + '<td data-edit="scoreUs">' + r.scoreUs + '</td>' + '<td data-edit="scoreOpp">' + r.scoreOpp + '</td>' + '<td>' + r.cumUs + '</td>' + '<td>' + r.cumOpp + '</td>' + '<td>' + r.timeWasted + 's</td>' + '<td>' + r.heldPctUs + '%</td>' + '<td data-edit="notes">' + (r.notes || '') + '</td>' + '<td class="row-actions"><button class="icon-btn edit-btn">✎</button><button class="icon-btn danger del-btn">✕</button></td>';
    tr.querySelector('.edit-btn').addEventListener('click', () => editRow(tr, ['scoreUs', 'scoreOpp', 'notes'], (vals) => {
      getState().hp.rows[i].scoreUs = Number(vals.scoreUs) || 0;
      getState().hp.rows[i].scoreOpp = Number(vals.scoreOpp) || 0;
      getState().hp.rows[i].notes = vals.notes;
      renderHP(); renderVerifyBox(); persist();
    }));
    tr.querySelector('.del-btn').addEventListener('click', () => {
      if (!confirm('Delete this hill row?')) return;
      getState().hp.rows.splice(i, 1);
      renderHP(); renderVerifyBox(); persist();
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function buildSndTable(){
  const computed = sndComputeRows();
  if (computed.length === 0) return emptyDiv('No rounds logged yet.');
  const table = document.createElement('table');
  table.className = 'vt';
  table.innerHTML = '<thead><tr>' + ['Rnd', 'Side', 'Site', 'Plant', 'FB Side', 'FB Player', 'Method', 'OT', 'Notes', 'Cum Us', 'Cum Opp', ''].map(h => '<th>' + h + '</th>').join('') + '</tr></thead>';
  const tbody = document.createElement('tbody');
  computed.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + (i + 1) + '</td>' + '<td>' + r.side + '</td>' + '<td data-edit="site">' + r.site + '</td>' + '<td data-edit="plant">' + r.plant + '</td>' + '<td>' + r.fbSide + '</td>' + '<td data-edit="fbPlayer">' + r.fbPlayer + '</td>' + '<td>' + r.methodLabel + '</td>' + '<td data-edit="ot">' + r.ot + '</td>' + '<td data-edit="notes">' + (r.notes || '') + '</td>' + '<td>' + r.cumUs + '</td>' + '<td>' + r.cumOpp + '</td>' + '<td class="row-actions"><button class="icon-btn edit-btn">✎</button><button class="icon-btn danger del-btn">✕</button></td>';
    // Edit covers the typo-fix-level fields (site, plant, fb player, ot, notes).
    // Side and Method are structural to the row's winner calc — deleting and
    // re-logging is the safer path for those, same as the tool's own philosophy
    // elsewhere ("fix-a-typo level editing", not a full re-architecture).
    tr.querySelector('.edit-btn').addEventListener('click', () => editRow(tr, ['site', 'plant', 'fbPlayer', 'ot', 'notes'], (vals) => {
      const row = getState().snd.rows[i];
      row.site = vals.site;
      row.plant = vals.plant;
      row.fbPlayer = vals.fbPlayer;
      row.ot = vals.ot;
      row.notes = vals.notes;
      renderSnd(); renderVerifyBox(); persist();
    }));
    tr.querySelector('.del-btn').addEventListener('click', () => {
      if (!confirm('Delete this round row?')) return;
      getState().snd.rows.splice(i, 1);
      renderSnd(); renderVerifyBox(); persist();
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function buildControlEventSubtable(round, roundIdx){
  const comp = controlComputeRound(round.events);
  const table = document.createElement('table');
  table.className = 'vt-sub';
  table.innerHTML = '<thead><tr><th>Type</th><th>Site</th><th>Streak</th><th>Time</th><th>Duration</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  round.events.forEach((ev, evIdx) => {
    const tr = document.createElement('tr');
    let streakLabel = '-', durLabel = '-';
    if (ev.kind === 'tap') {
      const match = comp.taps.find(t => t.id === ev.id);
      streakLabel = computeStreakIdx(round.events, evIdx);
      durLabel = match && match.duration !== null ? Math.round(match.duration) + 's' : '-';
    }
    tr.innerHTML = '<td>' + (ev.kind === 'S' ? 'Round Start' : ev.kind === 'allout' ? 'All Out' : 'Streak') + '</td>' + '<td>' + (ev.site || '-') + '</td>' + '<td>' + streakLabel + '</td>' + '<td data-edit="t">' + fmtTime(ev.t) + '</td>' + '<td>' + durLabel + '</td>' + '<td class="row-actions"><button class="icon-btn edit-btn">✎</button><button class="icon-btn danger del-btn">✕</button></td>';
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      const cell = tr.querySelector('[data-edit="t"]');
      const cur = fmtTime(ev.t);
      cell.innerHTML = '<input type="text" value="' + cur + '" placeholder="m:ss">';
      const input = cell.querySelector('input');
      input.focus();
      let settled = false;
      const commit = () => {
        if (settled) return;
        settled = true;
        const parts = input.value.split(':');
        let secs = ev.t;
        if (parts.length === 2) secs = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
        round.events[evIdx].t = secs;
        renderVerifyBox();
        persist();
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    });
    tr.querySelector('.del-btn').addEventListener('click', () => {
      if (!confirm('Delete this event?')) return;
      round.events.splice(evIdx, 1);
      renderVerifyBox();
      persist();
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function buildControlTable(){
  if (getState().control.rounds.length === 0) return emptyDiv('No rounds saved yet.');
  const table = document.createElement('table');
  table.className = 'vt';
  table.innerHTML = '<thead><tr>' + ['','Rnd','Side','Result','Total A','Total B','Streaks A/B','Lives Us/Opp','Notes',''].map(h => '<th>' + h + '</th>').join('') + '</tr></thead>';
  const tbody = document.createElement('tbody');
  getState().control.rounds.forEach((round, i) => {
    const comp = controlComputeRound(round.events);
    const tr = document.createElement('tr');
    tr.innerHTML = '<td class="expand-row">▸</td>' + '<td>' + round.roundNum + '</td>' + '<td>' + round.sideUs + '</td>' + '<td>' + round.result + '</td>' + '<td>' + Math.round(comp.totalA) + 's</td>' + '<td>' + Math.round(comp.totalB) + 's</td>' + '<td>' + comp.aCount + '/' + comp.bCount + '</td>' + '<td>' + (round.livesUs || '-') + '/' + (round.livesOpp || '-') + '</td>' + '<td>' + (round.notes || '') + '</td>' + '<td class="row-actions"><button class="icon-btn danger del-btn">✕</button></td>';
    tr.querySelector('.del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('Delete round ' + round.roundNum + '?')) return;
      getState().control.rounds.splice(i, 1);
      renderVerifyBox();
      persist();
    });
    tbody.appendChild(tr);

    const subTr = document.createElement('tr');
    subTr.style.display = 'none';
    const subTd = document.createElement('td');
    subTd.colSpan = 10;
    subTd.className = 'sub-events';
    subTd.appendChild(buildControlEventSubtable(round, i));
    subTr.appendChild(subTd);
    tbody.appendChild(subTr);

    tr.querySelector('.expand-row').addEventListener('click', () => {
      const open = subTr.style.display !== 'none';
      subTr.style.display = open ? 'none' : 'table-row';
      tr.querySelector('.expand-row').textContent = open ? '▸' : '▾';
    });
  });
  table.appendChild(tbody);
  return table;
}

export function renderVerifyBox(){
  const titleMap = { hp: 'Hardpoint Log', snd: 'Search & Destroy Log', control: 'Control Log' };
  document.getElementById('verify-title').textContent = titleMap[getState().activeMode];
  const target = document.getElementById('verify-scroll');
  target.innerHTML = '';
  if (getState().activeMode === 'hp') target.appendChild(buildHpTable());
  else if (getState().activeMode === 'snd') target.appendChild(buildSndTable());
  else if (getState().activeMode === 'control') target.appendChild(buildControlTable());
}

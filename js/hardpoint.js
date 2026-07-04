import { getState, persist } from './state.js';
import { showToast } from './utils.js';
import { renderVerifyBox } from './verify.js';

export function hpComputeRows(){
  let cumUs = 0, cumOpp = 0;
  return getState().hp.rows.map(r => {
    const scoreUs = Number(r.scoreUs) || 0;
    const scoreOpp = Number(r.scoreOpp) || 0;
    cumUs += scoreUs;
    cumOpp += scoreOpp;
    const timeWasted = Math.max(0, 60 - scoreUs - scoreOpp);
    const heldPctUs = Math.round((scoreUs / 60) * 1000) / 10;
    return Object.assign({}, r, { cumUs, cumOpp, timeWasted, heldPctUs });
  });
}

export function currentHillNum(){
  const n = getState().hp.rows.length;
  return (n % getState().hillCycle) + 1;
}

export function renderHP(){
  document.getElementById('hp-hillnum').textContent = currentHillNum();
}

export function initHardpoint(){
  document.getElementById('hp-save-btn').addEventListener('click', () => {
    const scoreUs = document.getElementById('hp-score-us').value;
    const scoreOpp = document.getElementById('hp-score-opp').value;
    if (scoreUs === '' || scoreOpp === '') {
      showToast('Enter both hill scores');
      return;
    }
    getState().hp.rows.push({
      hillNum: currentHillNum(),
      scoreUs: Number(scoreUs),
      scoreOpp: Number(scoreOpp),
      notes: document.getElementById('hp-notes').value
    });
    document.getElementById('hp-score-us').value = '';
    document.getElementById('hp-score-opp').value = '';
    document.getElementById('hp-notes').value = '';
    document.getElementById('hp-score-us').focus();
    renderHP();
    renderVerifyBox();
    persist();
    showToast('Hill ' + getState().hp.rows.length + ' saved');
  });
}

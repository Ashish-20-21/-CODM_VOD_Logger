import { getState, persist } from './state.js';
import { downloadCsv, rowsToCsv, fmtTime } from './utils.js';
import { hpComputeRows } from './hardpoint.js';
import { sndComputeRows } from './snd.js';
import { controlComputeRound, computeStreakIdx } from './control.js';

export function exportHp(){
  const computed = hpComputeRows();
  const headers = ['Match ID','Hill #','Cum. Score Opp','Cum. Score Us','Hill Score Opp','Hill Score Us','Time Wasted (s)','Held % Us','Notes','Team','Opponent'];
  const rows = computed.map(r => [getState().matchId, r.hillNum, r.cumOpp, r.cumUs, r.scoreOpp, r.scoreUs, r.timeWasted, r.heldPctUs, r.notes || '', getState().team, getState().opponent]);
  downloadCsv((getState().matchId || 'match') + '_Hardpoint.csv', rowsToCsv(headers, rows));
}

export function exportSnd(){
  const computed = sndComputeRows();
  const headers = ['Match ID','Round #','Side Us','Site','Plant?','First Blood Side','First Blood Player','Result/Method','OT Round?','Notes','Cum. Rounds Us','Cum. Rounds Opp','Team','Opponent'];
  const rows = computed.map((r, i) => [getState().matchId, i + 1, r.side, r.site, r.plant, r.fbSide, r.fbPlayer, r.methodLabel, r.ot, r.notes || '', r.cumUs, r.cumOpp, getState().team, getState().opponent]);
  downloadCsv((getState().matchId || 'match') + '_SND.csv', rowsToCsv(headers, rows));
}

export function exportControlRounds(){
  const headers = ['Match ID','Round #','Side Us','Result','Total Capture Time A (s)','Total Capture Time B (s)','Streak Count A','Streak Count B','Final Lives Us','Final Lives Opp','Notes','Team','Opponent'];
  const rows = getState().control.rounds.map(round => {
    const comp = controlComputeRound(round.events);
    return [getState().matchId, round.roundNum, round.sideUs, round.result, Math.round(comp.totalA), Math.round(comp.totalB), comp.aCount, comp.bCount, round.livesUs, round.livesOpp, round.notes || '', getState().team, getState().opponent];
  });
  downloadCsv((getState().matchId || 'match') + '_Control_Rounds.csv', rowsToCsv(headers, rows));
}

export function exportControlEvents(){
  const headers = ['Match ID','Round #','Event Type','Site','Streak #','Timestamp','Duration (s)'];
  const rows = [];
  getState().control.rounds.forEach(round => {
    const comp = controlComputeRound(round.events);
    round.events.forEach((ev, evIdx) => {
      let streak = '-', dur = '';
      if (ev.kind === 'tap') {
        streak = computeStreakIdx(round.events, evIdx);
        const match = comp.taps.find(t => t.id === ev.id);
        dur = match && match.duration !== null ? Math.round(match.duration) : '';
      }
      rows.push([getState().matchId, round.roundNum, ev.kind === 'S' ? 'Round Start' : ev.kind === 'allout' ? 'All Out' : 'Streak', ev.site || '', streak, fmtTime(ev.t), dur]);
    });
  });
  downloadCsv((getState().matchId || 'match') + '_Control_Events.csv', rowsToCsv(headers, rows));
}

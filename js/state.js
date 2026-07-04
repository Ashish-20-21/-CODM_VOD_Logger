export const STORAGE_KEY = 'codm_vod_logger_state_v1';

export function defaultState(){
  return {
    matchId: '',
    team: 'Rival',
    opponent: '',
    hillCycle: 5,
    roster: ['', '', '', '', ''],
    activeMode: 'hp',
    hp: { rows: [] },
    snd: { rows: [] },
    control: {
      roundNum: 1,
      sideUs: 'Offense',
      result: 'Win',
      livesUs: '',
      livesOpp: '',
      notes: '',
      events: [],
      rounds: []
    }
  };
}

// Deep merge saved data onto a fresh default shape, so a future field added to
// defaultState() doesn't come back `undefined` for people with old localStorage.
function deepMerge(base, saved){
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (base && typeof base === 'object') {
    const out = {};
    for (const key of Object.keys(base)) {
      out[key] = (saved && Object.prototype.hasOwnProperty.call(saved, key))
        ? deepMerge(base[key], saved[key])
        : base[key];
    }
    return out;
  }
  return (saved !== undefined) ? saved : base;
}

let state = loadState();

export function getState(){ return state; }
export function setState(next){ state = next; }

export function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return deepMerge(defaultState(), JSON.parse(raw));
  } catch (e) {
    console.warn('Could not load saved state', e);
  }
  return defaultState();
}

let saveTimer = null;
export function persist(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
    } catch (e) {
      console.warn('Could not save state', e);
    }
  }, 150);
}

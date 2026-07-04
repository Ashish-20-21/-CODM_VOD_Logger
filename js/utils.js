export function fmtTime(totalSeconds){
  totalSeconds = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

export function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 1600);
}

export function csvEscape(val){
  val = (val === undefined || val === null) ? '' : String(val);
  return /[",\n]/.test(val) ? '"' + val.replace(/"/g, '""') + '"' : val;
}

export function rowsToCsv(headers, rows){
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach(r => lines.push(r.map(csvEscape).join(',')));
  return lines.join('\r\n');
}

export function downloadCsv(filename, csvText){
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseYouTubeId(url){
  if (!url) return { id: null, reason: 'empty' };
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return { id: m[1], reason: 'ok' };
  }
  if (/^[\w-]{11}$/.test(url.trim())) return { id: url.trim(), reason: 'ok' };
  if (/youtube\.com\/playlist\?/.test(url)) return { id: null, reason: 'playlist' };
  return { id: null, reason: 'unrecognized' };
}

export function isFileOrigin(){
  return typeof location !== 'undefined' && location.protocol === 'file:';
}

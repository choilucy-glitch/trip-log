// 일정 내용 ↔ 간단한 글쓰기 규칙, 날짜 계산, 하루 경로 만들기
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const WD = ['일','월','화','수','목','금','토'];

export function dayMeta(iso){
  const d = new Date(iso + 'T00:00:00');
  return { d: `${iso.slice(5,7)}.${iso.slice(8,10)}`, w: WD[d.getDay()] };
}
export function tripDates(start){
  if (!start) return { w1:'', d1:'', d0:'' };
  const f = n => { const d = new Date(start + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getMonth()+1}/${d.getDate()}`; };
  return { w1: f(-7), d1: f(-1), d0: f(0) };
}
export function makeRoute(stops){
  const pts = (stops || []).map(s => s.map).filter(Boolean);
  if (pts.length < 2) return '';
  const uniq = pts.filter((p,i) => p !== pts[i-1]);
  if (uniq.length < 2) return '';
  const o = uniq[0], d = uniq[uniq.length-1], w = uniq.slice(1, -1).slice(0, 8);
  return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(o) + '&destination=' + encodeURIComponent(d) + (w.length ? '&waypoints=' + encodeURIComponent(w.join('|')) : '');
}
// 저장된 HTML → 고치기 칸에 보여줄 글
export function htmlToMarkup(html){
  const t = document.createElement('template'); t.innerHTML = html || '';
  const inline = el => {
    const c = el.cloneNode(true);
    c.querySelectorAll('br').forEach(x => x.replaceWith('\n'));
    c.querySelectorAll('b,strong').forEach(x => x.replaceWith('**' + x.textContent + '**'));
    return c.textContent.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
  };
  const out = [];
  t.content.childNodes.forEach(n => {
    if (n.nodeType === 3){ const s = n.textContent.trim(); if (s) out.push(s); return; }
    if (n.nodeType !== 1) return;
    if (n.tagName === 'UL' || n.tagName === 'OL') out.push([...n.children].map(li => '- ' + inline(li).replace(/\n/g, ' ')).join('\n'));
    else if (n.classList.contains('warn')) out.push('! ' + inline(n).replace(/\n/g, ' '));
    else out.push(inline(n));
  });
  return out.filter(Boolean).join('\n\n');
}
// 고치기 칸의 글 → 화면에 보여줄 HTML
export function markupToHtml(text){
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return '';
    if (lines.every(l => l.startsWith('- '))) return '<ul>' + lines.map(l => '<li>' + inl(l.slice(2)) + '</li>').join('') + '</ul>';
    if (lines[0].startsWith('! ')) return '<div class="warn">' + inl(lines.map((l,i) => i ? l : l.slice(2)).join(' ')) + '</div>';
    return '<p>' + lines.map(inl).join('<br>') + '</p>';
  }).join('');
}

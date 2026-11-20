// 홈 화면: 여행 전엔 다음 할 일, 여행 중엔 지금·다음 일정, 늘 숙소·가계부·바로가기
// 시간은 일본/한국 시간(UTC+9) 기준으로 계산해요.

function jstNow(){
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(new Date()).map(x=>[x.type, x.value]));
  return { date:`${p.year}-${p.month}-${p.day}`, time:`${p.hour}:${p.minute}` };
}
const dayDiff = (a, b) => Math.round((Date.UTC(...a.split('-').map((n,i)=>i===1?n-1:+n)) - Date.UTC(...b.split('-').map((n,i)=>i===1?n-1:+n))) / 86400000);

export function renderHome(ctx){
  const { TRIP, DAYS, CK, CK_GROUPS, MONEY, PHOTOS, h, won, jp, q, IC, segs } = ctx;
  const box = document.getElementById('homeBox'); if (!box) return;
  if (!DAYS.length){ box.innerHTML = '<p class="status">여행 날짜를 정하면 홈이 채워져요. 준비 탭 → 여행 정보 고치기.</p>'; return; }
  const now = jstNow(), start = TRIP.start, end = TRIP.end;
  const before = now.date < start, after = now.date > end;
  const dayIdx = DAYS.findIndex(D=>D.iso === now.date);
  const card = (title, body, extra='') => `<article class="hcard ${extra}"><h3>${title}</h3>${body}</article>`;
  const stopLine = (S, label) => `<a class="hstop c-${S.tag}" href="#day${DAYS.findIndex(D=>D.stops.includes(S))+1}" data-day="${DAYS.findIndex(D=>D.stops.includes(S))}">
      <span class="hs-label">${label}</span><span class="time">${S.t}</span><span class="hs-ttl"><b>${segs(S.ttl,' · ')}</b><small>${S.s}</small></span></a>`;
  let main = '';

  if (before){
    const left = dayDiff(start, now.date);
    // 다음 할 일: 시기 순서대로 아직 안 끝난 항목 3개
    const order = CK_GROUPS.map(g=>g[0]);
    const unitsLeft = x => x.scope==='each' ? ctx.MEMBERS.filter(m=>!(x.doneBy&&x.doneBy[m])).length : (x.done?0:1);
    const todo = CK.filter(x=>unitsLeft(x)>0).sort((a,b)=>order.indexOf(a.when)-order.indexOf(b.when) || (a.order||0)-(b.order||0)).slice(0,3);
    const glabel = Object.fromEntries(CK_GROUPS);
    const total = CK.reduce((s,x)=>s+(x.scope==='each'?ctx.MEMBERS.length:1),0), done = total - CK.reduce((s,x)=>s+unitsLeft(x),0);
    const pct = total ? Math.round(done/total*100) : 0;
    main = card(`출발까지 ${left}일 · 다음 할 일`,
      (CK.length ? `<div class="hprog"><span style="width:${pct}%"></span></div><p class="hint" style="margin:6px 0 10px">체크리스트 ${done} / ${total} 완료</p>` : '') +
      (todo.length ? `<ul class="htodo">${todo.map(x=>`<li><span class="hint">${h(glabel[x.when]||'')}</span><b>${h(x.text)}</b>${x.scope==='each'?`<small>${ctx.MEMBERS.filter(m=>!(x.doneBy&&x.doneBy[m])).map(h).join(' · ')} 남음</small>`:''}</li>`).join('')}</ul>` : `<p class="hint" style="margin:0">${CK.length?'출발 전 할 일을 모두 끝냈어요!':'체크리스트를 불러오는 중이에요.'}</p>`) +
      `<div class="btns"><a class="btn primary" href="#checklist">체크리스트 열기</a></div>`, 'hero-card') +
      (DAYS[0].stops.length ? card('첫날 일정 미리보기', DAYS[0].stops.slice(0,3).map(S=>stopLine(S, '')).join('') + `<div class="btns"><a class="btn" href="#plan" data-day="0">DAY 1 전체 보기</a></div>`) : card('일정 만들기', `<p class="hint" style="margin:0">아직 일정이 없어요. 일정 탭에서 날짜별로 ＋ 일정 추가를 눌러 채워보세요.</p><div class="btns"><a class="btn primary" href="#plan" data-day="0">일정 탭으로</a></div>`));
  } else if (dayIdx >= 0){
    const D = DAYS[dayIdx], stops = D.stops;
    const ni = stops.findIndex(S=>S.t > now.time);
    const cur = ni === -1 ? stops[stops.length-1] : stops[Math.max(0, ni-1)];
    const nxt = ni === -1 ? null : stops[ni], nxt2 = ni === -1 ? null : stops[ni+1];
    main = card(`DAY ${dayIdx+1} · ${segs(D.title,' → ')}`,
      `<div class="hstops">${(ni===0 ? '' : stopLine(cur, '지금'))}${nxt?stopLine(nxt,'다음'):''}${nxt2?stopLine(nxt2,'그다음'):''}</div>` +
      (ni === -1 ? `<p class="hint" style="margin:8px 0 0">오늘 일정은 다 끝났어요. 푹 쉬세요!</p>` : '') +
      `<div class="btns">${nxt && nxt.map ? `<a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(nxt.map)}">${IC.car}다음 장소 길찾기</a>` : ''}<a class="btn" href="#plan" data-day="${dayIdx}">오늘 일정 전체</a></div>`, 'hero-card');
  } else {
    const m = MONEY || { total:0 };
    main = card('다녀왔어요!', `<p style="margin:0 0 6px">사진 ${PHOTOS.length}장 · 총 지출 ${won(m.total)} (${jp(m.total)})</p><div class="btns"><a class="btn primary" href="#photos">포토로그 보기</a><a class="btn" href="#money">정산 확인</a></div>`, 'hero-card');
  }

  // 숙소
  const stayKey = before ? start : now.date;
  const stay = (TRIP.stays||[]).find(s=>s.from <= stayKey && stayKey < s.to);
  const stayCard = stay ? card(before ? '첫날 숙소' : '오늘 숙소', `<p class="hbig">${h(stay.name)}</p><p class="hint" style="margin:2px 0 0">${h(stay.sub)}</p><div class="btns"><a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(stay.q)}">${IC.car}길찾기</a><a class="btn" href="#bookings">예약 정보</a></div>`) : '';

  // 가계부
  const m = MONEY || { total:0, out:[], count:0 };
  const moneyCard = card('가계부', `<p class="hbig mono">${won(m.total)} <span class="hint" style="font-size:14px">${jp(m.total)}</span></p><p class="hint" style="margin:2px 0 8px">지출 ${m.count}건 · 1인 평균 ${won(m.total/Math.max(1,ctx.MEMBERS.length))}</p>` +
    (m.out.length ? `<ul class="settle">${m.out.slice(0,3).map(([a,b,v])=>`<li><b>${h(a)}</b> → <b>${h(b)}</b><span class="amt">${won(Math.round(v/10)*10)}<small>${jp(v)}</small></span></li>`).join('')}</ul>` : '') +
    `<div class="btns"><a class="btn primary" href="#mForm">지출 추가</a><a class="btn" href="#money">정산 보기</a></div>`);

  // 바로가기
  const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const links = [
    ['#vFold','바우처', ic('<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>')],
    ...((TRIP.country||'JP')==='JP' ? [['#vjw','입국 QR', ic('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>')]] : []),
    ['#checklist','체크리스트', ic('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>')],
    ['#photos','사진', ic('<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>')]
  ];
  const quick = `<nav class="hquick" style="grid-template-columns:repeat(${links.length},1fr)" aria-label="바로가기">${links.map(([href,l,svg])=>`<a href="${href}">${svg}<span>${l}</span></a>`).join('')}</nav>`;

  box.innerHTML = main + quick + stayCard + moneyCard;
}

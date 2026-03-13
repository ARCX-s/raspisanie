/* Расписание пар ИИЭСМ — © 2025 @dev25 */
'use strict';

const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const TYPE_TAG  = {лек:'tt-l',пр:'tt-p',лаб:'tt-b'};
const TYPE_WORD = {лек:'Лекция',пр:'Практика',лаб:'Лаб'};
const ACCENTS = [
  {r:0,  g:122,b:255,a2:'88,86,214',  name:'Синий'},
  {r:88, g:86, b:214,a2:'175,82,222', name:'Фиолет'},
  {r:255,g:45, b:85, a2:'255,149,0',  name:'Розовый'},
  {r:52, g:199,b:89, a2:'0,199,190',  name:'Зелёный'},
  {r:255,g:149,b:0,  a2:'255,59,48',  name:'Оранжевый'},
  {r:50, g:173,b:230,a2:'0,122,255',  name:'Голубой'},
];

let selGroup = null;
let selWeek  = 'odd';  // 'odd' | 'even'
let dark     = false;
let cpOpen   = false;

// ── Shortcuts ────────────────────────────────────────
const $  = id => document.getElementById(id);
const R  = document.documentElement.style;

function sp(k,v){ R.setProperty(k,v) }

function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }

function bounce(el){
  el.style.transition='transform .32s cubic-bezier(.34,1.56,.64,1)';
  el.style.transform='scale(.82)';
  setTimeout(()=>{ el.style.transform=''; },240);
}

// ── Theme ─────────────────────────────────────────────
function setDark(v){
  dark=v;
  document.body.toggleAttribute('data-dark',dark);
  $('btn-theme').innerHTML = dark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
  ls('dark', dark?'1':'0');
}

$('btn-theme').onclick = function(){ setDark(!dark); bounce(this); };

// ── Accent ────────────────────────────────────────────
function applyAccent(c){
  sp('--a',`${c.r},${c.g},${c.b}`);
  sp('--a2',c.a2);
}

const swBox = $('swatches');
ACCENTS.forEach((c,i)=>{
  const el = document.createElement('div');
  el.className = 'sw g';
  el.style.background = `rgb(${c.r},${c.g},${c.b})`;
  el.style.boxShadow = `0 4px 12px rgba(${c.r},${c.g},${c.b},.5)`;
  el.title = c.name;
  el.onclick = ()=>{
    document.querySelectorAll('.sw').forEach(s=>s.classList.remove('on'));
    el.classList.add('on');
    applyAccent(c);
    ls('accent',String(i));
    bounce(el);
  };
  swBox.appendChild(el);
});

$('btn-color').onclick = function(e){
  e.stopPropagation();
  cpOpen = !cpOpen;
  $('cpanel').classList.toggle('open',cpOpen);
  bounce(this);
};
document.addEventListener('click',()=>{ cpOpen=false; $('cpanel').classList.remove('open'); });
$('cpanel').addEventListener('click',e=>e.stopPropagation());

// ── Navigation ────────────────────────────────────────
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  document.querySelectorAll('.db').forEach(b=>b.classList.remove('on'));
  $(id).classList.add('on');
  document.querySelector(`.db[data-v="${id}"]`)?.classList.add('on');
}
document.querySelectorAll('.db').forEach(b=>{
  b.onclick = ()=>{ showView(b.dataset.v); bounce(b); };
});

// ── Groups ────────────────────────────────────────────
function buildGroups(){
  const wrap = $('groups-wrap');
  wrap.innerHTML='';

  // Group by dept
  const byDept = {};
  D.groups.forEach(g=>{
    if(!byDept[g.dept]) byDept[g.dept]=[];
    byDept[g.dept].push(g);
  });

  Object.entries(byDept).forEach(([dept,gs])=>{
    const sec = document.createElement('div');
    sec.className = 'dept-section';
    sec.innerHTML = `<div class="dept-label">${dept}</div><div class="group-row" id="gr-${dept}"></div>`;
    wrap.appendChild(sec);

    const row = sec.querySelector('.group-row');
    gs.forEach(g=>{
      const btn = document.createElement('button');
      btn.className = 'gcard g';
      btn.textContent = g.num;
      btn.dataset.id = g.id;
      btn.onclick = ()=>{ selectGroup(g.id, btn); };
      row.appendChild(btn);
    });
  });
}

function selectGroup(id, btnEl){
  document.querySelectorAll('.gcard').forEach(c=>c.classList.remove('on'));
  btnEl.classList.add('on');
  selGroup = id;
  ls('group', id);
  ls('view', 'view-sched');
  showView('view-sched');
  renderSchedule();
  bounce(btnEl);
}

// ── Week toggle ───────────────────────────────────────
document.querySelectorAll('.wt').forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll('.wt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    selWeek = b.dataset.w;
    ls('week',selWeek);
    if(selGroup) renderSchedule();
    bounce(b);
  };
});

// ── Render Schedule ───────────────────────────────────
function renderSchedule(){
  const cont = $('sched-out');
  if(!selGroup){
    cont.innerHTML = `<div class="empty"><span class="empty-icon">📅</span>Выбери группу</div>`;
    return;
  }

  const gSched = D.schedule[selGroup];
  if(!gSched){
    cont.innerHTML = `<div class="empty"><span class="empty-icon">🤔</span>Нет данных</div>`;
    return;
  }

  const g = D.groups.find(x=>x.id===selGroup);
  $('sched-title').textContent = g ? `${g.num} · ${g.dept}` : '';

  let html = '';
  let hasAny = false;

  for(const day of DAYS){
    const slots = gSched[day];
    if(!slots?.length) continue;

    // Filter slots
    const visible = slots.map(s=>{
      const lessons = selWeek==='odd' ? s.odd : s.even;
      return {...s, lessons};
    }).filter(s=>s.lessons.length>0);

    if(!visible.length) continue;
    hasAny = true;

    html += `<div class="day-sec"><div class="day-head"><div class="day-pill">${day}</div></div>`;

    for(const slot of visible){
      const tp = slot.time.replace(/\s*-\s*/,'\n').split('\n');
      const t1 = (tp[0]||'').trim();
      const t2 = (tp[1]||'').trim();

      html += `<div class="lcard g"><div class="ltime"><div class="lnum">${slot.para}</div><div class="lt">${esc(t1)}<br>${esc(t2)}</div></div><div class="lbody">`;

      slot.lessons.forEach(l=>{
        const ttag = TYPE_TAG[l.type]||'tt-l';
        const tword = TYPE_WORD[l.type]||l.type;
        const weekWord = selWeek==='odd'?'Нечётная':'Чётная';

        html += `<div class="li">
          <div class="ltags">
            <span class="tag tw">${weekWord}</span>
            <span class="tag ${ttag}">${tword}</span>
          </div>
          <div class="lname">${esc(l.subject)}</div>
          ${l.teacher?`<div class="lteacher"><i class="fa-solid fa-user-tie" style="font-size:11px;opacity:.5"></i> ${esc(l.teacher)}</div>`:''}
          ${l.room?`<div class="lroom"><i class="fa-solid fa-location-dot" style="font-size:11px;opacity:.5"></i> ${esc(l.room)}</div>`:''}
          ${l.note?`<div class="lnote">${esc(l.note)}</div>`:''}
        </div>`;
      });

      html += `</div></div>`;
    }
    html += `</div>`;
  }

  cont.innerHTML = hasAny ? html : `<div class="empty"><span class="empty-icon">🎉</span>В эту неделю занятий нет</div>`;
}

// ── Search ────────────────────────────────────────────
$('sinput').oninput = function(){
  const q = this.value.trim().toLowerCase();
  const res = $('search-out');

  if(q.length < 2){
    res.innerHTML = `<div class="empty"><span class="empty-icon">🔍</span>Начни вводить...</div>`;
    return;
  }

  const hits=[];
  for(const g of D.groups){
    const gSched = D.schedule[g.id];
    if(!gSched) continue;
    for(const day of DAYS){
      const slots = gSched[day]||[];
      for(const slot of slots){
        for(const wk of ['odd','even']){
          for(const l of slot[wk]){
            if([l.subject,l.teacher,l.room].join(' ').toLowerCase().includes(q)){
              hits.push({g,day,slot,l,wk});
            }
          }
        }
      }
    }
  }

  if(!hits.length){
    res.innerHTML=`<div class="empty"><span class="empty-icon">😔</span>Ничего не найдено</div>`;
    return;
  }

  const deduped = hits.slice(0,80);
  let html=`<div class="lbl">${deduped.length} результатов</div>`;
  deduped.forEach(h=>{
    const ttag=TYPE_TAG[h.l.type]||'tt-l';
    html+=`<div class="lcard g" style="margin-bottom:8px">
      <div class="ltime"><div class="lnum">${h.slot.para}</div><div class="lt" style="font-size:7px;word-break:break-all">${h.g.num}</div></div>
      <div class="lbody"><div class="li">
        <div class="ltags">
          <span class="tag tw">${h.wk==='odd'?'Нечёт':'Чёт'}</span>
          <span class="tag ${ttag}">${TYPE_WORD[h.l.type]||h.l.type}</span>
          <span style="font-size:10px;color:var(--t3);font-weight:700">${h.day}</span>
        </div>
        <div class="lname">${esc(h.l.subject)}</div>
        ${h.l.teacher?`<div class="lteacher"><i class="fa-solid fa-user-tie" style="font-size:11px;opacity:.5"></i> ${esc(h.l.teacher)}</div>`:''}
        ${h.l.room?`<div class="lroom"><i class="fa-solid fa-location-dot" style="font-size:11px;opacity:.5"></i> ${esc(h.l.room)}</div>`:''}
      </div></div></div>`;
  });
  res.innerHTML=html;
};

// ── localStorage helpers ──────────────────────────────
function ls(k,v){ try{ localStorage.setItem('sched_'+k,v); }catch(e){} }
function lg(k){   try{ return localStorage.getItem('sched_'+k); }catch(e){ return null; } }

// ── Init ──────────────────────────────────────────────
(function init(){
  // Restore dark
  if(lg('dark')==='1') setDark(true);

  // Restore accent
  const ai = parseInt(lg('accent')||'0');
  const ac = ACCENTS[ai] || ACCENTS[0];
  applyAccent(ac);
  // Mark swatch after DOM ready
  setTimeout(()=>{
    const sw = swBox.querySelectorAll('.sw');
    sw.forEach(s=>s.classList.remove('on'));
    if(sw[ai]) sw[ai].classList.add('on');
  },0);

  // Restore week
  const savedWeek = lg('week');
  if(savedWeek==='even'){
    selWeek='even';
    document.querySelectorAll('.wt').forEach(b=>{
      b.classList.toggle('on', b.dataset.w==='even');
    });
  }

  buildGroups();

  // Restore group & view
  const savedGroup = lg('group');
  const savedView  = lg('view') || 'view-home';

  if(savedGroup){
    // Find the button and activate
    const btn = document.querySelector(`.gcard[data-id="${CSS.escape(savedGroup)}"]`);
    if(btn){
      selGroup = savedGroup;
      btn.classList.add('on');
      renderSchedule();
      // Show schedule view directly
      showView('view-sched');
      return;
    }
  }

  showView(savedView);
})();

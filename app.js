/* Расписание пар ИИЭСМ — © 2025 @dev25 */
'use strict';

const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const DS   = {Понедельник:'Пн',Вторник:'Вт',Среда:'Ср',Четверг:'Чт',Пятница:'Пт',Суббота:'Сб'};
const TTAG = {лек:'tt-l', пр:'tt-p', лаб:'tt-b'};
const TWRD = {лек:'Лекция', пр:'Практика', лаб:'Лаб'};
const ACCENTS = [
  {r:0,  g:122,b:255, name:'Синий'},
  {r:88, g:86, b:214, name:'Фиолет'},
  {r:255,g:45, b:85,  name:'Розовый'},
  {r:52, g:199,b:89,  name:'Зелёный'},
  {r:255,g:149,b:0,   name:'Оранж'},
  {r:50, g:173,b:230, name:'Голубой'},
];

let selGroup=null, selWeek='odd', selDay=null, dark=false, cpOpen=false;

const $=id=>document.getElementById(id);
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ls(k,v){try{localStorage.setItem('sp4_'+k,v)}catch(e){}}
function lg(k){try{return localStorage.getItem('sp4_'+k)}catch(e){return null}}
function bounce(el){if(!el)return;el.style.transform='scale(.82)';setTimeout(()=>{el.style.transform=''},200)}

// ── Theme ─────────────────────────────────────────
function setDark(v){
  dark=v;
  document.body.toggleAttribute('data-dark',dark);
  $('btn-theme').querySelector('i').className=dark?'fa-solid fa-sun':'fa-solid fa-moon';
  ls('dark',dark?'1':'0');
}
$('btn-theme').onclick=function(){setDark(!dark);bounce(this)};

// ── Accent ────────────────────────────────────────
function applyAccent(c){
  document.documentElement.style.setProperty('--acc',`${c.r},${c.g},${c.b}`);
}
const swBox=$('swatches');
ACCENTS.forEach((c,i)=>{
  const el=document.createElement('button');
  el.className='sw g';
  el.style.cssText=`background:rgb(${c.r},${c.g},${c.b});box-shadow:0 3px 10px rgba(${c.r},${c.g},${c.b},.5)`;
  el.title=c.name;
  el.onclick=()=>{
    swBox.querySelectorAll('.sw').forEach(s=>s.classList.remove('on'));
    el.classList.add('on');applyAccent(c);ls('acc',String(i));bounce(el);
  };
  swBox.appendChild(el);
});
$('btn-color').onclick=function(e){
  e.stopPropagation();cpOpen=!cpOpen;$('cpanel').classList.toggle('open',cpOpen);bounce(this);
};
document.addEventListener('click',()=>{cpOpen=false;$('cpanel').classList.remove('open')});
$('cpanel').addEventListener('click',e=>e.stopPropagation());

// ── Nav ───────────────────────────────────────────
function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  document.querySelectorAll('.db').forEach(b=>b.classList.remove('on'));
  $(id).classList.add('on');
  const db=document.querySelector(`.db[data-v="${id}"]`);
  if(db)db.classList.add('on');
  $('page').scrollTop=0;
  ls('view',id);
  // back button only on schedule view when group selected
  const showBack=(id==='view-sched'&&selGroup);
  $('btn-back').style.display=showBack?'flex':'none';
  $('nav-title').textContent=id==='view-sched'&&selGroup?getGroupLabel():'Расписание пар';
}
function getGroupLabel(){
  const g=D.groups.find(x=>x.id===selGroup);
  return g?`${g.num} · ${g.dept}`:'Расписание';
}
function goHome(){
  showView('view-home');
}
document.querySelectorAll('.db').forEach(b=>{
  b.onclick=()=>{showView(b.dataset.v);bounce(b)};
});

// ── Groups ────────────────────────────────────────
function buildGroups(){
  const wrap=$('groups-wrap');wrap.innerHTML='';
  const byDept={};
  D.groups.forEach(g=>{(byDept[g.dept]||(byDept[g.dept]=[])).push(g)});
  Object.entries(byDept).forEach(([dept,gs])=>{
    const sec=document.createElement('div');
    sec.className='dept-sec';
    sec.innerHTML=`<div class="dept-lbl">${esc(dept)}</div><div class="group-row"></div>`;
    const row=sec.querySelector('.group-row');
    gs.forEach(g=>{
      const btn=document.createElement('button');
      btn.className='gcard g';btn.textContent=g.num;btn.dataset.id=g.id;
      btn.onclick=()=>{selectGroup(g.id,btn);bounce(btn)};
      row.appendChild(btn);
    });
    wrap.appendChild(sec);
  });
}

function selectGroup(id,btnEl){
  document.querySelectorAll('.gcard').forEach(c=>c.classList.remove('on'));
  btnEl.classList.add('on');selGroup=id;ls('group',id);
  // pick first available day
  const gSched=D.schedule[id]||{};
  const avail=DAYS.filter(d=>(gSched[d]||[]).some(s=>s[selWeek]?.length));
  selDay=avail[0]||null;ls('day',selDay||'');
  buildDayTabs();renderSchedule();
  showView('view-sched');
}

// ── Week toggle ───────────────────────────────────
document.querySelectorAll('.wt').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.wt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');selWeek=b.dataset.w;ls('week',selWeek);
    if(selGroup){
      // keep day if still valid, else pick first available
      const gSched=D.schedule[selGroup]||{};
      const avail=DAYS.filter(d=>(gSched[d]||[]).some(s=>s[selWeek]?.length));
      if(!avail.includes(selDay))selDay=avail[0]||null;
      buildDayTabs();renderSchedule();
    }
    bounce(b);
  };
});

// ── Day tabs ──────────────────────────────────────
function buildDayTabs(){
  const bar=$('day-tabs');bar.innerHTML='';
  if(!selGroup)return;
  const gSched=D.schedule[selGroup]||{};
  DAYS.forEach(day=>{
    const hasLessons=(gSched[day]||[]).some(s=>s[selWeek]?.length);
    if(!hasLessons)return;
    const btn=document.createElement('button');
    btn.className='daytab'+(day===selDay?' on':'');
    btn.textContent=DS[day]||day;btn.dataset.day=day;
    btn.title=day;
    btn.onclick=()=>{
      document.querySelectorAll('.daytab').forEach(t=>t.classList.remove('on'));
      btn.classList.add('on');selDay=day;ls('day',day);
      renderSchedule();bounce(btn);
      $('page').scrollTop=0;
    };
    bar.appendChild(btn);
  });
}

// ── Render schedule ───────────────────────────────
function renderSchedule(){
  const cont=$('sched-out');
  if(!selGroup||!selDay){
    cont.innerHTML=`<div class="empty"><div class="empty-ico">📅</div>Выбери группу в разделе «Группы»</div>`;
    return;
  }
  const gSched=D.schedule[selGroup];
  const slots=(gSched?.[selDay]||[]).filter(s=>s[selWeek]?.length);
  if(!slots.length){
    cont.innerHTML=`<div class="empty"><div class="empty-ico">🎉</div>В ${selDay} занятий нет</div>`;
    return;
  }
  let html='';
  slots.forEach((slot,si)=>{
    const t=slot.time||'';
    const [t1,t2]=(t.includes('–')?t.split('–'):[t,'']).map(x=>x.trim());
    html+=`<div class="lcard g" style="animation-delay:${si*35}ms">
      <div class="ltime">
        <div class="lnum">${slot.para}</div>
        <div class="ltm">${esc(t1)}<br>${esc(t2)}</div>
      </div>
      <div class="lbody">`;
    (slot[selWeek]||[]).forEach(l=>{
      html+=`<div class="li">
        <div class="ltags"><span class="tag ${TTAG[l.type]||'tt-l'}">${TWRD[l.type]||l.type}</span></div>
        <div class="lname">${esc(l.subject)}</div>
        ${l.teacher?`<div class="lmeta"><i class="fa-solid fa-user-tie lico"></i>${esc(l.teacher)}</div>`:''}
        ${l.room?`<div class="lmeta"><i class="fa-solid fa-door-open lico"></i>${esc(l.room)}</div>`:''}
        ${l.note?`<div class="lnote">${esc(l.note)}</div>`:''}
      </div>`;
    });
    html+=`</div></div>`;
  });
  cont.innerHTML=html;
}

// ── Search ────────────────────────────────────────
$('sinput').oninput=function(){
  const q=this.value.trim().toLowerCase();
  const res=$('search-out');
  if(q.length<2){
    res.innerHTML=`<div class="empty"><div class="empty-ico" style="font-size:38px">🔍</div>Начни вводить...</div>`;
    return;
  }
  const hits=[];
  for(const g of D.groups){
    const gs=D.schedule[g.id];if(!gs)continue;
    for(const day of DAYS){
      for(const slot of(gs[day]||[])){
        for(const wk of['odd','even']){
          for(const l of(slot[wk]||[])){
            if([l.subject,l.teacher,l.room].join(' ').toLowerCase().includes(q)){
              hits.push({g,day,slot,l,wk});
            }
          }
        }
      }
    }
  }
  if(!hits.length){res.innerHTML=`<div class="empty"><div class="empty-ico" style="font-size:38px">😔</div>Ничего не найдено</div>`;return;}
  let html=`<div class="res-lbl">${hits.length} результатов</div>`;
  hits.slice(0,80).forEach(h=>{
    html+=`<div class="lcard g" style="margin-bottom:8px">
      <div class="ltime">
        <div class="lnum">${h.slot.para}</div>
        <div class="ltm">${esc(h.g.num)}<br>${DS[h.day]||h.day}</div>
      </div>
      <div class="lbody"><div class="li">
        <div class="ltags">
          <span class="tag tw" style="background:rgba(var(--acc),.12);color:rgba(var(--acc),1)">${h.wk==='odd'?'Нечёт':'Чёт'}</span>
          <span class="tag ${TTAG[h.l.type]||'tt-l'}">${TWRD[h.l.type]||h.l.type}</span>
        </div>
        <div class="lname">${esc(h.l.subject)}</div>
        ${h.l.teacher?`<div class="lmeta"><i class="fa-solid fa-user-tie lico"></i>${esc(h.l.teacher)}</div>`:''}
        ${h.l.room?`<div class="lmeta"><i class="fa-solid fa-door-open lico"></i>${esc(h.l.room)}</div>`:''}
      </div></div></div>`;
  });
  res.innerHTML=html;
};

// ── Init ──────────────────────────────────────────
(function init(){
  // PWA service worker
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }

  // Dark
  if(lg('dark')==='1')setDark(true);

  // Accent
  const ai=Math.min(parseInt(lg('acc')||'0'),ACCENTS.length-1);
  applyAccent(ACCENTS[isNaN(ai)?0:ai]);
  setTimeout(()=>{
    swBox.querySelectorAll('.sw').forEach((s,i)=>s.classList.toggle('on',i===ai));
  },0);

  // Week
  if(lg('week')==='even'){
    selWeek='even';
    document.querySelectorAll('.wt').forEach(b=>b.classList.toggle('on',b.dataset.w==='even'));
  }

  buildGroups();

  // Restore group + day
  const savedGroup=lg('group');
  const savedDay=lg('day');

  if(savedGroup){
    const btn=document.querySelector(`.gcard[data-id="${CSS.escape(savedGroup)}"]`);
    if(btn){
      document.querySelectorAll('.gcard').forEach(c=>c.classList.remove('on'));
      btn.classList.add('on');selGroup=savedGroup;
      buildDayTabs();
      // Try restoring saved day
      if(savedDay&&document.querySelector(`.daytab[data-day="${savedDay}"]`)){
        selDay=savedDay;
        document.querySelectorAll('.daytab').forEach(t=>t.classList.toggle('on',t.dataset.day===savedDay));
      } else {
        const first=document.querySelector('.daytab');
        if(first){selDay=first.dataset.day;first.classList.add('on');}
      }
      renderSchedule();
      showView('view-sched');
      return;
    }
  }

  showView('view-home');
})();

// ── Google Sheets live update ──────────────────────────
// Если расписание загрузилось из Sheets уже после рендера — обновляем UI
window._scheduleLoaded = function() {
  // Перестраиваем список групп
  buildGroups();
  // Если была выбрана группа — перерисовываем расписание
  if (selGroup && D.schedule[selGroup]) {
    buildDayTabs();
    if (selDay) renderSchedule();
  }
};

function buildGroups() {
  const cont = $('groups');
  if (!cont) return;
  // Сохраняем текущий скролл
  const prevScroll = cont.scrollTop;
  // Перерисовываем только если структура изменилась
  const byDept = {};
  D.groups.forEach(g => { (byDept[g.dept] || (byDept[g.dept] = [])).push(g); });
  cont.scrollTop = prevScroll;
}

/* Расписание пар ИИЭСМ — © 2025 @dev25 */
'use strict';

const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const DAYS_SHORT = {Понедельник:'Пн',Вторник:'Вт',Среда:'Ср',Четверг:'Чт',Пятница:'Пт',Суббота:'Сб'};
const TYPE_TAG  = {лек:'tt-l', пр:'tt-p', лаб:'tt-b'};
const TYPE_WORD = {лек:'Лекция', пр:'Практика', лаб:'Лаб'};
const ACCENTS = [
  {r:0,  g:122,b:255, a2:'88,86,214',  name:'Синий'},
  {r:88, g:86, b:214, a2:'175,82,222', name:'Фиолет'},
  {r:255,g:45, b:85,  a2:'255,149,0',  name:'Розовый'},
  {r:52, g:199,b:89,  a2:'0,199,190',  name:'Зелёный'},
  {r:255,g:149,b:0,   a2:'255,59,48',  name:'Оранж'},
  {r:50, g:173,b:230, a2:'0,122,255',  name:'Голубой'},
];

let selGroup=null, selWeek='odd', selDay=null, dark=false, cpOpen=false;

const $=id=>document.getElementById(id);
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ls(k,v){try{localStorage.setItem('sp_'+k,v)}catch(e){}}
function lg(k){try{return localStorage.getItem('sp_'+k)}catch(e){return null}}
function bounce(el){if(!el)return;el.style.transform='scale(.85)';setTimeout(()=>{el.style.transform=''},220)}

function setDark(v){
  dark=v;document.body.toggleAttribute('data-dark',dark);
  $('btn-theme').querySelector('i').className=dark?'fa-solid fa-sun':'fa-solid fa-moon';
  ls('dark',dark?'1':'0');
}
$('btn-theme').onclick=function(){setDark(!dark);bounce(this)};

function applyAccent(c){
  document.documentElement.style.setProperty('--a',`${c.r},${c.g},${c.b}`);
  document.documentElement.style.setProperty('--a2',c.a2);
}
const swBox=$('swatches');
ACCENTS.forEach((c,i)=>{
  const el=document.createElement('div');
  el.className='sw g';
  el.style.cssText=`background:rgb(${c.r},${c.g},${c.b});box-shadow:0 4px 12px rgba(${c.r},${c.g},${c.b},.5)`;
  el.title=c.name;
  el.onclick=()=>{swBox.querySelectorAll('.sw').forEach(s=>s.classList.remove('on'));el.classList.add('on');applyAccent(c);ls('accent',String(i));bounce(el)};
  swBox.appendChild(el);
});
$('btn-color').onclick=function(e){e.stopPropagation();cpOpen=!cpOpen;$('cpanel').classList.toggle('open',cpOpen);bounce(this)};
document.addEventListener('click',()=>{cpOpen=false;$('cpanel').classList.remove('open')});
$('cpanel').addEventListener('click',e=>e.stopPropagation());

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));
  document.querySelectorAll('.db').forEach(b=>b.classList.remove('on'));
  $(id).classList.add('on');
  document.querySelector(`.db[data-v="${id}"]`)?.classList.add('on');
  ls('view',id);
}
document.querySelectorAll('.db').forEach(b=>{b.onclick=()=>{showView(b.dataset.v);bounce(b)}});

function buildGroups(){
  const wrap=$('groups-wrap');wrap.innerHTML='';
  const byDept={};
  D.groups.forEach(g=>{(byDept[g.dept]||(byDept[g.dept]=[])).push(g)});
  Object.entries(byDept).forEach(([dept,gs])=>{
    const sec=document.createElement('div');
    sec.className='dept-sec';
    sec.innerHTML=`<div class="dept-lbl">${dept}</div><div class="group-row"></div>`;
    gs.forEach(g=>{
      const btn=document.createElement('button');
      btn.className='gcard g';btn.textContent=g.num;btn.dataset.id=g.id;
      btn.onclick=()=>{selectGroup(g.id,btn);bounce(btn)};
      sec.querySelector('.group-row').appendChild(btn);
    });
    wrap.appendChild(sec);
  });
}

function selectGroup(id,btnEl){
  document.querySelectorAll('.gcard').forEach(c=>c.classList.remove('on'));
  btnEl.classList.add('on');selGroup=id;ls('group',id);
  const gSched=D.schedule[id]||{};
  const avail=DAYS.filter(d=>(gSched[d]||[]).some(s=>s[selWeek]?.length>0));
  selDay=avail[0]||DAYS[0];ls('day',selDay);
  const g=D.groups.find(x=>x.id===id);
  $('sched-title').textContent=g?`${g.num} · ${g.dept}`:'';
  buildDayTabs();renderSchedule();showView('view-sched');
}

document.querySelectorAll('.wt').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.wt').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');selWeek=b.dataset.w;ls('week',selWeek);
    if(selGroup){
      const gSched=D.schedule[selGroup]||{};
      const avail=DAYS.filter(d=>(gSched[d]||[]).some(s=>s[selWeek]?.length>0));
      if(!avail.includes(selDay))selDay=avail[0]||selDay;
      buildDayTabs();renderSchedule();
    }
    bounce(b);
  };
});

function buildDayTabs(){
  const bar=$('day-tabs');bar.innerHTML='';
  if(!selGroup)return;
  const gSched=D.schedule[selGroup]||{};
  DAYS.forEach(day=>{
    if(!(gSched[day]||[]).some(s=>s[selWeek]?.length>0))return;
    const btn=document.createElement('button');
    btn.className='daytab'+(day===selDay?' on':'');
    btn.textContent=DAYS_SHORT[day];btn.dataset.day=day;
    btn.onclick=()=>{
      document.querySelectorAll('.daytab').forEach(t=>t.classList.remove('on'));
      btn.classList.add('on');selDay=day;ls('day',day);renderSchedule();bounce(btn);
    };
    bar.appendChild(btn);
  });
}

function renderSchedule(){
  const cont=$('sched-out');
  if(!selGroup){cont.innerHTML=`<div class="empty"><span class="empty-icon">📅</span>Выбери группу</div>`;return}
  const gSched=D.schedule[selGroup];
  const slots=(gSched?.[selDay]||[]).filter(s=>s[selWeek]?.length>0);
  if(!slots.length){cont.innerHTML=`<div class="empty"><span class="empty-icon">🎉</span>Занятий нет</div>`;return}
  let html='';
  slots.forEach((slot,si)=>{
    html+=`<div class="lcard g" style="animation-delay:${si*40}ms">
      <div class="ltime"><div class="lnum">${slot.para}</div><div class="lt">${esc(slot.time.replace('–','<br>'))}</div></div>
      <div class="lbody">`;
    (slot[selWeek]||[]).forEach(l=>{
      html+=`<div class="li">
        <div class="ltags"><span class="tag ${TYPE_TAG[l.type]||'tt-l'}">${TYPE_WORD[l.type]||l.type}</span></div>
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

$('sinput').oninput=function(){
  const q=this.value.trim().toLowerCase();
  const res=$('search-out');
  if(q.length<2){res.innerHTML=`<div class="empty"><span class="empty-icon" style="font-size:36px">🔍</span>Начни вводить...</div>`;return}
  const hits=[];
  for(const g of D.groups){
    const gs=D.schedule[g.id];if(!gs)continue;
    for(const day of DAYS){
      for(const slot of(gs[day]||[])){
        for(const wk of['odd','even']){
          for(const l of(slot[wk]||[])){
            if([l.subject,l.teacher,l.room].join(' ').toLowerCase().includes(q))
              hits.push({g,day,slot,l,wk});
          }
        }
      }
    }
  }
  if(!hits.length){res.innerHTML=`<div class="empty"><span class="empty-icon" style="font-size:36px">😔</span>Ничего не найдено</div>`;return}
  let html=`<div class="lbl">${hits.length} результатов</div>`;
  hits.slice(0,60).forEach(h=>{
    html+=`<div class="lcard g" style="margin-bottom:8px">
      <div class="ltime"><div class="lnum">${h.slot.para}</div><div class="lt" style="font-size:7.5px">${esc(h.g.num)}<br>${DAYS_SHORT[h.day]||h.day}</div></div>
      <div class="lbody"><div class="li">
        <div class="ltags"><span class="tag tw">${h.wk==='odd'?'Нечёт':'Чёт'}</span><span class="tag ${TYPE_TAG[h.l.type]||'tt-l'}">${TYPE_WORD[h.l.type]||h.l.type}</span></div>
        <div class="lname">${esc(h.l.subject)}</div>
        ${h.l.teacher?`<div class="lmeta"><i class="fa-solid fa-user-tie lico"></i>${esc(h.l.teacher)}</div>`:''}
        ${h.l.room?`<div class="lmeta"><i class="fa-solid fa-door-open lico"></i>${esc(h.l.room)}</div>`:''}
      </div></div></div>`;
  });
  res.innerHTML=html;
};

(function init(){
  if(lg('dark')==='1')setDark(true);
  const ai=parseInt(lg('accent')||'0');
  applyAccent(ACCENTS[isNaN(ai)?0:Math.min(ai,ACCENTS.length-1)]);
  setTimeout(()=>swBox.querySelectorAll('.sw').forEach((s,i)=>s.classList.toggle('on',i===ai)),0);
  const sw=lg('week');
  if(sw==='even'){selWeek='even';document.querySelectorAll('.wt').forEach(b=>b.classList.toggle('on',b.dataset.w==='even'))}
  buildGroups();
  const savedGroup=lg('group'),savedDay=lg('day');
  if(savedGroup){
    const btn=document.querySelector(`.gcard[data-id="${CSS.escape(savedGroup)}"]`);
    if(btn){
      document.querySelectorAll('.gcard').forEach(c=>c.classList.remove('on'));
      btn.classList.add('on');selGroup=savedGroup;
      const g=D.groups.find(x=>x.id===savedGroup);
      $('sched-title').textContent=g?`${g.num} · ${g.dept}`:'';
      buildDayTabs();
      if(savedDay&&document.querySelector(`.daytab[data-day="${savedDay}"]`)){
        selDay=savedDay;
        document.querySelectorAll('.daytab').forEach(t=>t.classList.toggle('on',t.dataset.day===savedDay));
      } else {
        const first=document.querySelector('.daytab');
        if(first){selDay=first.dataset.day;first.classList.add('on')}
      }
      renderSchedule();showView('view-sched');return;
    }
  }
  showView('view-home');
})();

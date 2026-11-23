/* Time Machine (shared, Nov 18 2026): the Time Machine Kepler built for Planetary Tables (Nov 15-16), made global for every
   World and app (Gemini, Nov 18). The bar follows the layout Gemini helped design for Astro Gold:
     Now · date · ◀ run back · |◀ step back · ■ stop · ▶| step forward · ▶ run forward · step size · Star Target
   The Star Target (Gemini, Nov 16; the astrolabe is saved for a future Astrolabe app) opens Step Chart to Event.

   window.EATime
     UNITS            [[key, name, ms or 0 for calendar units]]: Second, Minute, Hour, Day, Week, Month, Year, Decade, Century
     step(ms, n, unit) the moment n units later (months and up keep the calendar day and clock time)
     unitName(n, unit) '1 Day', '3 Days'
     speeds({crawl, slow, run})  [[name, seconds for one cycle, multiplier for a pattern of cycles]]: Crawl, Walk, Slow, Medium, Fast, Run.
                      Defaults Crawl 120 s (very slow, for teaching), Slow 30 s, Run 6 s (Gemini, Nov 16); Walk sits evenly between Crawl
                      and Slow, Medium and Fast between Slow and Run. Patterns (Mercury 3, Venus 5) take 3x at Crawl, 1.5x from Slow on.
     STAR_TARGET      the Star Target icon (SVG string)
     TABS, LUNATIONS, ASPECTS, KINDS_FROM, KINDS_TO   Step Chart to Event data
     find(spec, ctx, t0, dir)  search engine. ctx = {lon(planet, jd) -> ecliptic longitude, moonLat(jd)? , natal:{jd, cusps}?}
                      spec = {tab:'asp'|'rd'|'ing'|'pos'|'house'|'ret'|'lun', ...fields as in the panel}; returns {jd, label, ring} or {jd:null, msg}
     events({anchor, ctx, getMs, go, natal, title})   opens the Step Chart to Event panel beside anchor. Prev and Next search from getMs();
                      go(ms, label, ring) moves the app's chart (ring: 'tr' | 'pr' | 'sa', which wheel moved). X, Escape, or a click outside closes it.
     close()          closes the panel
     lunar            lunation arrows: syz(ms, dir), eclipse(jd, full), icon(t, size) (see below) */
(function(){
const UNITS=[['s','Second',1e3],['mi','Minute',6e4],['h','Hour',36e5],['d','Day',864e5],['w','Week',6048e5],['mo','Month',0],['y','Year',0],['de','Decade',0],['c','Century',0]];
const MON={mo:1,y:12,de:120,c:1200};
function step(ms,n,u){const U=UNITS.find(x=>x[0]===u||x[1]===u)||UNITS[3];if(U[2])return ms+n*U[2];const d=new Date(ms),day=d.getDate();
 d.setDate(1);d.setMonth(d.getMonth()+Math.round(n*MON[U[0]]));const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d.getTime()}
const unitName=(n,u)=>{const U=UNITS.find(x=>x[0]===u||x[1]===u)||UNITS[3];return `${n} ${U[1]}${+n===1?'':U[1]==='Century'?'':'s'}`.replace(/Century$/,+n===1?'Century':'Centuries')};
const SPN=['Crawl','Walk','Slow','Medium','Fast','Run'];
function speeds(o){o=o||{};const a=Math.max(2,+o.crawl||120),b=Math.max(1,Math.min(a,+o.slow||30)),c=Math.max(.5,Math.min(b,+o.run||6));
 return SPN.map((n,i)=>[n,i<=2?a*Math.pow(b/a,i/2):b*Math.pow(c/b,(i-2)/3),i<=2?3*Math.pow(.5,i/2):1.5])}
const STAR_TARGET='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M12 8.2l1.1 2.5 2.7.3-2 1.8.6 2.7-2.4-1.4-2.4 1.4.6-2.7-2-1.8 2.7-.3z" fill="currentColor" stroke-width="1"/></svg>';
const TABS=[['asp','Aspect'],['rd','R/D'],['ing','Ing'],['pos','Pos'],['house','House'],['ret','Return'],['lun','Lun/Ecl']];
const LUNATIONS=[['new','New Moon'],['fq','First Quarter Moon'],['full','Full Moon'],['lq','Last Quarter Moon'],['eclipse','Any Eclipse'],['seclipse','Solar Eclipse'],['leclipse','Lunar Eclipse']];
const ASPECTS=[['Conjunction',0],['Opposition',180],['Square',90],['Trine',120],['Sextile',60],['Quincunx',150],['Semisextile',30],['Semisquare',45],['Sesquiquadrate',135]];
const KINDS_FROM=[['T','Transiting'],['P','Progressed'],['S','Solar Arc']],KINDS_TO=[['R','Natal'],['T','Transiting'],['P','Progressed'],['S','Solar Arc']],RING={T:'tr',P:'pr',S:'sa'};
const PL=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'],SGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SPD={Moon:.05,Sun:.5,Mercury:.5,Venus:.5,Mars:.5,Jupiter:1,Saturn:1,Uranus:2,Neptune:2,Pluto:2},Y=365.2422;
const e180=x=>((x%360)+540)%360-180,e360=x=>((x%360)+360)%360;
/* first sign change of f from t0 in direction dir, sampled every st days up to span days, then bisected */
function seek(f,st,span,t0,dir,jump){let x0=t0+dir*1e-3,f0=f(x0);for(let n=1;n*st<=span;n++){const x1=t0+dir*n*st,f1=f(x1);
 if((f0<=0)!==(f1<=0)&&Math.abs(f0-f1)<jump){let lo=x0,fl=f0,hi=x1;for(let i=0;i<50;i++){const m=(lo+hi)/2,fm=f(m);if((fm<=0)===(fl<=0)){lo=m;fl=fm}else hi=m}return {t:(lo+hi)/2,up:dir>0?f1>f0:f0>f1}}x0=x1;f0=f1}return null}
function lunation(k,ctx,t0,dir){const L=ctx.lon,lat=ctx.moonLat||(t=>5.145*Math.sin((L('Moon',t)-L('Node',t))*Math.PI/180));
 if(k==='eclipse'){const a=lunation('seclipse',ctx,t0,dir),b=lunation('leclipse',ctx,t0,dir),sol=b==null||(a!=null&&(dir>0?a<=b:a>=b));return sol?a:b}
 const g=k==='new'||k==='seclipse'?0:k==='fq'?90:k==='lq'?270:180,f=t=>e180(L('Moon',t)-L('Sun',t)-g);
 for(let i=0;i<300;i++){const r=seek(f,.25,40,t0,dir,90);if(!r)return null;if(!/eclipse/.test(k)||Math.abs(lat(r.t))<1.55)return r.t;t0=r.t}return null}
function station(p,w,ctx,t0,dir){const L=ctx.lon,sp=t=>e180(L(p,t+.05)-L(p,t-.05));let x=t0;
 for(let i=0;i<4;i++){const r=seek(sp,p==='Mercury'?.5:1,1200,x,dir,90);if(!r)return null;if((w==='d')===r.up)return r.t;x=r.t}return null}
function find(s,ctx,t0,dir){s=s||{};const L=ctx.lon,tab=s.tab||'asp',N=ctx.natal||null,st=p=>SPD[p]||1,
 near=a=>{a=a.filter(x=>x.jd!=null);a.sort((x,y)=>dir*(x.jd-y.jd));return a[0]||{jd:null}};
 if(tab==='asp'){const ka=N?s.ka||'T':'T',kb=N?s.kb||'R':'T',A=s.a||'Saturn',B=s.b||'Sun',x=s.x||'Conjunction',ang=(ASPECTS.find(q=>q[0]===x)||ASPECTS[0])[1];
  if(ka!=='T'&&!N)return {jd:null,msg:'Open a birth chart for progressed and solar arc aspects'};const bj=N?N.jd:t0,pg=t=>bj+(t-bj)/Y;
  const fn=(k,p)=>k==='T'?t=>L(p,t):k==='P'?t=>L(p,pg(t)):k==='S'?t=>L(p,bj)+L('Sun',pg(t))-L('Sun',bj):()=>L(p,bj),fa=fn(ka,A),fb=fn(kb,B);
  const sp=(k,p)=>k==='T'?st(p):k==='P'?st(p)*Y:k==='S'?SPD.Sun*Y:Infinity,stp=Math.min(sp(ka,A),sp(kb,B)),span=(ka==='T'||kb==='T'?200:120)*Y;
  if(!isFinite(stp))return {jd:null,msg:'Both picks are natal, so nothing moves in time'};
  const pre={T:'',P:'Progressed ',S:'Solar Arc ',R:'Natal '},lab=`${pre[ka]}${A} ${x} ${N?pre[kb]:''}${B}`;let best=null;
  for(const g of (ang%180?[ang,-ang]:[ang])){const r=seek(t=>e180(fa(t)-fb(t)-g),stp,span,t0,dir,90);if(r&&(best==null||dir*(r.t-best)<0))best=r.t}
  return best==null?{jd:null,msg:`No exact ${x.toLowerCase()} within ${Math.round(span/Y)} years`}:{jd:best,label:lab,ring:RING[ka]}}
 if(tab==='lun'){const k=s.le||'new';let jd=lunation(k,ctx,t0,dir),lab=(LUNATIONS.find(q=>q[0]===k)||LUNATIONS[0])[1];
  if(k==='eclipse'&&jd!=null)lab=Math.abs(e180(L('Moon',jd)-L('Sun',jd)))<90?'Solar Eclipse':'Lunar Eclipse';return {jd,label:lab}}
 if(tab==='rd'){const p=s.rdp||'Mercury',w=s.rdw||'any';return near((w==='any'?['rx','d']:[w]).map(x=>({jd:station(p,x,ctx,t0,dir),label:`${p} Stations ${x==='rx'?'Retrograde':'Direct'}`})))}
 if(tab==='ing'){const p=s.ip||'Sun',sg=s.is==null?-1:+s.is,w15=x=>((x+15)%30+30)%30-15;
  const r=sg<0?seek(t=>w15(L(p,t)),st(p),200*Y,t0,dir,15):seek(t=>e180(L(p,t)-sg*30),st(p),400*Y,t0,dir,90);
  if(!r)return {jd:null,msg:'None found within 200 years'};const into=Math.floor(e360(L(p,r.t+dir*.01))/30);return {jd:r.t,label:`${p} enters ${SGN[sg<0?into:sg]}`}}
 if(tab==='pos'){const p=s.pp||'Sun',d=+(s.pd||0),sg=+(s.ps||0),r=seek(t=>e180(L(p,t)-(sg*30+d)),st(p),400*Y,t0,dir,90);return {jd:r?r.t:null,label:`${p} at ${d}° ${SGN[sg]}`}}
 if(tab==='house'){const c=N&&N.cusps;if(!c)return {jd:null,msg:'House needs a birth chart with a birth time'};const p=s.hp||'Sun',h=+(s.hn||0);
  return near((h?[h]:[1,2,3,4,5,6,7,8,9,10,11,12]).map(n=>{const r=seek(t=>e180(L(p,t)-c[n]),st(p),400*Y,t0,dir,90);return {jd:r?r.t:null,label:`${p} enters House ${n}`}}))}
 if(tab==='ret'){if(!N)return {jd:null,msg:'Return needs a birth chart'};const p=s.rp||'Sun',g=L(p,N.jd),r=seek(t=>e180(L(p,t)-g),st(p),400*Y,t0,dir,90);return {jd:r?r.t:null,label:`${p} Return`}}
 return {jd:null}}
/* ---------- the Step Chart to Event panel ---------- */
const ST={tab:'asp'};let P=null,O=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const sel=(k,lab,L,v)=>`<select data-eat="${k}" aria-label="${lab}">${L.map(([q,n])=>`<option value="${q}"${String(q)===String(v)?' selected':''}>${n}</option>`).join('')}</select>`;
const col=(h,b)=>`<div class="eat-c"><span>${h}</span>${b}</div>`;
const fmt=ms=>{const d=new Date(ms),z=n=>String(n).padStart(2,'0');let h=d.getHours();const ap=h<12?'am':'pm';h=h%12||12;return `${z(d.getMonth()+1)}/${z(d.getDate())}/${String(d.getFullYear()).slice(-2)} ${z(h)}:${z(d.getMinutes())}${ap}`};
function body(){const n=!!(O&&O.natal),pl=PL.map(p=>[p,p]),sg=SGN.map((x,i)=>[i,x]),t=ST.tab;
 if(t==='asp')return col(n?sel('ka','Moving',KINDS_FROM,ST.ka||'T'):'Transiting',sel('a','Planet',pl,ST.a||'Saturn'))+col('&nbsp;',sel('x','Aspect',ASPECTS.map(q=>[q[0],q[0]]),ST.x||'Conjunction'))+col(n?sel('kb','To',KINDS_TO,ST.kb||'R'):'Transiting',sel('b','Other planet',pl,ST.b||'Sun'));
 if(t==='rd')return col('Transiting',sel('rdp','Planet',PL.slice(2).map(p=>[p,p]),ST.rdp||'Mercury'))+col('Station',sel('rdw','Station',[['any','Retrograde or Direct'],['rx','Retrograde'],['d','Direct']],ST.rdw||'any'));
 if(t==='ing')return col('Transiting',sel('ip','Planet',pl,ST.ip||'Sun'))+col('Enters',sel('is','Sign',[[-1,'Any sign']].concat(sg),ST.is==null?-1:ST.is));
 if(t==='pos')return col('Transiting',sel('pp','Planet',pl,ST.pp||'Sun'))+col('Degree',sel('pd','Degree',[...Array(30)].map((_,i)=>[i,i+'°']),ST.pd||0))+col('Sign',sel('ps','Sign',sg,ST.ps||0));
 if(t==='house')return n&&O.ctx.natal&&O.ctx.natal.cusps?col('Transiting',sel('hp','Planet',pl,ST.hp||'Sun'))+col('Enters',sel('hn','House',[[0,'Any house']].concat([...Array(12)].map((_,i)=>[i+1,'House '+(i+1)])),ST.hn||0)):'<p class="eat-m">Open a birth chart with a birth time to step to house ingresses.</p>';
 if(t==='ret')return n?col('Transiting',sel('rp','Planet',pl,ST.rp||'Sun'))+col('&nbsp;','<span class="eat-r">returns to its natal place</span>'):'<p class="eat-m">Open a birth chart to step to returns.</p>';
 return col('Event',sel('le','Event',LUNATIONS,ST.le||'new'))}
function draw(focus){if(!P||!O)return;const ms=O.getMs();
 P.innerHTML=`<div class="eat-h"><b>${esc(O.title||'Step Chart to Event')}</b><button class="eat-x" data-eat-x aria-label="Close">&#10005;</button></div>`
 +`<div class="eat-t" role="tablist" aria-label="Kind of event">${TABS.map(([k,n])=>`<button role="tab" data-eat-tab="${k}" aria-selected="${k===ST.tab}">${n}</button>`).join('')}</div>`
 +`<div class="eat-b">${body()}</div>`
 +`<div class="eat-f"><button data-eat-go="-1">Prev</button><div class="eat-s"><small>Search From</small><b>${esc((O.fmt||fmt)(ms))}</b></div><button data-eat-go="1">Next</button></div>`
 +(ST.msg?`<div class="eat-l" role="status">${esc(ST.msg)}</div>`:'');
 place();const q=focus&&P.querySelector(focus);if(q)q.focus()}
function place(){if(!P||!O||!O.anchor||!O.anchor.isConnected)return;   /* the app redrew its bar: keep the panel where it is */const a=O.anchor.getBoundingClientRect(),w=P.offsetWidth,h=P.offsetHeight,vw=innerWidth,vh=innerHeight;
 let x=Math.min(Math.max(8,a.left+a.width/2-w/2),vw-w-8),y=a.top-h-8;if(y<8)y=Math.min(vh-h-8,a.bottom+8);P.style.left=x+'px';P.style.top=Math.max(8,y)+'px'}
function go(dir){let r;try{r=find(ST,O.ctx,O.getMs()/864e5+2440587.5,dir)}catch(e){r={jd:null,msg:'Search failed'}}
 if(!r||r.jd==null){ST.msg=(r&&r.msg)||'None found within 200 years'}else{const ms=(r.jd-2440587.5)*864e5;ST.msg=`${r.label}: ${(O.fmt||fmt)(ms)}`;O.go(ms,r.label,r.ring||'tr')}
 draw(`[data-eat-go="${dir}"]`)}
function close(){if(!P)return;const a=O&&O.anchor;P.remove();P=null;O=null;document.removeEventListener('keydown',onKey,true);document.removeEventListener('pointerdown',onOut,true);removeEventListener('resize',place);if(a&&a.isConnected)a.focus()}
const onKey=e=>{if(e.key==='Escape'&&P){e.stopPropagation();e.preventDefault();close()}};
const onOut=e=>{if(P&&!P.contains(e.target)&&!(O.anchor&&O.anchor.contains(e.target)))close()};
function events(o){if(P){const same=O&&O.anchor===o.anchor;close();if(same)return}O=o;injectCss();P=document.createElement('div');P.className='eat-p';P.setAttribute('role','dialog');P.setAttribute('aria-label',o.title||'Step Chart to Event');
 document.body.appendChild(P);ST.msg='';
 P.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-eat-x')){close();return}
  if(b.dataset.eatTab){ST.tab=b.dataset.eatTab;ST.msg='';draw(`[data-eat-tab="${ST.tab}"]`);return}if(b.dataset.eatGo)go(+b.dataset.eatGo)});
 P.addEventListener('change',e=>{const k=e.target.dataset.eat;if(!k)return;ST[k]=e.target.value;ST.msg='';draw(`[data-eat="${k}"]`)});
 document.addEventListener('keydown',onKey,true);setTimeout(()=>document.addEventListener('pointerdown',onOut,true),0);addEventListener('resize',place);draw('[data-eat-x]')}
function injectCss(){if(document.getElementById('eat-css'))return;const s=document.createElement('style');s.id='eat-css';s.textContent=`
.eat-p{position:fixed;z-index:9000;width:min(420px,calc(100vw - 16px));background:#10142a;color:#f3e7c4;border:1px solid #c9b27a66;border-radius:12px;box-shadow:0 10px 30px #0009;font:14px Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;padding:10px 12px 12px}
.eat-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.eat-h b{font-size:15px}
.eat-x{background:none;border:0;color:inherit;font-size:16px;width:32px;height:32px;border-radius:8px;cursor:pointer}.eat-x:hover,.eat-x:focus-visible{background:#ffffff1a}
.eat-t{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}.eat-t button{flex:1 0 auto;min-height:32px;padding:0 8px;border-radius:8px;border:1px solid #c9b27a55;background:transparent;color:inherit;cursor:pointer;font:600 12.5px inherit}
.eat-t button[aria-selected=true]{background:#c9b27a;color:#10142a;border-color:#c9b27a}
.eat-b{display:flex;gap:8px;flex-wrap:wrap;min-height:58px}.eat-c{display:flex;flex-direction:column;gap:4px;flex:1 1 30%}.eat-c span{font-size:12px;opacity:.75}
.eat-c select{min-height:34px;border-radius:8px;background:#1b2147;color:inherit;border:1px solid #c9b27a55;padding:0 6px;font:inherit}
.eat-r,.eat-m{font-size:13px;opacity:.85;margin:0;align-self:center}
.eat-f{display:flex;align-items:center;gap:8px;margin-top:10px}.eat-f button{min-height:36px;min-width:64px;border-radius:8px;border:1px solid #c9b27a;background:#c9b27a22;color:inherit;cursor:pointer;font:600 13px inherit}
.eat-s{flex:1;text-align:center;display:flex;flex-direction:column}.eat-s small{opacity:.7;font-size:11.5px}
.eat-l{margin-top:8px;font-size:13px;text-align:center;opacity:.9}
.eat-p button:focus-visible,.eat-p select:focus-visible{outline:2px solid #f3e7c4;outline-offset:1px}`;(document.head||document.documentElement).appendChild(s)}
/* ---------- Lunation arrows (Leo, Nov 23, from Kidinnu's Moon bar): jump to the previous or next New or Full Moon; the icon shows which,
   the Sun for a New Moon, the full Moon for a Full Moon, an eclipse icon (red edge) when it is an eclipse. Needs window.EA_JPL.
   lunar.syz(ms, dir) -> {ms, jd, full, eclipse, name} or null;  lunar.eclipse(jd, full) -> 'Total Solar Eclipse' ... or null;
   lunar.icon(t, size) the icon SVG for a syz() result ---------- */
const LR=Math.PI/180,LAU=149597870.7,LSYN=29.530589,jdOfMs=ms=>ms/864e5+2440587.5,msOfJd=jd=>(jd-2440587.5)*864e5,n360=e360;
const LB=(n,jd)=>window.EA_JPL&&EA_JPL.body?EA_JPL.body(n,jd,{speed:false}):null;
function elong(jd){const s=LB('Sun',jd),m=LB('Moon',jd);return s&&m?n360(m.lon-s.lon):null}
function findElong(t,jd){for(let i=0;i<12;i++){const e=elong(jd);if(e==null)return null;const d=e180(e-t);jd-=d/12.19;if(Math.abs(d)<1e-6)break}return jd}
function prevNew(jd){const e=elong(jd);if(e==null)return null;let n=findElong(0,jd-e/12.19);if(n!=null&&n>jd+1/1440)n=findElong(0,n-LSYN);return n}
function eclipse(jd,full){const s=LB('Sun',jd),m=LB('Moon',jd);if(!s||!m||m.lat==null)return null;const dm=m.dist*LAU,ds=s.dist*LAU,as=x=>Math.asin(x)/LR;
 const pm=as(6378.137/dm),ps=as(6378.137/ds),sm=as(1737.4/dm),ss=as(696000/ds),g=Math.abs(m.lat)*0.9962;
 if(!full){if(g>pm-ps+sm+ss)return null;if(g<pm-ps)return sm*1.005>ss?'Total Solar Eclipse':'Annular Solar Eclipse';return 'Partial Solar Eclipse'}
 const pen=1.02*(pm+ps+ss),umb=1.02*(pm+ps-ss);
 if(g+sm<umb)return 'Total Lunar Eclipse';if(g-sm<umb)return 'Partial Lunar Eclipse';if(g-sm<pen)return 'Penumbral Lunar Eclipse';return null}
function syz(ms,dir){const jd=jdOfMs(ms),eps=2/1440,n0=prevNew(jd+eps*dir);if(n0==null)return null;const c=[];
 for(let k=-1;k<=2;k++){const n=k===0?n0:findElong(0,n0+k*LSYN),f=findElong(180,n0+(k+.5)*LSYN);if(n!=null)c.push({jd:n,full:false});if(f!=null)c.push({jd:f,full:true})}
 const t=c.filter(x=>dir>0?x.jd>jd+eps:x.jd<jd-eps).sort((a,b)=>dir*(a.jd-b.jd))[0];if(!t)return null;
 t.ms=msOfJd(t.jd);t.eclipse=eclipse(t.jd,t.full);t.name=t.eclipse||(t.full?'Full Moon':'New Moon');return t}
const SUN_IC=s=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="#dfe2e8" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#f4f5f8"/></svg>`,
 FULL_IC=s=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="#e9edf5"/><circle cx="9" cy="10" r="1.6" fill="#c3c8d2"/><circle cx="14.5" cy="14" r="2.2" fill="#c3c8d2"/></svg>`,
 ECL_IC=(solar,s)=>solar?`<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><circle cx="10.6" cy="13" r="7.8" fill="#dfe2e8"/><circle cx="15.2" cy="9.6" r="6.6" fill="#0b0f26" stroke="#dfe2e8" stroke-width="1.5"/></svg>`
 :`<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="#b4573a" stroke="#e0675c" stroke-width="1.3"/></svg>`;
const icon=(t,s)=>{s=s||20;return !t?SUN_IC(s):t.eclipse?ECL_IC(!t.full,s):t.full?FULL_IC(s):SUN_IC(s)};
const lunar={syz,eclipse,prevNew,findElong,icon};
window.EATime={lunar,UNITS,step,unitName,speeds,STAR_TARGET,TABS,LUNATIONS,ASPECTS,KINDS_FROM,KINDS_TO,find,events,close,isOpen:()=>!!P};
})();

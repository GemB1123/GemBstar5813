/* Chart Look (shared, Nov 18 2026): the chart look and table formatting Kepler built for Planetary Tables (Nov 15-17),
   made global for every World and app (Gemini, Nov 18: "should be global").

   window.EALook
     STYLES, WHEEL, PLANETS, SIGNS, CUSTOM   the Wheel Display presets as data (Gemini, Nov 16):
       Wheel Style  Metal (default), Silver Band, Houses Outside
       Wheel Colors Navy (default), Midnight, Plum, Forest, Custom          (the wheel's background)
       Planet Colors Gold (default), Planet Colors, Element Colors, Silver, White, Custom
       Sign Colors  Element Colors (default), Jewel Tones, Soft Element, Slate   (the zodiac ring wedges)
       Customize holds color pickers for now; a full customization space comes later (Gemini: "let's get back to that").
     get() / set(patch)   the person's look {style, wheel, planets, signs, custom:{pl,bg,bz1,bz2,edge}}, kept in localStorage
                          'ea-look-v1' so every app on the same site shares one choice; set() fires 'ealook' on window.
     wheelOpts(look)      options to merge into EAWheel.svg(chart, opts) (cuspRing, ringStyle, planetColors, colors)
     wheelBg(look)        the wheel background color
     tableBase(look)      the color for table rows and open cards: tables match the chart wheel background (Gemini, Nov 17)
     menu(look)           [{id, title, items:[{k, name, on}]}] for any app's Wheel Display menu
     CHAKRA, blend(tone, base)   Table Colors "Wheel Blend" (default, Leo's palette, Nov 17): 28% of the tone lifted 8% over the base
     moonTab(phaseAngle)  Moon tabs follow the Moon's light: black at New, white at Full, black again (Gemini, Nov 17)
     date(ms)             zero-padded MM/DD/YY so dates line up (aligned columns rule, Nov 17)
     lonCols(lon, rx)     '<i>DD</i><i>Sgn</i><i>MM</i><i>Rx</i>': degree, sign, minute, Rx right after the minutes (Gemini, Nov 17, V260)
     phaseME(angle)       phase angle with no minus or plus: 28°47′ M (morning) or 30°00′ E (evening); no letter at 0° or 180° (Nov 17)
     css()                the small stylesheet for lonCols / phaseME columns (inserted once by injectCss()) */
(function(){
const STYLES=[['metal','Metal'],['silver','Silver Band'],['houses','Houses Outside']],
 WHEEL=[['navy','Navy','#0b0f26'],['midnight','Midnight','#04050a'],['plum','Plum','#1e0f2a'],['forest','Forest','#0a1a16'],['custom','Custom']],
 PLANETS=[['gold','Gold'],['planet','Planet Colors'],['element','Element Colors'],['silver','Silver','#dfe4ea'],['white','White','#ffffff'],['custom','Custom']],
 SIGNS=[['element','Element Colors'],['jewel','Jewel Tones',['#8e1b2c','#1f6b4a','#a8842a','#24317a']],['pastel','Soft Element',['#9a6a64','#6a8a7b','#a8956c','#6c7199']],['slate','Slate',['#353a4e','#353a4e','#353a4e','#353a4e']]],
 CUSTOM=[['pl','Planets','#f5c35c'],['bg','Wheel Background','#0b0f26'],['bz1','Bezel Light','#eef1f4'],['bz2','Bezel Dark','#4b4a48'],['edge','Ring Edges','#c9b27a']],
 DEF={style:'metal',wheel:'navy',planets:'gold',signs:'element'},KEY='ea-look-v1',TNAV='#151b3d';
const BODIES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Node','SNode','Fortune','Spirit'];
const hex=h=>{h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0)},
 mix=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(v*(1-t)+B[i]*t).toString(16).padStart(2,'0')).join('')},
 okHex=v=>/^#[0-9a-f]{6}$/i.test(v||''),pick=(v,L,d)=>L.some(x=>x[0]===v)?v:d;
function clean(o){o=o||{};const c={};CUSTOM.forEach(([k,,d])=>{c[k]=okHex((o.custom||{})[k])?o.custom[k]:d});
 return {style:pick(o.style,STYLES,DEF.style),wheel:pick(o.wheel,WHEEL,DEF.wheel),planets:pick(o.planets,PLANETS,DEF.planets),signs:pick(o.signs,SIGNS,DEF.signs),custom:c}}
function get(){let o={};try{o=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}return clean(o)}
function set(p){const o=clean(Object.assign(get(),p||{},{custom:Object.assign(get().custom,(p||{}).custom||{})}));
 try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}try{window.dispatchEvent(new CustomEvent('ealook',{detail:o}))}catch(e){}return o}
function wheelBg(L){L=clean(L||get());return L.wheel==='custom'?L.custom.bg:WHEEL.find(x=>x[0]===L.wheel)[2]}
function wheelOpts(L){L=clean(L||get());const o={},C=L.custom;
 if(L.style==='silver')o.cuspRing='silver';if(L.style==='houses')o.ringStyle='houses';
 if(L.planets==='planet'||L.planets==='element')o.planetColors=L.planets;
 else if(L.planets!=='gold'){const c=L.planets==='custom'?C.pl:PLANETS.find(x=>x[0]===L.planets)[2];o.planetColors=Object.fromEntries(BODIES.map(k=>[k,c]))}
 const S=SIGNS.find(x=>x[0]===L.signs);if(S&&S[2])o.colors={ringFill:S[2].slice()};
 if(L.wheel!=='navy'){const bg=wheelBg(L);o.colors=Object.assign(o.colors||{},{bg,house:mix(bg,'#ffffff',.04),aspBg:mix(bg,'#ffffff',.02)});
  if(L.wheel==='custom')Object.assign(o.colors,{bezel:[C.bz1,mix(C.bz1,C.bz2,.35),mix(C.bz1,C.bz2,.7),C.bz2],ringEdge:C.edge,line:C.edge+'99',soft:C.edge})}
 o.theme='dark';   /* every Wheel Colors preset is a dark wheel; Navy is the dark theme's own background */
 return o}
function tableBase(L){L=clean(L||get());if(L.wheel==='navy')return TNAV;const f=wheelBg(L);return okHex(f)?mix(f,'#ffffff',.05):TNAV}
function menu(L){L=clean(L||get());const it=(id,list,v)=>list.map(([k,n])=>({k:id+':'+k,name:n,on:v===k}));
 return [{id:'style',title:'Wheel Style',items:it('style',STYLES,L.style)},{id:'wheel',title:'Wheel Colors',items:it('wheel',WHEEL,L.wheel)},
  {id:'planets',title:'Planet Colors',items:it('planets',PLANETS,L.planets)},{id:'signs',title:'Sign Colors',items:it('signs',SIGNS,L.signs)}]}
/* Table Colors: Wheel Blend keeps each chakra gate's hue at the wheel's softness (Leo's palette, Nov 17) */
const CHAKRA={root:'#c0675c',sacral:'#c98a5a',solar:'#c9a96e',heart:'#6f9a86',throat:'#6f97b8',third:'#7d86c2',crown:'#9b86c2'};
const blend=(tone,base)=>mix(base||tableBase(),mix(tone,'#ffffff',.08),.28);
const moonTab=a=>{a=Number(a)||0;const f=(1-Math.cos(a*Math.PI/180))/2,v=Math.round(255*f).toString(16).padStart(2,'0');return '#'+v+v+v};
const z=n=>String(n).padStart(2,'0'),SG=['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
const date=ms=>{const d=new Date(ms);return `${z(d.getMonth()+1)}/${z(d.getDate())}/${String(d.getFullYear()).slice(-2)}`};
/* nearest arc minute (30 arc seconds or more rounds up) */
function lonCols(lon,rx,signs){let m=Math.round((((+lon%360)+360)%360)*60)%21600;const s=Math.floor(m/1800),d=Math.floor(m%1800/60);m=m%60;
 return `<i class="eal-d">${z(d)}</i><i class="eal-s">${(signs||SG)[s]}</i><i class="eal-m">${z(m)}</i><i class="eal-rx">${rx?'Rx':''}</i>`}
function phaseME(a){a=Number(a)||0;const m=Math.floor(Math.abs(a)*60+.5),d=Math.floor(m/60),L=m===0||m===10800?'':a<0?'M':'E';
 return `<span class="eal-pa">${z(d)}°${z(m%60)}′<i class="eal-me">${L}</i></span>`}
const css=()=>`.eal-lon{display:inline-grid;grid-template-columns:auto auto auto 1.6em;column-gap:.3em;font-variant-numeric:tabular-nums;align-items:baseline}
.eal-lon i{font-style:normal}.eal-d,.eal-m{text-align:right}.eal-s{text-align:center;min-width:2.1em}.eal-rx{color:#e0675c;font-size:.86em}
.eal-pa{font-variant-numeric:tabular-nums;white-space:nowrap}.eal-me{font-style:normal;display:inline-block;width:1.1em;text-align:right;opacity:.85}`;
function injectCss(){if(typeof document==='undefined'||document.getElementById('eal-css'))return;const s=document.createElement('style');s.id='eal-css';s.textContent=css();(document.head||document.documentElement).appendChild(s)}
window.EALook={STYLES,WHEEL,PLANETS,SIGNS,CUSTOM,DEFAULTS:DEF,get,set,clean,wheelOpts,wheelBg,tableBase,menu,CHAKRA,blend,mix,moonTab,date,lonCols,phaseME,css,injectCss};
})();

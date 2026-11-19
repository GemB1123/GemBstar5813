/* Simple Wheel (Painter World, Gemini, Nov 13 2026): one easy-to-read chart wheel that every World and app can use,
   on a phone or a desktop. Our own look (Gemini asked that it not resemble other apps): a zodiac ring of alternating
   silver and titanium segments with Ana's glyphs (the ring Kepler made for Planetary Tables), house cusp degrees just
   outside the ring, large planet degree / sign / minutes, and a small aspect circle in the center.
   Tap the aspect circle to go Major > Minor > Symmetry; double tap to make it large (planets then show glyphs only).
   Planets take the element color of the sign they are in (the Color Rule).

   window.EAWheel.svg(chart, opts) returns an <svg> string.
     chart: {pos:{Sun:lon, ...}, ret:{Mercury:true, ...}, cusps:[ , c1 .. c12 ] or null (+ .noAngles, .even)}
     opts (all optional):
       planets  list of bodies to draw (default Sun..Pluto plus the true North and South Nodes; add Fortune, Spirit to show them; AS and MC are drawn from the cusps)
       chart.dec {Sun:deg, ...} optional declinations, shown in the hover box with degrees, minutes, and seconds
       glyph    k => inner SVG of a planet glyph in a -15..15 box, stroked with currentColor (Device: PLG)
       sign     (i,x,y,size,color) => SVG of sign glyph i (Device: agSvg, Ana's glyphs)
       aspects  p => [{a,b,angle,color,minor}]  (Device: the shared aspect set); false for none
       aspectTypes {conjunction: 8, quincunx: 3, septile: false, ...} (by key or angle; orb in degrees, true = default orb, false = off)
                used when aspects is not given; EAWheel.ASPECTS lists every type with its default orb (minor types start off)
       cuspRing false drops the house cusp ring (it is dropped by itself for Whole Sign, Natural Zodiac and other houses on 0° of each sign: cusps.even)
       signBold 0 (default) | px: extra thickness for sign glyphs
       aspectAngles false leaves AS and MC out of the aspects
       earth    false (default) | 'small' | 'large': an Earth over the center of the aspect circle; earthSVG(r) draws it (centered at 0,0, radius r), else a plain blue disc
       pictures p => [{a,b,c,color}]  midpoint pictures, drawn instead of aspects (Symmetry)
       setLabel short name of the aspect set (e.g. 'Major'), for screen readers; showSetLabel:true also writes it at the foot of the aspect circle
       big      true draws the large aspect circle
       theme    'light' (default) or 'dark'
       colors   overrides for any theme color: {bg, bezel:[4 stops, Mercury to iron], cuspBand:[light, dark] (the ring with the cusp degrees), cuspInk, cuspEl:[4],
                (opts.cuspRing default 'metal' (Gemini, Nov 13: the default look): that ring takes the bezel's Mercury-to-iron gradient, always light at the top (the nonagesimal side) and dark at the bottom; 'silver' = flat silver / near-black band; Houses Only uses it on the outer band) ringFill:[fire, earth, air, water] (dark: colored ring, white glyphs), ringA, ringB, rinkA, rinkB, ringEdge, house, line, axis, ink, soft, ret, aspBg, el:[fire, earth, air, water]}
                rinkA / rinkB 'el' = sign glyphs in their element color
       ringStyle 'signs' (default: zodiac ring, house cusps on the wheel) or 'houses' (no sign ring: house cusp degrees on the outer band)
       decans   false | 'chaldean' (Traditional) | 'element' (Traditional By Element) | 'modern'; bounds false | 'egyptian' | 'ptolemaic'
                (thin rings with each part's guide; single wheels only)
       label    accessible name
   planetColors 'gold' (default: shiny gold with a soft glow, AstroSynth's gold), 'planet' (AstroMaps colors, dark-tuned), 'element'; sign glyphs keep their element colors (signColors:'planet' to follow the planet), or {Sun:'#..', ...}
   chart.rings  [{pos, ret, label, color}, ...] up to two more charts drawn in rings outside the main one (bi- and tri-wheels);
                chart.label names the main chart. EAWheel.legend(chart, opts) returns a small HTML legend (dot + label per ring).
   window.EAWheel.attach(root, {tap, dbl}) also turns on pinch to zoom (touch screens only) for every wheel under root: the wheel grows over the page
     as the top layer, body.eawz is set while zoomed (apps open their containers' overflow), pinch back to full size or EAWheel.zoomReset() ends it.
   window.EAWheel.attach(root, {tap, dbl}) listens once on root for taps on the aspect circle ([data-eaw="asp"]):
     tap() after a single tap (or Enter), dbl() after a double tap (or Shift+Enter); planet(name, ring, event) when a planet is tapped
     (ring 0 = main chart, 1-2 = outer rings), so each app can open its planet info box.
   Other Worlds: build {pos, ret, cusps} from your own ephemeris and pass the glyph and sign providers you have. */
(function(){
const ELC=['#a8382f','#2f6b53','#9a7333','#33408f'];   /* fire, earth, air, water, deepened from the wheel colors so they read on paper */
const ELD=['#c0675c','#6f9a86','#c9a96e','#7d86c2'];   /* on a dark wheel: the Main wheel colors (fire #77322d, earth #3e5f56, air #c7a16d, water #363a7d) lifted just enough to read on navy, not neon (Gemini, Nov 13) */
/* planet colors: 'element' (the Color Rule), 'gold' (all one gold), 'planet' (each planet its own color, from AstroMaps; Saturn and Pluto
   rethought for dark: Saturn antique sand instead of grey, Pluto plum instead of dark grey, so neither disappears on navy) */
const PCD={Sun:'#e8b021',Moon:'#cdd2dc',Mercury:'#8fd3ff',Venus:'#43c46e',Mars:'#ff3b30',Jupiter:'#ff9326',Saturn:'#c9b68a',Uranus:'#4f86ff',Neptune:'#2fe0cf',Pluto:'#b07cc6',Node:'#c9a0ff',SNode:'#c9a0ff'};
const PCL={Sun:'#b07c00',Moon:'#6c7480',Mercury:'#2186cc',Venus:'#1f8f45',Mars:'#d0201a',Jupiter:'#d96a00',Saturn:'#6f747c',Uranus:'#1f4fd8',Neptune:'#0d9488',Pluto:'#3f434a',Node:'#7b4fc4',SNode:'#7b4fc4'};
/* Decans (faces) and Bounds (Egyptian terms) with their guides, as [guide, start, end] in zodiac degrees.
   Chaldean faces start with Mars at 0 Aries; triplicity decans take the guides of the signs of the same element in order.
   Egyptian bounds as in the Time Lords World (worlds/time-lords/tlmath.js). */
const CHD=['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'],GD=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const GDM=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Pluto','Jupiter','Saturn','Uranus','Neptune'];
/* Gemini's three decan choices (shared with Sky Mode, Po, Nov 13): Traditional = Chaldean faces; Traditional By Element and Modern =
   decan d of sign s takes the Guide of sign (s+4d)%12, with traditional or modern Guides */
const DEC={chaldean:Array.from({length:36},(_,i)=>[CHD[(2+i)%7],i*10,i*10+10]),element:Array.from({length:36},(_,i)=>[GD[(Math.floor(i/3)+4*(i%3))%12],i*10,i*10+10]),modern:Array.from({length:36},(_,i)=>[GDM[(Math.floor(i/3)+4*(i%3))%12],i*10,i*10+10])};
const BT=[[['Jupiter',6],['Venus',12],['Mercury',20],['Mars',25],['Saturn',30]],[['Venus',8],['Mercury',14],['Jupiter',22],['Saturn',27],['Mars',30]],[['Mercury',6],['Jupiter',12],['Venus',17],['Mars',24],['Saturn',30]],[['Mars',7],['Venus',13],['Mercury',19],['Jupiter',26],['Saturn',30]],[['Jupiter',6],['Venus',11],['Saturn',18],['Mercury',24],['Mars',30]],[['Mercury',7],['Venus',17],['Jupiter',21],['Mars',28],['Saturn',30]],[['Saturn',6],['Mercury',14],['Jupiter',21],['Venus',28],['Mars',30]],[['Mars',7],['Venus',11],['Mercury',19],['Jupiter',24],['Saturn',30]],[['Jupiter',12],['Venus',17],['Mercury',21],['Saturn',26],['Mars',30]],[['Mercury',7],['Jupiter',14],['Venus',22],['Saturn',26],['Mars',30]],[['Mercury',7],['Venus',13],['Jupiter',20],['Mars',25],['Saturn',30]],[['Venus',12],['Jupiter',16],['Mercury',19],['Mars',28],['Saturn',30]]];
/* Ptolemaic bounds, Tetrabiblos I.21 (Robbins), as lengths per sign (Po, Sky Mode) */
const PT='Ju6 Ve8 Me7 Ma5 Sa4|Ve8 Me7 Ju7 Sa2 Ma6|Me7 Ju6 Ve7 Ma6 Sa4|Ma6 Ju7 Me7 Ve7 Sa3|Sa6 Me7 Ve6 Ju6 Ma5|Me7 Ve6 Ju5 Sa6 Ma6|Sa6 Ve5 Me5 Ju8 Ma6|Ma6 Ju8 Ve7 Me6 Sa3|Ju8 Ve6 Me5 Sa6 Ma5|Ve6 Me6 Ju7 Sa6 Ma5|Sa6 Me6 Ve8 Ju5 Ma5|Ve8 Ju6 Me6 Ma5 Sa5',AB={Ju:'Jupiter',Ve:'Venus',Me:'Mercury',Ma:'Mars',Sa:'Saturn'};
const BND={egyptian:BT.flatMap((s,i)=>s.map(([g,e],j)=>[g,i*30+(j?s[j-1][1]:0),i*30+e])),
 ptolemaic:PT.split('|').flatMap((x,i)=>{let a=i*30;return x.split(' ').map(t=>{const e=a+ +t.slice(2),r=[AB[t.slice(0,2)],a,e];a=e;return r})})};
const SGN=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'],PGT={Sun:'☉',Moon:'☽',Mercury:'☿',Venus:'♀',Mars:'♂',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇',Node:'☊',SNode:'☋',Fortune:'⊗',Spirit:'⊕'};
/* the Nodes and the Parts (Fortune, Spirit) are drawn only when an app lists them in opts.planets: default off everywhere (Gemini, Nov 16) */
const DEF_PL=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Node','SNode'];   /* Gemini, Nov 18 (global): both TRUE Nodes on by default (apps pass true-node longitudes; hide via opts.planets); Fortune and Spirit stay off */
const THEMES={
 light:{bg:'#f7f8fa',ringA:'#8f939c',ringB:'#4c5059',rinkA:'#2e3036',rinkB:'#c3c7cf',ringEdge:'#6f737c',house:'#eceef2',line:'#a3a8b2',axis:'#2e3240',ink:'#1d2027',soft:'#5b616d',ret:'#b3261e',aspBg:'#ffffff',gold:'#b08524',goldHi:'#dcb24c',goldLo:'#6e4f0c',glow:.3,ringCols:['#2f5fb3','#a03a6b'],band:'#e4e7ed',xrA:'#eef0f4',xrB:'#e0e3ea',xrInk:'#3a3f4c',bezel:['#eef1f4','#c7cdd4','#8a8986','#4b4a48'],cuspBand:['#2c2f35','#15171b'],cuspInk:'#ffffff',cuspEl:ELD,pl:PCL,el:ELC},
 dark:{bg:'#0b0f26',ringA:'#1c2348',ringB:'#28305e',ringFill:['#77322d','#3e5f56','#a8875a','#363a7d'],rinkA:'#ffffff',rinkB:'#ffffff',ringEdge:'#c9b27a',house:'#141a3a',line:'#c9b27a99',axis:'#f3e7c4',ink:'#f3e7c4',soft:'#c9b27a',ret:'#ff9a8a',aspBg:'#0e1430',gold:'#f5c35c',goldHi:'#ffe9ad',goldLo:'#cf962c',glow:.75,ringCols:['#9fc4ff','#e8a3c4'],band:'#1a2147',xrA:'#141a3a',xrB:'#1b2246',xrInk:'#d9c79a',bezel:['#eef1f4','#c7cdd4','#8a8986','#4b4a48'],cuspBand:['#e6e9ee','#a9afb8'],cuspInk:'#14161b',cuspEl:ELC,pl:PCD,el:ELD}};
/* glyph spacing in degrees per wheel mode (Gemini, Nov 16: more room, above all on bi- and tri-wheels) */
const GAP={big:8.5,full:14.5,compact:13,bi:13.5,tri:12};
const n360=x=>((x%360)+360)%360,f=n=>n.toFixed(1),rad=d=>d*Math.PI/180;
/* aspect types with default orbs (Gemini, Nov 13: turn any aspect type on or off and choose its orb).
   opts.aspectTypes {angle: orb | false} overrides any row; a row with on:false starts off (minor types). */
const ASPECTS=[
 {angle:0,key:'conjunction',name:'Conjunction',orb:8,color:'#6b6150',on:true},
 {angle:180,key:'opposition',name:'Opposition',orb:8,color:'#c0392b',on:true},
 {angle:120,key:'trine',name:'Trine',orb:8,color:'#2f55c4',on:true},
 {angle:90,key:'square',name:'Square',orb:8,color:'#c0392b',on:true},
 {angle:60,key:'sextile',name:'Sextile',orb:6,color:'#2f55c4',on:true},
 {angle:150,key:'quincunx',name:'Quincunx',orb:3,color:'#2e8b57',minor:true},
 {angle:30,key:'semisextile',name:'Semisextile',orb:2,color:'#2e8b57',minor:true},
 {angle:45,key:'semisquare',name:'Semisquare',orb:2,color:'#c0392b',minor:true},
 {angle:135,key:'sesquisquare',name:'Sesquisquare',orb:2,color:'#c0392b',minor:true},
 {angle:72,key:'quintile',name:'Quintile',orb:2,color:'#7b3fa0',minor:true},
 {angle:144,key:'biquintile',name:'Biquintile',orb:2,color:'#7b3fa0',minor:true},
 {angle:360/7,key:'septile',name:'Septile',orb:1,color:'#c2508a',minor:true},
 {angle:40,key:'novile',name:'Novile',orb:1,color:'#b8902a',minor:true}];
/* the built-in aspect finder: types {angle|key: orb | true | false}; angles false leaves out AS and MC */
function findAspects(p,types,angles){const T=types||{},on=[];
 for(const A of ASPECTS){let v=T[A.key];if(v===undefined)v=T[A.angle];if(v===undefined)v=T[f(A.angle)];if(v===undefined)v=A.on?A.orb:false;if(v===false||v==null)continue;on.push([A,v===true?A.orb:+v])}
 const L=Object.keys(p).filter(k=>angles!==false||(k!=='AS'&&k!=='MC')),out=[];
 for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const d=Math.abs(n360(p[L[i]]-p[L[j]]+180)-180);let best=null;
  for(const [A,o] of on){const e=Math.abs(d-A.angle);if(e<=o&&(!best||e<best.orb))best={a:L[i],b:L[j],angle:A.angle,name:A.name,color:A.color,minor:!!A.minor,orb:e}}
  if(best)out.push(best)}return out}
/* spread glyphs apart: keep each at least gap degrees from its neighbours, moving as little as possible */
function spread(L,gap){L.sort((a,b)=>a.l-b.l);L.forEach(x=>x.d=x.l);const n=L.length;if(n<2)return;if(n*gap>=360){L.forEach((x,i)=>x.d=L[0].l+i*360/n);return}
 /* start after the widest empty arc so a cluster never straddles the seam, then merge any glyphs closer than gap into a group
    spaced gap apart around its members' mean; repeat until no group touches the next */
 let w=0,wi=0;for(let i=0;i<n;i++){const g=n360(L[(i+1)%n].l-L[i].l);if(g>w){w=g;wi=(i+1)%n}}
 const A=L.slice(wi).concat(L.slice(0,wi)).map(x=>({x,l:x.l}));for(let i=1;i<n;i++)while(A[i].l<A[i-1].l)A[i].l+=360;
 let G=A.map(a=>[a]);const pos=g=>{const m=g.reduce((s,a)=>s+a.l,0)/g.length;g.forEach((a,i)=>a.d=m+(i-(g.length-1)/2)*gap)};G.forEach(pos);
 for(let it=0;it<n*2;it++){let hit=-1;for(let i=0;i<G.length-1;i++)if(G[i+1][0].d-G[i][G[i].length-1].d<gap-1e-6){hit=i;break}if(hit<0)break;G.splice(hit,2,G[hit].concat(G[hit+1]));pos(G[hit])}
 A.forEach(a=>a.x.d=a.d)}
/* each wheel gets its own gradient and filter ids, so two wheels on one page keep their own colors */
let UID=0;
function svg(chart,opts){const u='w'+(++UID).toString(36);return svg0(chart,opts).replace(/(id="|url\(#)(eaw(?:bz|gg|glow|bold|cb|cm))\b/g,'$1$2'+u)}
function svg0(chart,opts){opts=opts||{};const T0=THEMES[opts.theme]||THEMES.light,C=opts.colors||{},T=Object.assign({},T0,C,{el:T0.el.map((c,i)=>(C.el&&C.el[i])||c)}),P=chart.pos||{},RX=chart.ret||{},cu=chart.cusps||null;
 const mix=(c,w,k)=>'#'+[1,3,5].map(j=>Math.round(parseInt(c.slice(j,j+2),16)*(1-k)+w*k).toString(16).padStart(2,'0')).join('');
 if(C.gold&&/^#[0-9a-f]{6}$/i.test(C.gold)){if(!C.goldHi)T.goldHi=mix(C.gold,255,.55);if(!C.goldLo)T.goldLo=mix(C.gold,0,.25)}   /* a picked gold keeps its shine */
 const angles=cu&&!cu.noAngles,rot=cu?cu[1]:0,big=!!opts.big;
 const xy=(lon,r)=>{const t=rad(180+lon-rot);return [r*Math.cos(t),-r*Math.sin(t)]};
 /* bezel 199..190, then the outer ring 190..168: the zodiac (style 'signs') or the house cusps (style 'houses', no sign ring);
    optional Decans and Bounds rings with their guides (13 each), then house cusp degree / sign / minutes on the wheel
    (signs style), planets down to RH, house numbers RH..RI, aspects inside RI. Double tap makes the aspect circle large. */
 const sty=opts.ringStyle||'signs',uni=!(chart.rings&&chart.rings.some(r=>r&&r.pos)),xr=uni?[opts.decans?'dec':null,opts.bounds?'bnd':null].filter(Boolean):[];   /* Decans and Bounds only on a single wheel (Gemini, Nov 13) */
 const RB=194.5,R0=190,R1=168,RX0=R1-13*xr.length,RC=RX0-8,NCB=sty!=='houses'&&(!cu||opts.cuspRing===false||cu.even||cu.slice(1,13).every(c=>Math.abs(n360(c+1e-7)%30)<1e-6)),RP=sty==='houses'||NCB?RX0:RX0-16,RI=big?Math.min(128,RP-12):56,RH=big?RI:70;
 const glyph=opts.glyph,sign=opts.sign,ink=T.ink;
 const sg=(i,x,y,sz,col)=>sign?sign(i,x,y,sz,col):`<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-size="${sz}" fill="${col}">${SGN[i]}︎</text>`;
 const pg=(k,x,y,sz,col)=>{const g=glyph&&glyph(k);return g?`<g transform="translate(${f(x)} ${f(y)}) scale(${(sz/30).toFixed(3)})" fill="none" stroke="${col}" color="${col.startsWith('url')?T.gold:col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${g}</g>`:`<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-size="${sz}" fill="${col}">${PGT[k]||k}︎</text>`};
 /* degree numbers (Gemini, Nov 18, global, from the Solar Return applet): sized to the sign glyphs beside them (opts.degScale, default .8 of the
   old size) and one weight lighter; planet degrees (dg) are white on a dark wheel, not the cream of the angle lines, with a thin halo in the
   wheel's background so a cusp or angle line under them never hides them (opts.degHalo:false turns the halo off) */
const txd=(T,o,s,x,y,sz,col,w,dg)=>{const k=o.degScale==null?.8:o.degScale,c=dg&&col===T.ink&&o.theme==='dark'?'#ffffff':col;
 const t=tx(s,x,y,f(sz*k),c,w?w-100:w);return dg&&o.degHalo!==false?t.replace('<text ',`<text stroke="${T.bg}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke" `):t};
/* aspect lines (Gemini, Nov 19, every chart; the Solar Return's style): the tighter the orb the thicker the line, an aspect between the
   right signs (a trine from Pisces to Scorpio) heavier than one across a sign line; trines and sextiles in the water signs' blue, squares and
   oppositions in the fire signs' red, taken from the wheel. opts.aspectStyle:'plain' keeps an app's own colors and widths; an aspect that
   already carries a width keeps it */
const ASPC={dark:{60:'#6f78d6',120:'#6f78d6',90:'#cc5a4e',180:'#cc5a4e'},light:{60:'#33408f',120:'#33408f',90:'#a8382f',180:'#a8382f'}};
function aspStyle(A,pp,dark){const pa=pp[A.a],pb=pp[A.b];if(pa==null||pb==null)return A;const ang=+A.angle,sep=Math.abs(((pa-pb)%360+540)%360-180),orb=A.orb!=null?+A.orb:Math.abs(sep-ang);
 const D=ASPECTS.find(x=>x.angle===ang),mx=A.maxOrb||(D&&D.orb)||8,t=Math.max(0,1-orb/mx),d=((Math.floor(n360(pa)/30)-Math.floor(n360(pb)/30))%12+12)%12,k=Math.round(ang/30)%12,ins=d===k||d===(12-k)%12;
 const c=ASPC[dark?'dark':'light'][ang];if(c&&!A.minor)A.color=c;if(A.width==null)A.width=(A.minor?.35+.9*t:.45+1.75*t)*(ins?1:.55);A.inSign=ins;return A}
const tx=(s,x,y,sz,col,w)=>`<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-size="${sz}" fill="${col}" font-family="Inter,system-ui,sans-serif"${w?` font-weight="${w}"`:''}>${s}</text>`;
 const dms=l=>{const m=Math.floor(n360(l)*60+.5)%21600;return {s:Math.floor(m/1800),d:Math.floor(m/60)%30,m:m%60}};
 const rink=i=>{const v=i%2?T.rinkB:T.rinkA;return v==='el'?T.el[i%4]:v};
 /* the bezel's lightest side faces the Sun, so the day and night sides of the chart read at a glance (Gemini, Nov 13) */
 const sun=P.Sun!=null?xy(P.Sun,200):[-141,-141];
 let h=`<svg class="eaw" viewBox="-200 -200 400 400" width="100%" height="100%" role="img" aria-label="${(opts.label||'Chart wheel').replace(/"/g,'&quot;')}" style="font-family:Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums;touch-action:none">`;
 const CB=[].concat(T.cuspBand||[T.band||T.house]);if(CB.length<2)CB.push(CB[0]);const MET=opts.cuspRing!=='silver',ME=sty==='houses'?R0:RX0,cIn=T.cuspInk||null,cEl=T.cuspEl||T.el;
 h+=`<defs><linearGradient id="eawbz" gradientUnits="userSpaceOnUse" x1="${f(sun[0])}" y1="${f(sun[1])}" x2="${f(-sun[0])}" y2="${f(-sun[1])}">${T.bezel.map((c,i)=>`<stop offset="${[0,.3,.6,1][i]}" stop-color="${c}"/>`).join('')}</linearGradient><linearGradient id="eawcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${CB[0]}"/><stop offset="1" stop-color="${CB[1]}"/></linearGradient><linearGradient id="eawcm" gradientUnits="userSpaceOnUse" x1="0" y1="${f(-ME)}" x2="0" y2="${f(ME)}">${T.bezel.map((c,i)=>`<stop offset="${[0,.3,.6,1][i]}" stop-color="${c}"/>`).join('')}</linearGradient><linearGradient id="eawgg" gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="14"><stop offset="0" stop-color="${T.goldHi}"/><stop offset=".5" stop-color="${T.gold}"/><stop offset="1" stop-color="${T.goldLo}"/></linearGradient><filter id="eawglow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/><feFlood flood-color="${T.gold}" flood-opacity="${T.glow}"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="eawbold" x="-20%" y="-20%" width="140%" height="140%"><feMorphology operator="dilate" radius="${+opts.signBold||0}"/></filter></defs><circle r="${R0}" fill="${T.bg}"/>`;
 /* bezel: a thin metal rim around the zodiac ring (after Gemini's AstroSynth wheel, Nov 13) */
 h+=`<circle r="${RB}" fill="none" stroke="url(#eawbz)" stroke-width="9"/><circle r="${RB+4.4}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/><circle r="${R0+.4}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".9"/>`;
 /* sign glyphs are drawn bolder on the ring and in the planet positions (Gemini, Nov 13) */
 /* sign glyphs: no extra thickening by default (Gemini, Nov 15: they looked puffy); opts.signBold adds it back */
 const sgb=(i,x,y,sz,col)=>opts.signBold?`<g filter="url(#eawbold)">${sg(i,x,y,sz,col)}</g>`:sg(i,x,y,sz,col);
 /* zodiac ring: twelve segments, alternating, with the sign glyphs (style 'signs') */
 const seg=(a0,a1,r0,r1,fill,sw)=>{const A=xy(a0,r0),B=xy(a0,r1),Cc=xy(a1,r1),D=xy(a1,r0);return `<path d="M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}A${r1} ${r1} 0 0 0 ${f(Cc[0])} ${f(Cc[1])}L${f(D[0])} ${f(D[1])}A${r0} ${r0} 0 0 1 ${f(A[0])} ${f(A[1])}Z" fill="${fill}" stroke="${T.ringEdge}" stroke-width="${sw||.6}"/>`};
 if(sty==='houses')h+=MET?`<circle r="${R0}" fill="${T.bg}"/><circle r="${f((R0+R1)/2)}" fill="none" stroke="url(#eawcm)" stroke-width="${f(R0-R1)}"/>`:`<circle r="${R0}" fill="${T.band||T.house}"/>`;
 else for(let i=0;i<12;i++){const A=xy(i*30,R0),B=xy(i*30,R1),Cc=xy(i*30+30,R1),D=xy(i*30+30,R0),g=xy(i*30+15,(R0+R1)/2);
  h+=`<path d="M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}A${R1} ${R1} 0 0 0 ${f(Cc[0])} ${f(Cc[1])}L${f(D[0])} ${f(D[1])}A${R0} ${R0} 0 0 1 ${f(A[0])} ${f(A[1])}Z" fill="${T.ringFill?T.ringFill[i%4]:i%2?T.ringB:T.ringA}" stroke="${T.ringEdge}" stroke-width=".6"/>`+sgb(i,g[0],g[1],14,rink(i))}
 /* Decans and Bounds rings: thin rings with each part's guide glyph (Gemini, Nov 13) */
 xr.forEach((kind,j)=>{const r0=R1-13*j,r1=r0-13,parts=kind==='dec'?(DEC[opts.decans]||DEC.chaldean):(BND[opts.bounds]||BND.egyptian);
  parts.forEach(([g,a0,a1],n)=>{h+=seg(a0,a1,r0,r1,n%2?T.xrB:T.xrA,.4);const m=xy((a0+a1)/2,(r0+r1)/2);h+=pg(g,m[0],m[1],8.5,T.xrInk)})});
 h+=`<circle r="${R1}" fill="none" stroke="${T.ringEdge}" stroke-width="1"/>`+(xr.length?`<circle r="${RX0}" fill="none" stroke="${T.ringEdge}" stroke-width=".8"/>`:'')+`<circle r="${RP}" fill="none" stroke="${T.line}" stroke-width=".6"/>`;
 /* the house cusp ring: silver on a dark wheel with black cusp degrees, dark gray on a light wheel with white (Gemini, Nov 13) */
 if(sty!=='houses'&&RX0>RP)h+=`<circle r="${f((RX0+RP)/2)}" fill="none" stroke="url(#${MET?'eawcm':'eawcb'})" stroke-width="${f(RX0-RP)}"/><circle r="${RP}" fill="none" stroke="${T.ringEdge}" stroke-width=".6"/>`;
 if(!big)h+=`<circle r="${RH}" fill="${T.house}" stroke="${T.line}" stroke-width=".8"/>`;
 /* house cusps: lines through the planet zone, cusp degree / sign / minutes just outside the zodiac ring, numbers in the house ring */
 if(cu){for(let i=1;i<=12;i++){const ax=angles&&!cu.even&&(i===1||i===4||i===7||i===10),a=xy(cu[i],RP),b=xy(cu[i],RI),a0=xy(cu[i],R1);
   h+=`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${ax?T.axis:T.line}" stroke-width="${ax?1.8:.7}"/><line x1="${f(a0[0])}" y1="${f(a0[1])}" x2="${f(a[0])}" y2="${f(a[1])}" stroke="${ax?T.axis:T.line}" stroke-width="${ax?1.8:.7}" opacity=".35"/>`;
   /* cusp labels read Degree, Sign, Minutes in reading order wherever the cusp sits (Gemini, Nov 18): left to right, or top to
       bottom where the label stands upright; on the far side of the wheel (houses 7 to 11 when the AS is on the left) the two ends swap */
   const hs=sty==='houses',rc=hs?(R0+R1)/2:RC,sp0=hs?4.2:4.4,q=dms(cu[i]),e0=xy(cu[i]-sp0,rc),e1=xy(cu[i]+sp0,rc),dx=e1[0]-e0[0],dy=e1[1]-e0[1],sp=(Math.abs(dx)>=Math.abs(dy)?dx<0:dy<0)?-sp0:sp0,pd=xy(cu[i]-sp,rc),
    /* the metal cusp ring is light at the top and dark at the bottom, so its text turns white past the middle */
    dk=MET&&(pd[1]+ME)/(2*ME)>.55,cI=MET?(dk?'#ffffff':'#14161b'):hs?null:cIn,cE=MET?(dk?ELD:ELC):hs?T.el:cEl,ps=xy(cu[i]-.1,rc),pm=xy(cu[i]+sp,rc),cc=ax?T.axis:T.soft;
   if(hs){const t0=xy(cu[i],R0),t1=xy(cu[i],R1);h+=`<line x1="${f(t0[0])}" y1="${f(t0[1])}" x2="${f(t1[0])}" y2="${f(t1[1])}" stroke="${ax?T.axis:T.ringEdge}" stroke-width="${ax?1.6:.6}" opacity=".5"/>`}
   if(!NCB)h+=txd(T,opts,q.d+'°',pd[0],pd[1],hs?11:9.5,cI||(ax?T.axis:ink),ax?800:600)+sgb(q.s,ps[0],ps[1],hs?13:10.5,cE[q.s%4])+tx(String(q.m).padStart(2,'0')+'′',pm[0],pm[1],hs?9:8,cI||cc,ax?700:400);
   if(!big){const nx=cu[i%12+1],mid=cu[i]+n360(nx-cu[i])/2,n=xy(mid,(RH+RI)/2);h+=tx(i,n[0],n[1],8.5,T.soft,600)}}
  /* Gemini, Nov 18 (global): arrowheads on the AS and MC ends of the angle lines, as on the Device wheel, instead of dots */
  if(angles)[[cu[1],'AS'],[cu[10],'MC']].forEach(([l,t])=>{const tp=xy(l,RP-1),bs=xy(l,RP-11),L=Math.hypot(tp[0],tp[1])||1,nx=-tp[1]/L*4.2,ny=tp[0]/L*4.2;
   h+=`<path d="M${f(tp[0])} ${f(tp[1])}L${f(bs[0]+nx)} ${f(bs[1]+ny)}L${f(bs[0]-nx)} ${f(bs[1]-ny)}Z" fill="${T.axis}"><title>${t}</title></path>`})}
 else for(let i=0;i<12;i++){const a=xy(i*30,RP),b=xy(i*30,RI);h+=`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${T.line}" stroke-width=".6"/>`}
 /* planets: a dot on the ring at the exact degree, then glyph, degree, sign and minutes toward the center */
 const pm=opts.planetColors||T.pcol||'gold',shiny=pm==='gold'&&opts.shiny!==false,col=k=>pm==='gold'?T.gold:pm==='planet'?((C.pl&&C.pl[k])||T.pl[k]||T.gold):typeof pm==='object'?(pm[k]||T.gold):T.el[Math.floor(n360(P[k])/30)%4];
 /* sign glyphs keep their own (element) colors whatever the planet colors are (Gemini, Nov 13) */
 const scol=s=>opts.signColors==='planet'?null:T.el[s%4];
 const SN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
 /* bi- and tri-wheels (Gemini, Nov 13): chart.rings = [{pos, ret, label, color}, ...] are drawn in bands outside the main chart,
    the last one outermost; each ring's glyphs take its color so the legend dot matches. The main chart stays innermost. */
 const rings=big?[]:(chart.rings||[]).filter(r=>r&&r.pos).slice(0,2),nb=1+rings.length,H=(RP-RH)/nb;
 const RCOL=T.ringCols||[];
 /* hover: name, degree minute second, sign, retrograde, and declination when the app gives it (Gemini, Nov 16) */
 const PN={Node:'North Node',SNode:'South Node',Fortune:'Part of Fortune',Spirit:'Part of Spirit'},
  hov=(x,Pp,ri)=>{const v=n360(Pp[x.k]),t=Math.round(v*3600)%1296000,d=Math.floor(t/3600)%30,m=Math.floor(t/60)%60,sc=t%60,dc=((ri?((chart.rings||[])[ri-1]||{}).dec:chart.dec)||{})[x.k],
   rx=((ri?((chart.rings||[])[ri-1]||{}).ret:chart.ret)||{})[x.k];
   return `${PN[x.k]||x.k} ${d}° ${SN[Math.floor(t/108000)%12]} ${String(m).padStart(2,'0')}′ ${String(sc).padStart(2,'0')}″${rx?' retrograde':''}${dc!=null?` · Dec ${dc<0?'−':'+'}${Math.floor(Math.abs(dc))}°${String(Math.floor(Math.abs(dc)%1*60)).padStart(2,'0')}′`:''}`};
 const band=(Pp,RXp,t,ci,main,ri)=>{const list=(opts.planets||DEF_PL).filter(k=>Pp[k]!=null).map(k=>({k,l:n360(Pp[k])}));
  const mode=big?'big':nb===1?(RP-RH<75?'compact':'full'):nb===2?'bi':'tri';
  const R={big:{g:140},full:{g:t-16,d:t-35,s:t-51,m:t-65,gs:22,ds:13.5,ss:13.5,ms:10.5},compact:{g:t-12,d:t-28,s:t-41,gs:19,ds:12.5,ss:12},bi:{g:t-11,d:t-25,s:t-35,gs:17,ds:11,ss:10},tri:{g:t-9,d:t-20.5,gs:14.5,ds:9.5}}[mode];
  /* opts.glyphScale (Solar Return, Gemini Nov 18: "everything smaller for breathing room"; default .85 for every chart, global) shrinks glyphs, numbers and ticks;
     opts.ticksOnDivider puts an outer ring's ticks on the circle it shares with the chart inside it, and mirrors that ring's
     stack so its glyphs sit beside their ticks (both rings' ticks on one circle, Gemini Nov 18; on by default, ticksOnDivider:false turns it off) */
  const GS=opts.glyphScale==null?.85:opts.glyphScale,inv=!main&&opts.ticksOnDivider!==false,tb=inv?t-H:t,TL=(nb>1?5:6.5)*GS;
  if(GS!==1)for(const k of ['gs','ds','ss','ms'])if(R[k])R[k]*=GS;
  if(GS!==1&&!R.gs)R.gs=17*GS;
  if(inv)for(const k of ['g','d','s','m'])if(R[k])R[k]=tb+(t-R[k]);
  /* spacing (Gemini, Nov 16: as close as possible without overlap, so a conjunction still looks like one): the widest piece of the
     glyph stack, measured as an angle at its own radius, plus a hair; inner rings sit at a smaller radius so they get more */
  const GW=[[R.gs||17,R.g,1.05],[R.ds,R.d,1.6],[R.ss,R.s,1.05],[R.ms,R.m,1.7]].filter(a=>a[0]&&a[1]).map(([z,r,w])=>z*w/r*57.3),gap=mode==='big'?GAP.big:Math.max(...GW)+.6;
  spread(list,gap);

  /* keep each glyph and its degree stack off the cusp lines (Gemini, Nov 15: Sun on the AS, Jupiter on the DS): a planet within m
     degrees of a cusp slides to the side it is on (the open side when it sits exactly on it); its tick stays on the true degree */
  /* then relax: cusps push glyphs off their lines and glyphs push each other apart again, so moving off a cusp never lands a glyph
     on its neighbour (Gemini, Nov 16: natal Sun and Uranus overlapped on a biwheel) */
  {const gp=gap,m={big:4,full:5.5,compact:5,bi:4.5,tri:4}[mode],C=cu?cu.slice(1,13).map(n360):[],dd=(a,b)=>((a-b+540)%360)-180,n=list.length;
   /* STELLIUM (Gemini, Nov 18, GLOBAL): a house too full to hold its planets (Venus at 4° Leo crowded against the 2nd cusp) grows into
      the next house: the glyph held against that cusp crosses it and sits in the neighboring space, its leader line points back to the
      true degree, and the whole stellium is framed (below) so it still reads as one group. opts.stellium:false turns this off */
   const over=()=>{const B=list.slice().sort((a,b)=>n360(a.d)-n360(b.d)),O=[];for(let i=0;i<n&&n>1;i++){const A1=B[i],A2=B[(i+1)%n];if(n360(A2.d-A1.d)<gp-.3)O.push(A1,A2)}return O.length?O:null};
   /* each try is scored by how much glyphs still overlap; the best try is the one drawn */
   const sc=()=>{const B=list.slice().sort((a,b)=>n360(a.d)-n360(b.d));let t=0;for(let i=0;i<n&&n>1;i++)t+=Math.max(0,gp-n360(B[(i+1)%n].d-B[i].d));return t};let best=null;
   for(let tries=0;tries<=n;tries++){
   if(C.length&&n*gp<330)for(let it=0;it<60;it++){let moved=false;
    list.forEach(x=>{for(const c of C){const e=dd(x.d,c);if(Math.abs(e)>=m-1e-6)continue;
     if(!x.cs){let sg=Math.sign(dd(x.l,c))||Math.sign(e);if(!sg){const o=list.filter(y=>y!==x).map(y=>dd(y.d,c));sg=o.filter(v=>v>0&&v<15).length>o.filter(v=>v<0&&v>-15).length?-1:1}x.cs={};x.cs[c]=sg}
     const sg=(x.cs[c]!=null?x.cs[c]:(x.cs[c]=Math.sign(e)||1));x.d=n360(c+sg*m);moved=true}});
    const B=list.slice().sort((a,b)=>n360(a.d)-n360(b.d));
    for(let i=0;i<n&&n>1;i++){const A1=B[i],A2=B[(i+1)%n],sp=n360(A2.d-A1.d);if(sp<gp-1e-6){const k=(gp-sp)/2;A1.d=n360(A1.d-k);A2.d=n360(A2.d+k);moved=true}}
    if(!moved)break}
   {const v=sc();if(!best||v<best.v-1e-6)best={v,ds:list.map(x=>x.d)}}
   const o=C.length&&n*gp<330&&opts.stellium!==false?over():null;if(!o)break;let flip=null;
   for(const x of o)if(x.cs)for(const c of Object.keys(x.cs)){if(Math.abs(Math.abs(dd(x.d,+c))-m)<.5&&!(x.fl&&x.fl[c])){flip=[x,c];break}}
   if(!flip)break;const [fx,fc]=flip;fx.fl=fx.fl||{};fx.fl[fc]=1;fx.cs[fc]=-fx.cs[fc];list.forEach(x=>{x.d=x.l})}
   if(best)list.forEach((x,i)=>{x.d=best.ds[i]})}
  if(cu&&opts.stellium!==false&&list.length>2){const CS=cu.slice(1,13).map(n360),hs=l=>{let b=-1,bd=361;CS.forEach((c,i)=>{const e=n360(l-c);if(e<bd){bd=e;b=i}});return b};
   const B=list.slice().sort((a,b)=>n360(a.d)-n360(b.d)),n=B.length;let w=-1,wi=0;for(let i=0;i<n;i++){const g=n360(B[(i+1)%n].d-B[i].d);if(g>w){w=g;wi=(i+1)%n}}
   const S=B.slice(wi).concat(B.slice(0,wi)),G=[[S[0]]];for(let i=1;i<n;i++){if(n360(S[i].d-S[i-1].d)<gap*1.35)G[G.length-1].push(S[i]);else G.push([S[i]])}
   const rr=[[R.g,R.gs||17*GS],[R.d,R.ds],[R.s,R.ss],[R.m,R.ms]].filter(a=>a[0]&&a[1]),ro=Math.max(...rr.map(a=>a[0]+a[1]*.62)),ri0=Math.min(...rr.map(a=>a[0]-a[1]*.62));
   for(const g of G){if(g.length<3||!g.some(x=>hs(x.d)!==hs(x.l)))continue;const a0=g[0].d-gap*.5,a1=a0+n360(g[g.length-1].d-g[0].d)+gap,lg=a1-a0>180?1:0;
    const p0=xy(a0,ro),p1=xy(a1,ro),p2=xy(a1,ri0),p3=xy(a0,ri0);
    h+=`<path class="eaw-stel" d="M${f(p0[0])} ${f(p0[1])}A${f(ro)} ${f(ro)} 0 ${lg} 0 ${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}A${f(ri0)} ${f(ri0)} 0 ${lg} 1 ${f(p3[0])} ${f(p3[1])}Z" fill="${T.soft}" fill-opacity=".06" stroke="${T.soft}" stroke-opacity=".55" stroke-width=".7" stroke-linejoin="round"/>`}}
  const cf=main?col:()=>ci,sh=main&&shiny;
  list.forEach(x=>{const q=dms(x.l),c=cf(x.k),rx=RXp[x.k],sd=inv?1:-1;
   /* a short tick, not a dot, marks the exact placement (Gemini, Nov 15: global) */
   {const k0=xy(x.l,tb),k1=xy(x.l,tb+sd*TL),kc=String(c).startsWith('url')?T.gold:c;h+=`<line x1="${f(k0[0])}" y1="${f(k0[1])}" x2="${f(k1[0])}" y2="${f(k1[1])}" stroke="${kc}" stroke-width="${f((nb>1?1.4:1.8)*(.4+.6*GS))}" stroke-linecap="${opts.ticksOnDivider!==false&&nb>1?'butt':'round'}"/>`}
   if(Math.abs(((x.d-x.l+540)%360)-180)>1.2){const e=xy(x.d,R.g-sd*(mode==='full'||mode==='big'?10:7)*GS),t2=xy(x.l,tb+sd*TL);h+=`<line x1="${f(t2[0])}" y1="${f(t2[1])}" x2="${f(e[0])}" y2="${f(e[1])}" stroke="${c}" stroke-width=".6" opacity=".6"/>`}
   const g=xy(x.d,R.g),gs=R.gs||17*GS;
   h+=`<g class="eawp" data-pl="${x.k}" data-ring="${ri||0}"><title>${hov(x,Pp,ri)}</title>`+(sh?`<g filter="url(#eawglow)">${pg(x.k,g[0],g[1],gs,'url(#eawgg)')}</g>`:pg(x.k,g[0],g[1],gs,c));
   if(mode==='full'){const d=xy(x.d,R.d),s2=xy(x.d,R.s),m=xy(x.d,R.m);h+=txd(T,opts,q.d+'°',d[0],d[1],R.ds,rx?T.ret:ink,700,1)+sgb(q.s,s2[0],s2[1],R.ss,scol(q.s)||c)+tx(String(q.m).padStart(2,'0')+'′',m[0],m[1],R.ms,rx?T.ret:T.soft,500)}
   else if(mode==='bi'||mode==='compact'){const d=xy(x.d,R.d),s2=xy(x.d,R.s);h+=txd(T,opts,q.d+'°',d[0],d[1],R.ds,rx?T.ret:ink,700,1)+sgb(q.s,s2[0],s2[1],R.ss,scol(q.s)||c)}
   else if(mode==='tri'){const d=xy(x.d,R.d);h+=txd(T,opts,q.d+'°',d[0],d[1],R.ds,rx?T.ret:ink,700,1)}
   else if(rx){const d=xy(x.d,R.g-12);h+=tx('℞',d[0],d[1],7,T.ret,700)}
   h+='</g>'});return list};
 rings.forEach((r,i)=>{const t=RP-H*(rings.length-1-i);h+=`<circle r="${f(t-H)}" fill="none" stroke="${T.line}" stroke-width=".6"/>`;band(r.pos,r.ret||{},t,r.color||RCOL[i]||T.soft,false,i+1)});
 const L=band(P,RX,RP-H*rings.length,null,true);
 /* aspect circle: tap for the next aspect set, double tap to make it large */
 const pp={};L.forEach(x=>pp[x.k]=x.l);if(angles){pp.AS=n360(cu[1]);pp.MC=n360(cu[10])}
 const at=k=>pp[k]!=null?xy(pp[k],RI-2):null;
 h+=`<g data-eaw="asp" tabindex="0" role="button" aria-label="Aspects${opts.setLabel?': '+opts.setLabel:''}. Click for the next aspect set, double-click to change the Earth" style="cursor:pointer;touch-action:manipulation;outline:none"><title>Click: next aspects (Major, Minor, Symmetry). Double-click: Earth small, large, or none.</title><circle r="${RI}" fill="${T.aspBg}" stroke="${T.line}" stroke-width="1"/>`;
 if(opts.pictures){for(const q of opts.pictures(pp)||[]){const a=at(q.a),b=at(q.b),c=at(q.c);if(!a||!b||!c)continue;h+=`<path d="M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}L${f(b[0])} ${f(b[1])}" fill="none" stroke="${q.color||T.axis}" stroke-width="${big?1.2:.9}" opacity=".8"/>`}}
 else if(opts.aspects!==false){for(const A of (opts.aspects||(q=>findAspects(q,opts.aspectTypes,opts.aspectAngles)))(pp)||[]){if(!A.angle)continue;const a=at(A.a),b=at(A.b);if(!a||!b)continue;
  if(opts.aspectStyle!=='plain')aspStyle(A,pp,opts.theme==='dark');
  h+=`<line class="eawa" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${A.color||T.line}" stroke-width="${f((A.width!=null?A.width:A.minor?.6:1.1)*(big?1.4:1))}"${A.minor?' stroke-dasharray="3 2"':''}><title>${A.a} ${A.name||A.angle+'°'} ${A.b}${A.orb!=null?' · orb '+Math.floor(A.orb)+'°'+String(Math.round(A.orb%1*60)).padStart(2,'0')+"'":''}</title></line>`}}
 /* the Earth in the center, over the aspect lines (Gemini, Nov 13): Small or Large; Large still leaves a ring of aspect lines */
 if(opts.earth){const er=f(RI*(opts.earth==='large'?.6:.3));h+=`<g pointer-events="none">${opts.earthSVG?opts.earthSVG(+er):`<circle r="${er}" fill="#24497e" stroke="${T.ringEdge}" stroke-width=".8"/>`}</g>`}
 /* the set name is spoken to screen readers, not written on the chart (Gemini, Nov 15); showSetLabel writes it */
 if(opts.setLabel&&opts.showSetLabel)h+=`<text x="0" y="${f(RI*.72)}" text-anchor="middle" dominant-baseline="central" font-size="${big?9:7}" fill="${T.soft}" stroke="${T.aspBg}" stroke-width="2.5" paint-order="stroke" font-family="Inter,system-ui,sans-serif" font-weight="600">${opts.setLabel}</text>`;
 return h+'</g></svg>'}
/* one listener per root: a single tap waits a moment so a double tap is not read as two taps */
/* pinch to zoom on phones (Gemini, Nov 13: an imperative wherever the wheel appears on mobile): two fingers zoom about their
   midpoint, one finger pans while zoomed; touch only, no zoom on a computer (Gemini, Nov 13); the view survives re-renders */
/* pinch to zoom (Gemini, Nov 15: a global rule): the wheel itself grows, over the tables and chart text, as the top layer.
   It scales the <svg> with a CSS transform about the pinch point; body.eawz is set while zoomed so each app can open up its
   containers' overflow. Pinch back to full size to end the zoom (double tap is the Earth cycle), or call EAWheel.zoomReset(). */
const ZV={k:1,x:0,y:0};
function zApply(sv){if(ZV.k===1){sv.style.transform='';sv.style.zIndex='';sv.style.position='';sv.style.transformOrigin='';return}
 sv.style.transformOrigin='50% 50%';sv.style.position='relative';sv.style.zIndex='1000';sv.style.transform=`translate(${f(ZV.x)}px,${f(ZV.y)}px) scale(${ZV.k.toFixed(3)})`}
function zState(){const on=ZV.k>1;if(document.body)document.body.classList.toggle('eawz',on)}
function zoomable(){const root=document;if(root.__eawz)return;root.__eawz=1;   /* one listener for the page, whatever root attach() was given */
 const pts=new Map();let st=null;
 const sv=()=>root.querySelectorAll?root.querySelectorAll('svg.eaw'):[];
 const all=()=>{sv().forEach(zApply);zState()};
 new MutationObserver(()=>{if(ZV.k!==1)sv().forEach(s=>{if(!s.style.transform)zApply(s)})}).observe(root.documentElement||root,{childList:true,subtree:true});
 /* the svg's resting center on screen (its box minus the current shift) */
 /* a = screen px per CSS px (the page may be scaled, e.g. the Device stage), so finger moves map to the transform */
 const sc=s=>{const r=s.getBoundingClientRect(),w=s.clientWidth||r.width/ZV.k;return r.width/ZV.k/w||1};
 const ctr=(s,a)=>{const r=s.getBoundingClientRect();return [r.left+r.width/2-ZV.x*a,r.top+r.height/2-ZV.y*a]};
 root.addEventListener('pointerdown',e=>{const s=e.target.closest&&e.target.closest('svg.eaw');if(!s||e.pointerType==='mouse')return;pts.set(e.pointerId,[e.clientX,e.clientY]);st=null},true);
 root.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const s=e.target.closest&&e.target.closest('svg.eaw')||sv()[0];if(!s)return;pts.set(e.pointerId,[e.clientX,e.clientY]);const P=[...pts.values()];
  if(P.length>=2){const d=Math.hypot(P[0][0]-P[1][0],P[0][1]-P[1][1]),mx=(P[0][0]+P[1][0])/2,my=(P[0][1]+P[1][1])/2;
   if(!st||st.n!==2){const a=sc(s),c=ctr(s,a);st={n:2,d,k:ZV.k,c,a,p:[(mx-c[0]-ZV.x*a)/ZV.k,(my-c[1]-ZV.y*a)/ZV.k]};return}
   ZV.k=Math.max(1,Math.min(6,st.k*d/st.d));if(ZV.k<1.03){ZV.k=1;ZV.x=0;ZV.y=0}else{ZV.x=(mx-st.c[0]-st.p[0]*ZV.k)/st.a;ZV.y=(my-st.c[1]-st.p[1]*ZV.k)/st.a}all();e.preventDefault()}
  else if(ZV.k>1){if(!st||st.n!==1){st={n:1,c:P[0],x:ZV.x,y:ZV.y,a:sc(s)};return}ZV.x=st.x+(P[0][0]-st.c[0])/st.a;ZV.y=st.y+(P[0][1]-st.c[1])/st.a;all();e.preventDefault()}},{passive:false});
 const up=e=>{pts.delete(e.pointerId);st=null};root.addEventListener('pointerup',up,true);root.addEventListener('pointercancel',up,true);}
function zoomReset(){ZV.k=1;ZV.x=0;ZV.y=0;document.querySelectorAll('svg.eaw').forEach(zApply);zState()}
function attach(root,cb){if(root)zoomable(root);if(!root||root.__eaw){if(root)root.__eaw=cb;return}root.__eaw=cb;let tm=null;
 root.addEventListener('click',e=>{const pl=e.target.closest&&e.target.closest('g.eawp');
  /* tap a planet: cb.planet(name, ring, event), ring 0 = the main chart, 1 and 2 the outer rings (Gemini, Nov 16: a planet info box) */
  if(pl&&root.__eaw.planet){e.preventDefault();root.__eaw.planet(pl.dataset.pl,+pl.dataset.ring||0,e);return}
  const g=e.target.closest&&e.target.closest('[data-eaw="asp"]');if(!g)return;e.preventDefault();
  if(tm){clearTimeout(tm);tm=null;root.__eaw.dbl&&root.__eaw.dbl();return}tm=setTimeout(()=>{tm=null;root.__eaw.tap&&root.__eaw.tap()},260)});
 root.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('[data-eaw="asp"]');if(!g||(e.key!=='Enter'&&e.key!==' '))return;e.preventDefault();(e.shiftKey?root.__eaw.dbl:root.__eaw.tap)&&(e.shiftKey?root.__eaw.dbl():root.__eaw.tap())})}
/* legend for bi- and tri-wheels: one line per ring, inner to outer, a dot in the ring's color and its label */
function legend(chart,opts){opts=opts||{};const T=THEMES[opts.theme]||THEMES.light,C=opts.colors||{},rc=C.ringCols||T.ringCols,pm=opts.planetColors||'gold';
 const main=pm==='gold'?(C.gold||T.gold):T.ink,L=[{label:chart.label||'Chart',color:chart.color||main}].concat((chart.rings||[]).slice(0,2).map((r,i)=>({label:r.label||('Ring '+(i+2)),color:r.color||rc[i]})));
 return `<div class="eaw-legend" style="display:flex;flex-wrap:wrap;gap:4px 14px;font:600 12px Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums">`+L.map(x=>`<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:9px;height:9px;border-radius:50%;background:${x.color};display:inline-block"></i>${String(x.label).replace(/</g,'&lt;')}</span>`).join('')+'</div>'}
window.EAWheel={svg,ASPECTS,findAspects,legend,attach,zoomReset,themes:THEMES,spread,planetColors:{dark:PCD,light:PCL}};
})();

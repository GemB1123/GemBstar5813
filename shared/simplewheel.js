/* Simple Wheel (Painter World, Gemini, Nov 13 2026): one easy-to-read chart wheel that every World and app can use,
   on a phone or a desktop. Our own look (Gemini asked that it not resemble other apps): a zodiac ring of alternating
   silver and titanium segments with Ana's glyphs (the ring Kepler made for Planetary Tables), house cusp degrees just
   outside the ring, large planet degree / sign / minutes, and a small aspect circle in the center.
   Tap the aspect circle to go Major > Minor > Symmetry; double tap to make it large (planets then show glyphs only).
   Planets take the element color of the sign they are in (the Color Rule).

   window.EAWheel.svg(chart, opts) returns an <svg> string.
     chart: {pos:{Sun:lon, ...}, ret:{Mercury:true, ...}, cusps:[ , c1 .. c12 ] or null (+ .noAngles, .even)}
     opts (all optional):
       planets  list of bodies to draw (default Sun..Pluto, Node, SNode; AS and MC are drawn from the cusps)
       glyph    k => inner SVG of a planet glyph in a -15..15 box, stroked with currentColor (Device: PLG)
       sign     (i,x,y,size,color) => SVG of sign glyph i (Device: agSvg, Ana's glyphs)
       aspects  p => [{a,b,angle,color,minor}]  (Device: the shared aspect set); false for none
       pictures p => [{a,b,c,color}]  midpoint pictures, drawn instead of aspects (Symmetry)
       setLabel short name of the aspect set, written small at the foot of the aspect circle (e.g. 'Major')
       big      true draws the large aspect circle
       theme    'light' (default) or 'dark'
       colors   overrides for any theme color: {bg, ringFill:[fire, earth, air, water] (dark: colored ring, white glyphs), ringA, ringB, rinkA, rinkB, ringEdge, house, line, axis, ink, soft, ret, aspBg, el:[fire, earth, air, water]}
                rinkA / rinkB 'el' = sign glyphs in their element color
       label    accessible name
   planetColors 'gold' (default: shiny gold with a soft glow, AstroSynth's gold), 'planet' (AstroMaps colors, dark-tuned), 'element'; sign glyphs keep their element colors (signColors:'planet' to follow the planet), or {Sun:'#..', ...}
   window.EAWheel.attach(root, {tap, dbl}) also turns on pinch to zoom (touch screens only) for every wheel under root; EAWheel.zoomReset().
   window.EAWheel.attach(root, {tap, dbl}) listens once on root for taps on the aspect circle ([data-eaw="asp"]):
     tap() after a single tap (or Enter), dbl() after a double tap (or Shift+Enter).
   Other Worlds: build {pos, ret, cusps} from your own ephemeris and pass the glyph and sign providers you have. */
(function(){
const ELC=['#a8382f','#2f6b53','#9a7333','#33408f'];   /* fire, earth, air, water, deepened from the wheel colors so they read on paper */
const ELD=['#c0675c','#6f9a86','#c9a96e','#7d86c2'];   /* on a dark wheel: the Main wheel colors (fire #77322d, earth #3e5f56, air #c7a16d, water #363a7d) lifted just enough to read on navy, not neon (Gemini, Nov 13) */
/* planet colors: 'element' (the Color Rule), 'gold' (all one gold), 'planet' (each planet its own color, from AstroMaps; Saturn and Pluto
   rethought for dark: Saturn antique sand instead of grey, Pluto plum instead of dark grey, so neither disappears on navy) */
const PCD={Sun:'#e8b021',Moon:'#cdd2dc',Mercury:'#8fd3ff',Venus:'#43c46e',Mars:'#ff3b30',Jupiter:'#ff9326',Saturn:'#c9b68a',Uranus:'#4f86ff',Neptune:'#2fe0cf',Pluto:'#b07cc6',Node:'#c9a0ff',SNode:'#c9a0ff'};
const PCL={Sun:'#b07c00',Moon:'#6c7480',Mercury:'#2186cc',Venus:'#1f8f45',Mars:'#d0201a',Jupiter:'#d96a00',Saturn:'#6f747c',Uranus:'#1f4fd8',Neptune:'#0d9488',Pluto:'#3f434a',Node:'#7b4fc4',SNode:'#7b4fc4'};
const SGN=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'],PGT={Sun:'☉',Moon:'☽',Mercury:'☿',Venus:'♀',Mars:'♂',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇',Node:'☊',SNode:'☋'};
const DEF_PL=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Node','SNode'];
const THEMES={
 light:{bg:'#f7f8fa',ringA:'#8f939c',ringB:'#4c5059',rinkA:'#2e3036',rinkB:'#c3c7cf',ringEdge:'#6f737c',house:'#eceef2',line:'#a3a8b2',axis:'#2e3240',ink:'#1d2027',soft:'#5b616d',ret:'#b3261e',aspBg:'#ffffff',gold:'#b08524',goldHi:'#dcb24c',goldLo:'#6e4f0c',glow:.3,bezel:['#ffffff','#c9d0dc','#7d8597','#3a4050','#a7b0c2'],pl:PCL,el:ELC},
 dark:{bg:'#0b0f26',ringA:'#1c2348',ringB:'#28305e',ringFill:['#77322d','#3e5f56','#a8875a','#363a7d'],rinkA:'#ffffff',rinkB:'#ffffff',ringEdge:'#c9b27a',house:'#141a3a',line:'#c9b27a99',axis:'#f3e7c4',ink:'#f3e7c4',soft:'#c9b27a',ret:'#ff9a8a',aspBg:'#0e1430',gold:'#f5c35c',goldHi:'#ffe9ad',goldLo:'#cf962c',glow:.75,bezel:['#eef3fb','#cfd8ea','#8e9ab3','#262c3e','#8e9ab3'],pl:PCD,el:ELD}};
const n360=x=>((x%360)+360)%360,f=n=>n.toFixed(1),rad=d=>d*Math.PI/180;
const majors=p=>{const A=[[0,'#6b6150',8],[60,'#2f55c4',6],[90,'#c0392b',8],[120,'#2f55c4',8],[180,'#c0392b',8]],L=Object.keys(p),out=[];
 for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const d=Math.abs(n360(p[L[i]]-p[L[j]]+180)-180);for(const [a,c,o] of A)if(Math.abs(d-a)<=o){out.push({a:L[i],b:L[j],angle:a,color:c});break}}return out};
/* spread glyphs apart: keep each at least gap degrees from its neighbours, moving as little as possible */
function spread(L,gap){L.sort((a,b)=>a.l-b.l);L.forEach(x=>x.d=x.l);const n=L.length;if(n<2)return;if(n*gap>=360){L.forEach((x,i)=>x.d=L[0].l+i*360/n);return}
 /* start after the widest empty arc so a cluster never straddles the seam, then merge any glyphs closer than gap into a group
    spaced gap apart around its members' mean; repeat until no group touches the next */
 let w=0,wi=0;for(let i=0;i<n;i++){const g=n360(L[(i+1)%n].l-L[i].l);if(g>w){w=g;wi=(i+1)%n}}
 const A=L.slice(wi).concat(L.slice(0,wi)).map(x=>({x,l:x.l}));for(let i=1;i<n;i++)while(A[i].l<A[i-1].l)A[i].l+=360;
 let G=A.map(a=>[a]);const pos=g=>{const m=g.reduce((s,a)=>s+a.l,0)/g.length;g.forEach((a,i)=>a.d=m+(i-(g.length-1)/2)*gap)};G.forEach(pos);
 for(let it=0;it<n*2;it++){let hit=-1;for(let i=0;i<G.length-1;i++)if(G[i+1][0].d-G[i][G[i].length-1].d<gap-1e-6){hit=i;break}if(hit<0)break;G.splice(hit,2,G[hit].concat(G[hit+1]));pos(G[hit])}
 A.forEach(a=>a.x.d=a.d)}
function svg(chart,opts){opts=opts||{};const T0=THEMES[opts.theme]||THEMES.light,C=opts.colors||{},T=Object.assign({},T0,C,{el:T0.el.map((c,i)=>(C.el&&C.el[i])||c)}),P=chart.pos||{},RX=chart.ret||{},cu=chart.cusps||null;
 const mix=(c,w,k)=>'#'+[1,3,5].map(j=>Math.round(parseInt(c.slice(j,j+2),16)*(1-k)+w*k).toString(16).padStart(2,'0')).join('');
 if(C.gold&&/^#[0-9a-f]{6}$/i.test(C.gold)){if(!C.goldHi)T.goldHi=mix(C.gold,255,.55);if(!C.goldLo)T.goldLo=mix(C.gold,0,.25)}   /* a picked gold keeps its shine */
 const angles=cu&&!cu.noAngles,rot=cu?cu[1]:0,big=!!opts.big;
 const xy=(lon,r)=>{const t=rad(180+lon-rot);return [r*Math.cos(t),-r*Math.sin(t)]};
 /* bezel 199..190, zodiac ring 190..168, house cusp degree / sign / minutes 168..152 (on the wheel, Gemini Nov 13),
    planets 152..RH, house numbers RH..RI, aspects inside RI. The aspect circle is small so the planet degrees can be large;
    double tap makes it large. */
 const RB=194.5,R0=190,R1=168,RC=160,RP=152,RI=big?128:56,RH=big?RI:70;
 const glyph=opts.glyph,sign=opts.sign,ink=T.ink;
 const sg=(i,x,y,sz,col)=>sign?sign(i,x,y,sz,col):`<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-size="${sz}" fill="${col}">${SGN[i]}︎</text>`;
 const pg=(k,x,y,sz,col)=>{const g=glyph&&glyph(k);return g?`<g transform="translate(${f(x)} ${f(y)}) scale(${(sz/30).toFixed(3)})" fill="none" stroke="${col}" color="${col.startsWith('url')?T.gold:col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${g}</g>`:`<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-size="${sz}" fill="${col}">${PGT[k]||k}︎</text>`};
 const tx=(s,x,y,sz,col,w)=>`<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-size="${sz}" fill="${col}" font-family="Inter,system-ui,sans-serif"${w?` font-weight="${w}"`:''}>${s}</text>`;
 const dms=l=>{const m=Math.floor(n360(l)*60+.5)%21600;return {s:Math.floor(m/1800),d:Math.floor(m/60)%30,m:m%60}};
 const rink=i=>{const v=i%2?T.rinkB:T.rinkA;return v==='el'?T.el[i%4]:v};
 let h=`<svg class="eaw" viewBox="-200 -200 400 400" width="100%" height="100%" role="img" aria-label="${(opts.label||'Chart wheel').replace(/"/g,'&quot;')}" style="font-family:Inter,system-ui,sans-serif;touch-action:none">`;
 h+=`<defs><linearGradient id="eawbz" x1="0" y1="0" x2="1" y2="1">${T.bezel.map((c,i)=>`<stop offset="${[0,.22,.5,.78,1][i]}" stop-color="${c}"/>`).join('')}</linearGradient><linearGradient id="eawgg" gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="14"><stop offset="0" stop-color="${T.goldHi}"/><stop offset=".5" stop-color="${T.gold}"/><stop offset="1" stop-color="${T.goldLo}"/></linearGradient><filter id="eawglow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/><feFlood flood-color="${T.gold}" flood-opacity="${T.glow}"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="eawbold" x="-20%" y="-20%" width="140%" height="140%"><feMorphology operator="dilate" radius="${opts.signBold==null?.5:opts.signBold}"/></filter></defs><circle r="${R0}" fill="${T.bg}"/>`;
 /* bezel: a thin metal rim around the zodiac ring (after Gemini's AstroSynth wheel, Nov 13) */
 h+=`<circle r="${RB}" fill="none" stroke="url(#eawbz)" stroke-width="9"/><circle r="${RB+4.4}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/><circle r="${R0+.4}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width=".9"/>`;
 /* sign glyphs are drawn bolder on the ring and in the planet positions (Gemini, Nov 13) */
 const sgb=(i,x,y,sz,col)=>`<g filter="url(#eawbold)">${sg(i,x,y,sz,col)}</g>`;
 /* zodiac ring: twelve segments, alternating, with the sign glyphs */
 for(let i=0;i<12;i++){const A=xy(i*30,R0),B=xy(i*30,R1),Cc=xy(i*30+30,R1),D=xy(i*30+30,R0),g=xy(i*30+15,(R0+R1)/2);
  h+=`<path d="M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}A${R1} ${R1} 0 0 0 ${f(Cc[0])} ${f(Cc[1])}L${f(D[0])} ${f(D[1])}A${R0} ${R0} 0 0 1 ${f(A[0])} ${f(A[1])}Z" fill="${T.ringFill?T.ringFill[i%4]:i%2?T.ringB:T.ringA}" stroke="${T.ringEdge}" stroke-width=".6"/>`+sgb(i,g[0],g[1],14,rink(i))}
 h+=`<circle r="${R1}" fill="none" stroke="${T.ringEdge}" stroke-width="1"/><circle r="${RP}" fill="none" stroke="${T.line}" stroke-width=".6"/>`;
 if(!big)h+=`<circle r="${RH}" fill="${T.house}" stroke="${T.line}" stroke-width=".8"/>`;
 /* house cusps: lines through the planet zone, cusp degree / sign / minutes just outside the zodiac ring, numbers in the house ring */
 if(cu){for(let i=1;i<=12;i++){const ax=angles&&!cu.even&&(i===1||i===4||i===7||i===10),a=xy(cu[i],RP),b=xy(cu[i],RI),a0=xy(cu[i],R1);
   h+=`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${ax?T.axis:T.line}" stroke-width="${ax?1.8:.7}"/><line x1="${f(a0[0])}" y1="${f(a0[1])}" x2="${f(a[0])}" y2="${f(a[1])}" stroke="${ax?T.axis:T.line}" stroke-width="${ax?1.8:.7}" opacity=".35"/>`;
   const q=dms(cu[i]),pd=xy(cu[i]-4.4,RC),ps=xy(cu[i]-.1,RC),pm=xy(cu[i]+4.4,RC),cc=ax?T.axis:T.soft;
   h+=tx(q.d+'°',pd[0],pd[1],9.5,ax?T.axis:ink,ax?800:600)+sgb(q.s,ps[0],ps[1],10.5,T.el[q.s%4])+tx(String(q.m).padStart(2,'0')+'′',pm[0],pm[1],8,cc,ax?700:400);
   if(!big){const nx=cu[i%12+1],mid=cu[i]+n360(nx-cu[i])/2,n=xy(mid,(RH+RI)/2);h+=tx(i,n[0],n[1],8.5,T.soft,600)}}
  if(angles)[[cu[1],'AS'],[cu[10],'MC']].forEach(([l,t])=>{const o=xy(l,RP-4);h+=`<circle cx="${f(o[0])}" cy="${f(o[1])}" r="3.2" fill="${T.axis}"/>`})}
 else for(let i=0;i<12;i++){const a=xy(i*30,RP),b=xy(i*30,RI);h+=`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${T.line}" stroke-width=".6"/>`}
 /* planets: a dot on the ring at the exact degree, then glyph, degree, sign and minutes toward the center */
 const L=(opts.planets||DEF_PL).filter(k=>P[k]!=null).map(k=>({k,l:n360(P[k])}));spread(L,big?8:13.5);   /* 13.5 degrees keeps the degree and minute text of a tight cluster apart on a phone (Posidonius, Nov 13) */
 const rg=big?140:136,rd=117,rs=101,rm=87,pm=opts.planetColors||T.pcol||'gold',shiny=pm==='gold'&&opts.shiny!==false,col=k=>pm==='gold'?T.gold:pm==='planet'?((C.pl&&C.pl[k])||T.pl[k]||T.gold):typeof pm==='object'?(pm[k]||T.gold):T.el[Math.floor(n360(P[k])/30)%4];
 /* sign glyphs keep their own (element) colors whatever the planet colors are (Gemini, Nov 13) */
 const scol=s=>opts.signColors==='planet'?null:T.el[s%4];
 L.forEach(x=>{const q=dms(x.l),c=col(x.k),t1=xy(x.l,RP-2.5);
  h+=`<circle cx="${f(t1[0])}" cy="${f(t1[1])}" r="2.4" fill="${c}"/>`;
  if(Math.abs(x.d-x.l)>1.2){const e=xy(x.d,rg+10),t2=xy(x.l,RP-5);h+=`<line x1="${f(t2[0])}" y1="${f(t2[1])}" x2="${f(e[0])}" y2="${f(e[1])}" stroke="${c}" stroke-width=".6" opacity=".6"/>`}
  const g=xy(x.d,rg),rx=RX[x.k];
  h+=`<g class="eawp" data-pl="${x.k}"><title>${x.k} ${q.d}° ${['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][q.s]} ${String(q.m).padStart(2,'0')}′${rx?' retrograde':''}</title>`+(shiny?`<g filter="url(#eawglow)">${pg(x.k,g[0],g[1],big?17:22,'url(#eawgg)')}</g>`:pg(x.k,g[0],g[1],big?17:22,c));
  if(!big){const d=xy(x.d,rd),s=xy(x.d,rs),m=xy(x.d,rm);h+=tx(q.d+'°',d[0],d[1],13.5,rx?T.ret:ink,700)+sgb(q.s,s[0],s[1],13.5,scol(q.s)||c)+tx(String(q.m).padStart(2,'0')+'′'+(rx?'℞':''),m[0],m[1],10.5,rx?T.ret:T.soft,500)}
  else if(rx){const d=xy(x.d,rg-12);h+=tx('℞',d[0],d[1],7,T.ret,700)}
  h+='</g>'});
 /* aspect circle: tap for the next aspect set, double tap to make it large */
 const pp={};L.forEach(x=>pp[x.k]=x.l);if(angles){pp.AS=n360(cu[1]);pp.MC=n360(cu[10])}
 const at=k=>pp[k]!=null?xy(pp[k],RI-2):null;
 h+=`<g data-eaw="asp" tabindex="0" role="button" aria-label="Aspects${opts.setLabel?': '+opts.setLabel:''}. Tap for the next set, double tap to ${big?'make smaller':'make larger'}" style="cursor:pointer;touch-action:manipulation;outline:none"><circle r="${RI}" fill="${T.aspBg}" stroke="${T.line}" stroke-width="1"/>`;
 if(opts.pictures){for(const q of opts.pictures(pp)||[]){const a=at(q.a),b=at(q.b),c=at(q.c);if(!a||!b||!c)continue;h+=`<path d="M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}L${f(b[0])} ${f(b[1])}" fill="none" stroke="${q.color||T.axis}" stroke-width="${big?1.2:.9}" opacity=".8"/>`}}
 else if(opts.aspects!==false){for(const A of (opts.aspects||majors)(pp)||[]){if(!A.angle)continue;const a=at(A.a),b=at(A.b);if(!a||!b)continue;
  h+=`<line class="eawa" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${A.color||T.line}" stroke-width="${(A.minor?.6:1.1)*(big?1.4:1)}"${A.minor?' stroke-dasharray="3 2"':''}><title>${A.a} ${A.name||A.angle+'°'} ${A.b}</title></line>`}}
 if(opts.setLabel)h+=`<text x="0" y="${f(RI*.72)}" text-anchor="middle" dominant-baseline="central" font-size="${big?9:7}" fill="${T.soft}" stroke="${T.aspBg}" stroke-width="2.5" paint-order="stroke" font-family="Inter,system-ui,sans-serif" font-weight="600">${opts.setLabel}</text>`;
 return h+'</g></svg>'}
/* one listener per root: a single tap waits a moment so a double tap is not read as two taps */
/* pinch to zoom on phones (Gemini, Nov 13: an imperative wherever the wheel appears on mobile): two fingers zoom about their
   midpoint, one finger pans while zoomed; touch only, no zoom on a computer (Gemini, Nov 13); the view survives re-renders */
const ZV={k:1,x:0,y:0};
function zApply(sv){const w=400/ZV.k;sv.setAttribute('viewBox',`${f(ZV.x-w/2)} ${f(ZV.y-w/2)} ${f(w)} ${f(w)}`)}
function zClamp(){ZV.k=Math.max(1,Math.min(6,ZV.k));const m=200-200/ZV.k;ZV.x=Math.max(-m,Math.min(m,ZV.x));ZV.y=Math.max(-m,Math.min(m,ZV.y));if(ZV.k===1){ZV.x=0;ZV.y=0}}
function zoomable(root){if(root.__eawz)return;root.__eawz=1;const pts=new Map();let st=null;
 const sv=()=>root.querySelectorAll?root.querySelectorAll('svg.eaw'):[];
 const loc=(s,cx,cy)=>{const r=s.getBoundingClientRect(),w=400/ZV.k;return [ZV.x-w/2+(cx-r.left)/r.width*w,ZV.y-w/2+(cy-r.top)/r.height*w]};
 new MutationObserver(()=>{if(ZV.k!==1)sv().forEach(zApply)}).observe(root.documentElement||root,{childList:true,subtree:true});
 root.addEventListener('pointerdown',e=>{const s=e.target.closest&&e.target.closest('svg.eaw');if(!s||e.pointerType==='mouse')return;pts.set(e.pointerId,[e.clientX,e.clientY]);st=null},true);
 root.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const s=e.target.closest&&e.target.closest('svg.eaw')||sv()[0];if(!s)return;pts.set(e.pointerId,[e.clientX,e.clientY]);const P=[...pts.values()];
  if(P.length>=2){const d=Math.hypot(P[0][0]-P[1][0],P[0][1]-P[1][1]),cx=(P[0][0]+P[1][0])/2,cy=(P[0][1]+P[1][1])/2;
   if(!st||st.n!==2){st={n:2,d,k:ZV.k,p:loc(s,cx,cy)};return}const r=s.getBoundingClientRect();ZV.k=st.k*d/st.d;zClamp();const w=400/ZV.k;
   ZV.x=st.p[0]-((cx-r.left)/r.width-.5)*w;ZV.y=st.p[1]-((cy-r.top)/r.height-.5)*w;zClamp();sv().forEach(zApply);e.preventDefault()}
  else if(ZV.k>1){if(!st||st.n!==1){st={n:1,c:P[0],x:ZV.x,y:ZV.y};return}const r=s.getBoundingClientRect(),w=400/ZV.k;ZV.x=st.x-(P[0][0]-st.c[0])/r.width*w;ZV.y=st.y-(P[0][1]-st.c[1])/r.height*w;zClamp();sv().forEach(zApply);e.preventDefault()}},{passive:false});
 const up=e=>{pts.delete(e.pointerId);st=null};root.addEventListener('pointerup',up,true);root.addEventListener('pointercancel',up,true);}
function zoomReset(){ZV.k=1;ZV.x=0;ZV.y=0;document.querySelectorAll('svg.eaw').forEach(zApply)}
function attach(root,cb){if(root)zoomable(root);if(!root||root.__eaw){if(root)root.__eaw=cb;return}root.__eaw=cb;let tm=null;
 root.addEventListener('click',e=>{const g=e.target.closest&&e.target.closest('[data-eaw="asp"]');if(!g)return;e.preventDefault();
  if(tm){clearTimeout(tm);tm=null;root.__eaw.dbl&&root.__eaw.dbl();return}tm=setTimeout(()=>{tm=null;root.__eaw.tap&&root.__eaw.tap()},260)});
 root.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('[data-eaw="asp"]');if(!g||(e.key!=='Enter'&&e.key!==' '))return;e.preventDefault();(e.shiftKey?root.__eaw.dbl:root.__eaw.tap)&&(e.shiftKey?root.__eaw.dbl():root.__eaw.tap())})}
window.EAWheel={svg,attach,zoomReset,themes:THEMES,spread,planetColors:{dark:PCD,light:PCL}};
})();

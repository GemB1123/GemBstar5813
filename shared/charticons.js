/* ---------- EAChartIcons: the chart icons under every chart label (Leo, Painter World, Nov 23 2026; Gemini: "make these icons global") ----------
   Three icons, each opening a small menu just below it:
     ⊕ Options  (the Earth glyph)   Save, Edit, Clear, Replace, Relocate, and for Transits the Clock switch
     🕒 Clock                        Now, Set Date And Time   (only under wheels that move with time: Transits, Progressions, Solar Arc)
     ◎ Wheels   (two circles)        the wheel chips, then the wheels to add (Transits, Secondary/Minor/Tertiary Progressions, Solar Arc,
                                     a partner chart, Swap, Davison, Composite). Apps with one wheel (the Moon) leave it out.
   Rules (Gemini, Nov 23): entered charts (birth, event, partner) get Options, plus Wheels when the chart is the inner one; added wheels
   (Transits, Progressions, Solar Arc) get all three. "Transits", never "Current Transits"; the label reads "Clock" while the Clock runs.

   Wheel chips: the charts on the wheel, inner to outer, left to right, in their ring colors, with two-letter codes astrologers use.
   Drag a chip left or right, or focus it and press Alt with ← or →, to change the wheel order. Click one for that chart's options.

   window.EAChartIcons
     ICON.options / ICON.clock / ICON.wheels / ICON.compass   SVG strings (18 px, currentColor); compass = Facing North, shown only for
                                               southern places (Gemini, Nov 23: every app, as in the Moon); button('compass',{open:on})
     CODE   {chart:'Ch', transits:'Tr', secondary:'Pr', minor:'MP', tertiary:'TP', solarArc:'SA', directions:'PD', profections:'Pf'}; partner n: 'C'+n
     COLOR  ring colors {chart:'#f5c35c', transits:'#d6dae2', progressions:'#8fb8ff', solarArc:'#86d9a5'}
     button(kind, {id, open, act, label, title})  one icon button (kind 'options' | 'clock' | 'wheels'); data-act defaults to 'eaci'
     chips(list, {blink})   list [{id, code, color, name}] inner to outer -> the chip row HTML (class .eaci-chips; chips are .eaci-chip, data-id)
     onMove(fn)             fn(id, toIndex) is called when a chip is dragged or moved with Alt+arrow; return true if the order changed
                            (the host redraws; focus returns to the moved chip)
     onChip(fn)             fn(id) for a plain click on a chip (open that chart's options)
   The host draws its own menus; the look (.eaci-*) is injected once below. */
(function(){
const SV=(b,w)=>`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linecap="round">${b}</svg>`;
const ICON={options:SV('<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>'),
 clock:SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>'),
 wheels:SV('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',1.7),
 /* Facing North compass rose (Kid's Moon app drawing, Gemini Nov 23: in every app, only for southern places) */
 compass:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".6"/><path d="M12 2.6 14.2 12h-4.4Z" fill="currentColor"/><path d="M12 21.4 9.8 12h4.4Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M2.6 12 12 10.3v3.4ZM21.4 12 12 10.3v3.4Z" fill="currentColor" opacity=".55"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>'};
const CODE={chart:'Ch',transits:'Tr',secondary:'Pr',minor:'MP',tertiary:'TP',solarArc:'SA',directions:'PD',profections:'Pf'};
const COLOR={chart:'#f5c35c',transits:'#d6dae2',progressions:'#8fb8ff',solarArc:'#86d9a5'};
const LAB={compass:['Facing North','Facing North: mirror the chart so the east is on the right (Southern Hemisphere)'],options:['Chart Options','Chart Options: Save, Edit, Clear, Replace'],clock:['Time: Now, Or Set The Date And Time','Now, Or Set The Date And Time'],wheels:['Wheels','Wheels: Transits, Progressions, Solar Arc, Synastry']};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function button(kind,o){o=o||{};const L=LAB[kind]||[kind,kind],op=!!o.open;
 return `<button type="button" data-act="${o.act||'eaci'}" data-id="${esc(o.id!=null?o.id:kind)}" class="bic eaci-b mn ${op?'op':''}" aria-expanded="${op}" aria-haspopup="menu" aria-label="${esc(o.label||L[0])}" title="${esc(o.title||L[1])}">${ICON[kind]||''}</button>`}
function chips(list,o){o=o||{};const n=list.length;
 return `<div class="eaci-chips wchips${o.blink?' blink':''}" role="list" aria-label="Wheels, inner to outer. Drag or press Alt and an arrow key to reorder">${list.map((c,i)=>`<button type="button" role="listitem" class="eaci-chip wch" draggable="true" data-act="${o.act||'wchip'}" data-id="${esc(c.id)}" style="--c:${esc(c.color||'#d6cdb8')}" title="${esc(c.name)}: wheel ${i+1} of ${n}${i===0?' (inner)':i===n-1?' (outer)':''}. Drag to reorder; click for options" aria-label="${esc(c.name)}, wheel ${i+1} of ${n}">${esc(c.code)}</button>`).join('')}</div>`}
let MOVE=null,CHIP=null;
const onMove=f=>{MOVE=f},onChip=f=>{CHIP=f};
const chipOf=e=>e.target&&e.target.closest&&e.target.closest('.eaci-chip');
document.addEventListener('dragstart',e=>{const c=chipOf(e);if(!c)return;e.dataTransfer.setData('text/plain',c.dataset.id);e.dataTransfer.effectAllowed='move'});
document.addEventListener('dragover',e=>{if(e.target.closest&&e.target.closest('.eaci-chips'))e.preventDefault()});
document.addEventListener('drop',e=>{const row=e.target.closest&&e.target.closest('.eaci-chips');if(!row||!MOVE)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain');
 const cs=[...row.querySelectorAll('.eaci-chip')].filter(c=>c.dataset.id!==id);let to=cs.length;for(let n=0;n<cs.length;n++){const r=cs[n].getBoundingClientRect();if(e.clientX<r.left+r.width/2){to=n;break}}   /* the place among the other chips */
 MOVE(id,to)});
document.addEventListener('keydown',e=>{const c=chipOf(e);if(!c||!MOVE||!e.altKey||(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'))return;e.preventDefault();e.stopImmediatePropagation();
 const id=c.dataset.id,cs=[...c.parentNode.querySelectorAll('.eaci-chip')],i=cs.indexOf(c);
 if(MOVE(id,i+(e.key==='ArrowLeft'?-1:1))){const f=document.querySelector(`.eaci-chip[data-id="${id}"]`);if(f)f.focus()}},true);
document.addEventListener('click',e=>{const c=chipOf(e);if(c&&CHIP&&c.dataset.act==='eaci-chip'){CHIP(c.dataset.id)}});
(function(){if(document.getElementById('eacicss'))return;const st=document.createElement('style');st.id='eacicss';st.textContent=`
.eaci-b{width:34px;height:30px;padding:0!important;display:inline-flex;align-items:center;justify-content:center}
.eaci-chips{display:flex;gap:5px;margin-bottom:2px}
.eaci-chip{flex:1;min-width:34px;font-weight:700;letter-spacing:.03em;text-align:center!important;border:1px solid var(--c)!important;color:var(--c)!important;background:rgba(0,0,0,.3)!important;border-radius:8px;padding:4px 8px;cursor:grab;font:inherit;font-size:11.5px;font-weight:700}
.eaci-chip:active{cursor:grabbing}.eaci-chip:focus-visible{outline:2px solid #ffd166;outline-offset:2px}
@keyframes eaciBlink{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 0 3px var(--c);background:rgba(255,255,255,.12)}}
.eaci-chips.blink .eaci-chip{animation:eaciBlink .7s ease-in-out 6}
@media (prefers-reduced-motion:reduce){.eaci-chips.blink .eaci-chip{animation:none;box-shadow:0 0 0 3px var(--c)}}`;(document.head||document.documentElement).appendChild(st)})();
window.EAChartIcons={ICON,CODE,COLOR,button,chips,onMove,onChip};
})();

/* ---------- EAIris: the iris transition between Worlds (Leo, Painter World, Nov 23 2026; lifted from Kid's Moon-in-the-Device iris) ----------
   Gemini, Nov 23: the standard transition between every World. The new World opens in a circle from the wheel's center while the old
   World's picture stays on screen around it (never a blank screen), slowly. Closing is the same in reverse.
   Honors the Device setting Settings > Startup/Shutdown > Transition Animations (window.EA_ANIM() returns false when it is off)
   and the system's Reduce Motion setting: then every switch is instant.

   window.EAIris
     swap(oldEl, draw, {x, y, r, ms, z, done})   the main one: a still copy of oldEl's picture is laid ON TOP, draw() paints the new
                                      World underneath at once, and a hole grows in the copy from (x, y) until the new World shows whole.
                                      Because the new World is drawn at full size before the hole opens, it is never blank inside the circle.
     open(el, {x, y, r, ms, done})    el appears through a growing circle at (x, y) in el's own pixels (default: its center)
     close(el, {x, y, r, ms, done})   el shrinks away to (x, y); el stays clipped to nothing until open() or clear()
     hole(el, {x, y, from, to, ms, done})   a see-through hole in el, radius from -> to (0 to 'full' by default); removed at the end
                                      when it closed to 0, kept when it ended open (call clear(el) to remove it)
     snap(el, {top, z})               a still copy of el's picture, in el's place (just under it, or on top with top:true)
     clear(el)                        stop any iris on el and show it whole
     on()                             true when animations should run
     MS                               the standard length in ms (1100; Gemini, Nov 23: slower); change it to change every World
   Frames run on requestAnimationFrame, so several pieces (a closing Moon and the wheel appearing around it) stay in step. */
(function(){
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;   /* ease in and out */
const on=()=>!(window.EA_ANIM&&!window.EA_ANIM())&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
function geo(el,o){const w=el.offsetWidth||el.clientWidth||0,h=el.offsetHeight||el.clientHeight||0,x=o.x!=null?o.x:w/2,y=o.y!=null?o.y:h/2;
 const r=o.r!=null?o.r:Math.ceil(Math.max(Math.hypot(x,y),Math.hypot(w-x,y),Math.hypot(x,h-y),Math.hypot(w-x,h-y)))+2;return {x,y,r}}
const C=(r,g)=>`circle(${Math.max(0,r).toFixed(1)}px at ${g.x}px ${g.y}px)`;
const M=(r,g)=>{r=Math.max(0,r);return `radial-gradient(circle at ${g.x}px ${g.y}px, transparent ${r.toFixed(1)}px, #000 ${(r+1).toFixed(1)}px)`};
function setMask(el,v){el.style.webkitMaskImage=v;el.style.maskImage=v}
function stop(el){if(el.__iris){cancelAnimationFrame(el.__iris.f);el.__iris=null}}
function clear(el){if(!el)return;stop(el);el.style.clipPath='';setMask(el,'')}
/* one animation on el: frame(p) for p 0..1 (eased), end() at the finish; instant when animations are off */
function run(el,o,frame,end){stop(el);const ms=o.ms||window.EAIris.MS;
 if(!on()){end();if(o.done)o.done();return}
 const job={f:0},t0=performance.now();el.__iris=job;frame(0);
 const step=now=>{if(el.__iris!==job)return;const t=Math.min(1,Math.max(0,(now-t0)/ms));frame(ease(t));if(t<1){job.f=requestAnimationFrame(step);return}el.__iris=null;end();if(o.done)o.done()};
 job.f=requestAnimationFrame(step)}
function open(el,o){if(!el)return;o=o||{};const g=geo(el,o);run(el,o,p=>{el.style.clipPath=C(g.r*p,g)},()=>{el.style.clipPath=''})}
function close(el,o){if(!el)return;o=o||{};const g=geo(el,o);run(el,o,p=>{el.style.clipPath=C(g.r*(1-p),g)},()=>{el.style.clipPath=C(0,g)})}
function hole(el,o){if(!el)return;o=o||{};const g=geo(el,o),a=o.from!=null?o.from:0,b=o.to!=null?o.to:g.r;
 run(el,o,p=>setMask(el,M(a+(b-a)*p,g)),()=>{if(b<=0)setMask(el,'');else setMask(el,M(b,g))})}
/* The copy keeps el's place and transform; ids inside are renamed (and their url(#…)/href="#…" uses) so they never clash with the new
   picture; canvases are copied pixel for pixel. */
function snap(el,o){o=o||{};if(!el||!el.parentNode)return null;const cs=getComputedStyle(el),c=document.createElement('div');c.className='eairis-snap';c.setAttribute('aria-hidden','true');
 c.style.cssText=`position:absolute;left:${el.offsetLeft}px;top:${el.offsetTop}px;width:${el.offsetWidth}px;height:${el.offsetHeight}px;pointer-events:none;transform:${cs.transform};transform-origin:${cs.transformOrigin}`+(o.z!=null?`;z-index:${o.z}`:'');
 for(const k of el.childNodes)c.appendChild(k.cloneNode(true));
 const ids={};c.querySelectorAll('[id]').forEach(n=>{const i=n.id,nw=i+'-eairis';ids[i]=nw;n.id=nw});
 if(Object.keys(ids).length)c.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes]){if(a.value.indexOf('#')<0)continue;
  const v=a.value.replace(/url\(#([^)]+)\)/g,(m,i)=>ids[i]?`url(#${ids[i]})`:m).replace(/^#(.+)$/,(m,i)=>ids[i]?'#'+ids[i]:m);if(v!==a.value)n.setAttribute(a.name,v)}});
 const src=el.querySelectorAll('canvas'),dst=c.querySelectorAll('canvas');src.forEach((cv,i)=>{try{dst[i].getContext('2d').drawImage(cv,0,0)}catch(e){}});
 el.parentNode.insertBefore(c,o.top?el.nextSibling:el);return c}
function swap(el,draw,o){o=o||{};document.querySelectorAll('.eairis-snap').forEach(n=>n.remove());
 const c=on()&&el?snap(el,{top:true,z:o.z}):null;try{draw()}finally{if(!c){if(o.done)o.done()}
  else{const g=geo(el,o);hole(c,{x:g.x,y:g.y,from:0,to:g.r,ms:o.ms,done:()=>{c.remove();if(o.done)o.done()}})}}}
window.EAIris={swap,open,close,hole,snap,clear,on,MS:1100};
})();

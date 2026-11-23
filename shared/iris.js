/* ---------- EAIris: the iris transition between Worlds (Leo, Painter World, Nov 23 2026; lifted from Kid's Moon-in-the-Device iris) ----------
   A circle opens from a point (usually the wheel's center) to show a new view, or closes to that point to hide one.
   Honors the Device setting Settings > Startup/Shutdown > Transition Animations (window.EA_ANIM() returns false when it is off)
   and the system's Reduce Motion setting: then the switch is instant.

   window.EAIris
     open(el, {x, y, r, ms, done})    el appears through a growing circle at (x, y) in el's own pixels (default: its center);
                                      r is the end radius (default: reaches every corner), ms the length (default 550)
     close(el, {x, y, r, ms, done})   el shrinks away to (x, y); done() runs at the end (or at once when animations are off).
                                      el stays clipped to nothing until open() or clear()
     clear(el)                        stop any iris on el and show it whole
     on()                             true when animations should run
   Uses the Web Animations API, so no CSS is needed; the clip is removed after an open finishes. */
(function(){
const EASE='cubic-bezier(.4,0,.2,1)';
const on=()=>!(window.EA_ANIM&&!window.EA_ANIM())&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
function geo(el,o){const w=el.offsetWidth||el.clientWidth||0,h=el.offsetHeight||el.clientHeight||0,x=o.x!=null?o.x:w/2,y=o.y!=null?o.y:h/2;
 const r=o.r!=null?o.r:Math.ceil(Math.max(Math.hypot(x,y),Math.hypot(w-x,y),Math.hypot(x,h-y),Math.hypot(w-x,h-y)))+2;return {x,y,r}}
const C=(r,g)=>`circle(${r}px at ${g.x}px ${g.y}px)`;
function stop(el){if(el.__iris){try{el.__iris.onfinish=null;el.__iris.cancel()}catch(e){}el.__iris=null}}
function clear(el){if(!el)return;stop(el);el.style.clipPath=''}
function run(el,o,from,to,end){o=o||{};stop(el);const g=geo(el,o);
 if(!on()||!el.animate){end(g);if(o.done)o.done();return}
 const a=el.animate([{clipPath:C(from(g),g)},{clipPath:C(to(g),g)}],{duration:o.ms||550,easing:EASE,fill:'forwards'});el.__iris=a;
 a.onfinish=()=>{if(el.__iris!==a)return;end(g);try{a.cancel()}catch(e){}el.__iris=null;if(o.done)o.done()}}
const open=(el,o)=>{if(el)run(el,o,()=>0,g=>g.r,()=>{el.style.clipPath=''})};
const close=(el,o)=>{if(el)run(el,o,g=>g.r,()=>0,g=>{el.style.clipPath=C(0,g)})};
window.EAIris={open,close,clear,on};
})();

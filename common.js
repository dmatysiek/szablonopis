// common.js
export const LS_KEY = "szablonopis_v1";
export const SALES_KEY = "qd_sales_v1";

export function saveLocal(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
export function loadLocal(key, fallback){ 
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
export const nf = new Intl.NumberFormat('pl-PL', { minimumFractionDigits:2, maximumFractionDigits:2 });

// „1-tap” zaznaczanie całej wartości w inputach (bez łapania scrolla)
export function enableTapSelect(el){
  if (!el) return;
  let sx=0, sy=0, moved=false, t0=0;
  const TH=6, TT=300;
  const selectAll = () => { try{ el.select(); }catch{} };
  el.addEventListener("pointerdown", e => { sx=e.clientX||0; sy=e.clientY||0; moved=false; t0=e.timeStamp||Date.now(); });
  el.addEventListener("pointermove", e => {
    const dx=Math.abs((e.clientX||0)-sx), dy=Math.abs((e.clientY||0)-sy);
    if (dx>TH || dy>TH) moved=true;
  });
  el.addEventListener("pointerup", e => {
    const dt=(e.timeStamp||Date.now())-t0;
    if (!moved && dt<TT) { if (document.activeElement!==el) el.focus(); setTimeout(selectAll,0); }
  });
  el.addEventListener("focus", () => setTimeout(selectAll,0));
}

// iOS: gdy klikasz nowy <select>, zdejmij focus ze starego – zapobiega „miganiu”
export function fixSelectFocus() {
  document.addEventListener('pointerdown', (ev) => {
    const t = ev.target;
    const isSelect = el => el && el.tagName === 'SELECT';
    if (isSelect(t)) {
      const ae = document.activeElement;
      if (isSelect(ae) && ae !== t) { try { ae.blur(); } catch {} }
    }
  }, true);
}

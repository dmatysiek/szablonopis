// common.js
export const LS_KEY = "szablonopis_v1";
export const SALES_KEY = "qd_sales_v1";

// --- LocalStorage helpers ---
export function saveLocal(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
export function loadLocal(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

// --- Liczby / waluty ---
export const nf = new Intl.NumberFormat('pl-PL', { minimumFractionDigits:2, maximumFractionDigits:2 });
export const fmtPLN = (v) => (Number(v)||0).toLocaleString('pl-PL', { style:'currency', currency:'PLN' });

// parseDecimal — tolerancyjny parser liczb dziesiętnych (iOS: przecinki itp.)
export function parseDecimal(input){
  if (input == null) return 0;
  let s = String(input).trim();
  if (!s) return 0;
  s = s.replace(/[\s\u00A0\u202F\u2007\u2009\u2060]+/g, "");  // wyrzuć WSZYSTKIE spacje (w tym NBSP/narrow)
  s = s.replace(/[^0-9,.\-]/g, "");                          // tylko cyfry, przecinki, kropki, minus
  s = s.replace(/,/g, ".");                                  // przecinki -> kropki
  const parts = s.split(".");
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join(""); // tylko pierwszy separator dziesiętny
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return 0;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : 0;
}

// --- Daty / zakresy miesięcy ---
export const ymKey = (d) => d.toISOString().slice(0,7);
export function monthRange(ym){
  const [y,m] = ym.split('-').map(Number);
  const from = new Date(Date.UTC(y, m-1, 1));
  const to   = new Date(Date.UTC(y, m,   1));
  return { from: from.toISOString(), to: to.toISOString() };
}
export function todayLocalYYYYMMDD(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// --- UX helpers ---
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

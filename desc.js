import { LS_KEY, enableTapSelect, fixSelectFocus } from './common.js';

fixSelectFocus();

const pairs = [
  ["stan", "v-stan"],
  ["rozmiar", "v-rozmiar"],
  ["kolor", "v-kolor"],
  ["dlugosc", "v-dlugosc"],
  ["szerokosc", "v-szerokosc"],
  ["rekaw", "v-rekaw"],
];

const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
const state = {};

// opcjonalna linijka
const uwagiOn    = document.getElementById("uwagiOn");
const uwagiText  = document.getElementById("uwagiText");
const uwagiWrap  = document.getElementById("v-uwagi-wrap");
const uwagiSpan  = document.getElementById("v-uwagi");
const uwagiLabel = document.getElementById("uwagiLabel");
const uwagiRow   = document.getElementById("uwagiRow");

if (uwagiOn && saved.uwagiOn) uwagiOn.checked = true;
if (uwagiText && typeof saved.uwagiText === "string") uwagiText.value = saved.uwagiText;

function renderUwagi() {
  if (!uwagiOn || !uwagiText || !uwagiLabel || !uwagiWrap || !uwagiSpan || !uwagiRow) return;
  const enabled = uwagiOn.checked;
  const txt = (uwagiText.value || "").trim();
  state.uwagiOn = enabled;
  state.uwagiText = uwagiText.value || "";
  if (enabled) { uwagiRow.style.marginBottom = "0px"; uwagiLabel.style.display = "block"; uwagiLabel.style.margin = "0 0 12px 0"; }
  else { uwagiLabel.style.display = "none"; uwagiRow.style.marginBottom = "12px"; }
  if (enabled && txt) { uwagiSpan.textContent = txt; uwagiWrap.style.display = "inline"; }
  else { uwagiSpan.textContent = ""; uwagiWrap.style.display = "none"; }
}
uwagiOn?.addEventListener("change", () => { renderUwagi(); scheduleSave(); });
uwagiText?.addEventListener("input", () => { renderUwagi(); scheduleSave(); });
renderUwagi();

// mapowanie pól
for (const [inputId, viewId] of pairs) {
  const input = document.getElementById(inputId);
  const view  = document.getElementById(viewId);
  if (!input || !view) continue;

  if (saved[inputId] !== undefined) input.value = saved[inputId];

  const renderValue = () => {
    const raw = input.value?.toString().trim();
    const suffix = input.dataset.suffix || "";
    view.textContent = raw ? (suffix ? `${raw}${suffix}` : raw) : "";
    state[inputId] = input.value;
  };
  renderValue();

  input.addEventListener("input", () => { renderValue(); scheduleSave(); });
}

// „tap-select” dla liczb
["dlugosc","szerokosc","rekaw"].forEach(id => enableTapSelect(document.getElementById(id)));

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { localStorage.setItem(LS_KEY, JSON.stringify(state)); }, 150);
}

document.getElementById("copy")?.addEventListener("click", async () => {
  const pre = document.querySelector(".card pre") || document.querySelector("pre");
  const text = pre ? pre.innerText : "";
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("copy");
    const old = btn.textContent; btn.textContent = "Skopiowano ✓";
    setTimeout(()=> btn.textContent = old, 1200);
  } catch {
    alert("Nie udało się skopiować. Zaznacz tekst ręcznie i użyj Ctrl/Cmd+C.");
  }
});

window.addEventListener("beforeunload", () => {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
});

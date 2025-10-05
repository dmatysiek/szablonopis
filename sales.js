// sales.js
import { supabase } from './supabase.js';

// --- DOM ---
const wrap = document.getElementById('appWrap');
const monthPicker = document.getElementById('monthPicker');
const tbody  = document.getElementById('salesTbody');
const tCost  = document.getElementById('t-cost');
const tRev   = document.getElementById('t-rev');
const tProfit= document.getElementById('t-profit');

const addBtn = document.getElementById('addSale');
const inDate = document.getElementById('s-date');
const inName = document.getElementById('s-name');
const inCost = document.getElementById('s-cost');
const inRev  = document.getElementById('s-rev');
const inPhoto= document.getElementById('s-photo');
const photoPreview = document.getElementById('photoPreview');

const exportBtn = document.getElementById('exportCsv');
const clearBtn  = document.getElementById('clearMonth');

// login modal (z auth.js) – tylko wywołujemy jeśli trzeba
const loginModal = document.getElementById('loginModal');
function openLogin(){ loginModal?.classList.add('open'); loginModal?.setAttribute('aria-hidden','false'); }
function closeLogin(){ loginModal?.classList.remove('open'); loginModal?.setAttribute('aria-hidden','true'); }

// --- Utils ---
const fmtPLN = v => (Number(v)||0).toLocaleString('pl-PL', { style:'currency', currency:'PLN' });
const ymKey  = d => d.toISOString().slice(0,7);

function monthRange(ym){
  const [y,m] = ym.split('-').map(Number);
  const from = new Date(Date.UTC(y, m-1, 1));
  const to   = new Date(Date.UTC(y, m,   1));
  return { from: from.toISOString(), to: to.toISOString() };
}

let UID = null;
let currentYM = null;
let rows = []; // ostatnio pobrane wiersze

// --- Gating: pokaż stronę dopiero po zalogowaniu ---
async function ensureLoggedIn(){
  const { data:{ session } } = await supabase.auth.getSession();
  if (!session?.user){
    wrap.hidden = true;
    openLogin();
    return null;
  }
  UID = session.user.id;
  wrap.hidden = false;
  return UID;
}

supabase.auth.onAuthStateChange((_ev, session) => {
  UID = session?.user?.id || null;
  if (UID){
    wrap.hidden = false; closeLogin();
    if (currentYM) loadMonth(currentYM);
  } else {
    wrap.hidden = true;  openLogin();
  }
});

// --- Storage (opcjonalne zdjęcia) ---
async function uploadPhotoIfAny(file){
  if (!file) return null;
  // wymaga bucketu "qd-photos" (Public) – patrz instrukcja
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${UID}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from('qd-photos').upload(path, file, {
    cacheControl: '3600', upsert:false
  });
  if (error) { alert('Nie udało się wgrać zdjęcia: ' + error.message); return null; }
  const { data: { publicUrl } } = supabase.storage.from('qd-photos').getPublicUrl(data.path);
  return publicUrl || null;
}

// --- CRUD Supabase ---
async function fetchMonth(ym){
  const { from, to } = monthRange(ym);
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', UID)
    .gte('sold_at', from)
    .lt('sold_at',  to)
    .order('sold_at', { ascending:true })
    .order('created_at', { ascending:true });

  if (error){ alert('Błąd pobierania: ' + error.message); return []; }
  return data || [];
}

async function insertRow({ sold_at, name, cost, revenue, photo_url }){
  const { data, error } = await supabase
    .from('sales')
    .insert([{ user_id: UID, sold_at, name, cost, revenue, photo_url }])
    .select()
    .single();
  if (error){ alert('Błąd dodawania: ' + error.message); return null; }
  return data;
}

async function updateRow(id, patch){
  const { data, error } = await supabase
    .from('sales')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', UID)
    .select()
    .single();
  if (error){ alert('Błąd edycji: ' + error.message); return null; }
  return data;
}

async function deleteRow(id){
  const { error } = await supabase.from('sales')
    .delete()
    .eq('id', id)
    .eq('user_id', UID);
  if (error){ alert('Błąd usuwania: ' + error.message); }
}

// --- Render ---
function renderTable(){
  tbody.innerHTML = '';
  let sumC = 0, sumR = 0;

  rows.forEach((r, idx) => {
    sumC += Number(r.cost)||0;
    sumR += Number(r.revenue)||0;

    const tr = document.createElement('tr');

    // #
    const tdIdx = document.createElement('td'); tdIdx.className = 'num';
    tdIdx.textContent = (idx+1).toString();
    tr.appendChild(tdIdx);

    // data
    const tdD = document.createElement('td');
    tdD.textContent = r.sold_at;
    tr.appendChild(tdD);

    // foto
    const tdF = document.createElement('td');
    if (r.photo_url){
      const img = document.createElement('img');
      img.src = r.photo_url;
      img.alt = 'foto';
      img.style.width = '36px';
      img.style.height = '48px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '6px';
      img.loading = 'lazy';
      tdF.appendChild(img);
    } else {
      tdF.innerHTML = '<span class="muted">—</span>';
    }
    tr.appendChild(tdF);

    // nazwa
    const tdN = document.createElement('td'); tdN.textContent = r.name; tr.appendChild(tdN);

    // koszt / rev / profit
    const tdC = document.createElement('td'); tdC.className='num'; tdC.textContent = fmtPLN(r.cost); tr.appendChild(tdC);
    const tdR = document.createElement('td'); tdR.className='num'; tdR.textContent = fmtPLN(r.revenue); tr.appendChild(tdR);
    const tdP = document.createElement('td'); tdP.className='num'; tdP.textContent = fmtPLN((r.revenue||0)-(r.cost||0)); tr.appendChild(tdP);

    // akcje
    const tdA = document.createElement('td'); tdA.className='row-actions';
    const btnE = document.createElement('button'); btnE.className='icon-btn'; btnE.textContent='✎';
    const btnD = document.createElement('button'); btnD.className='icon-btn'; btnD.textContent='🗑';
    btnE.title = 'Edytuj'; btnD.title = 'Usuń';
    btnE.onclick = () => openEdit(r);
    btnD.onclick = async () => { if (confirm('Usunąć pozycję?')) { await deleteRow(r.id); await loadMonth(currentYM); } };
    tdA.append(btnE, btnD);
    tr.appendChild(tdA);

    tbody.appendChild(tr);
  });

  tCost.textContent   = fmtPLN(sumC);
  tRev.textContent    = fmtPLN(sumR);
  tProfit.textContent = fmtPLN(sumR - sumC);
}

async function loadMonth(ym){
  currentYM = ym;
  rows = await fetchMonth(ym);
  renderTable();
}

// --- Add ---
addBtn.addEventListener('click', async () => {
  if (!UID) { openLogin(); return; }
  const sold_at = (inDate.value || '').trim();
  const name    = (inName.value || '').trim();
  const cost    = Number(inCost.value || 0);
  const revenue = Number(inRev.value  || 0);
  if (!sold_at || !name){ alert('Uzupełnij datę i nazwę.'); return; }

  let photo_url = null;
  if (inPhoto.files?.[0]) {
    photo_url = await uploadPhotoIfAny(inPhoto.files[0]);
  }

  const row = await insertRow({ sold_at, name, cost, revenue, photo_url });
  if (row){
    // szybkie odświeżenie listy
    await loadMonth(currentYM);
    // reset formu
    inName.value=''; inCost.value=''; inRev.value=''; inPhoto.value=''; photoPreview.innerHTML='';
  }
});

// podgląd miniatury (lokalnie)
inPhoto?.addEventListener('change', () => {
  photoPreview.innerHTML = '';
  const f = inPhoto.files?.[0];
  if (!f) return;
  const img = document.createElement('img');
  img.src = URL.createObjectURL(f);
  img.onload = () => URL.revokeObjectURL(img.src);
  img.style.width='72px'; img.style.height='96px'; img.style.objectFit='cover'; img.style.borderRadius='8px';
  photoPreview.appendChild(img);
});

// --- Export CSV (z bieżących „rows”) ---
exportBtn.addEventListener('click', () => {
  const lines = [['#','data','nazwa','koszt','przychod','dochod']];
  rows.forEach((r,i)=> lines.push([
    i+1, r.sold_at, r.name, String(r.cost).replace('.',','), String(r.revenue).replace('.',','), String((r.revenue||0)-(r.cost||0)).replace('.',',')
  ]));
  const csv = lines.map(a => a.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sprzedaz_${currentYM||ymKey(new Date())}.csv`;
  a.click(); URL.revokeObjectURL(a.href);
});

// --- Clear month (usuń wszystkie rekordy danego miesiąca) ---
clearBtn.addEventListener('click', async () => {
  if (!UID || !currentYM) return;
  if (!confirm('Na pewno usunąć wszystkie pozycje w tym miesiącu?')) return;
  const { from, to } = monthRange(currentYM);
  const { error } = await supabase.from('sales')
    .delete()
    .eq('user_id', UID)
    .gte('sold_at', from)
    .lt('sold_at',  to);
  if (error){ alert('Błąd czyszczenia: ' + error.message); return; }
  await loadMonth(currentYM);
});

// --- Edit modal (użyj swoich istniejących elementów / handlerów) ---
let editing = null;
const eModal = document.getElementById('editModal');
const eDate  = document.getElementById('e-date');
const eName  = document.getElementById('e-name');
const eCost  = document.getElementById('e-cost');
const eRev   = document.getElementById('e-rev');
const ePhoto = document.getElementById('e-photo');
const ePrev  = document.getElementById('ePhotoPreview');
const eSave  = document.getElementById('eSave');
const eCancel= document.getElementById('eCancel');
const eCancelTop = document.getElementById('eCancelTop');
const eClearPhoto= document.getElementById('eClearPhoto');

function openEdit(r){
  editing = r;
  eDate.value = r.sold_at;
  eName.value = r.name;
  eCost.value = r.cost;
  eRev.value  = r.revenue;
  ePrev.innerHTML = '';
  if (r.photo_url){
    const img = document.createElement('img');
    img.src = r.photo_url; img.style.width='72px'; img.style.height='96px'; img.style.objectFit='cover'; img.style.borderRadius='8px';
    ePrev.appendChild(img);
  }
  eModal.classList.add('open'); eModal.setAttribute('aria-hidden','false');
}
function closeEdit(){ editing=null; eModal.classList.remove('open'); eModal.setAttribute('aria-hidden','true'); }

eSave.addEventListener('click', async () => {
  if (!editing) return;
  let patch = {
    sold_at: eDate.value,
    name: eName.value.trim(),
    cost: Number(eCost.value||0),
    revenue: Number(eRev.value||0)
  };
  if (ePhoto.files?.[0]){
    const url = await uploadPhotoIfAny(ePhoto.files[0]);
    if (url) patch.photo_url = url;
  }
  const updated = await updateRow(editing.id, patch);
  if (updated){ closeEdit(); await loadMonth(currentYM); }
});
eCancel.addEventListener('click', closeEdit);
eCancelTop.addEventListener('click', closeEdit);
eModal.addEventListener('click', (e)=> { if (e.target.classList?.contains('modal-backdrop')) closeEdit(); });
eClearPhoto.addEventListener('click', async () => {
  if (!editing) return;
  if (confirm('Usunąć zdjęcie z rekordu?')){
    const updated = await updateRow(editing.id, { photo_url: null });
    if (updated){ await loadMonth(currentYM); openEdit(updated); } // odśwież podgląd
  }
});

// --- Start ---
(async () => {
  const uid = await ensureLoggedIn();
  if (!uid) return;        // pokaże modal i wstrzyma UI
  // ustaw domyślny miesiąc = bieżący
  const now = new Date();
  const ym = ymKey(now);
  monthPicker.value = ym;
  await loadMonth(ym);
})();
monthPicker.addEventListener('change', async () => {
  if (!UID) return;
  await loadMonth(monthPicker.value);
});

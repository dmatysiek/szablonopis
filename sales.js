import { SALES_KEY, loadLocal, saveLocal, nf, enableTapSelect } from './common.js';

const sales = loadLocal(SALES_KEY, []); // [{id,date,name,cost,rev,photo?}]
const monthPicker = document.getElementById('monthPicker');
const now = new Date();
const curMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const lastMonth = localStorage.getItem('qd_last_month') || curMonthStr;
monthPicker.value = lastMonth;

const sDate  = document.getElementById('s-date');
const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
sDate.value = todayStr;

const sName  = document.getElementById('s-name');
const sCost  = document.getElementById('s-cost');
const sRev   = document.getElementById('s-rev');
const sPhoto = document.getElementById('s-photo');
const photoPreview = document.getElementById('photoPreview');

// tap-select dla kwot
enableTapSelect(sCost);
enableTapSelect(sRev);

const tbody   = document.getElementById('salesTbody');
const tCost   = document.getElementById('t-cost');
const tRev    = document.getElementById('t-rev');
const tProfit = document.getElementById('t-profit');

// ---- Modal Edycji ----
const editModal     = document.getElementById('editModal');
const eDate         = document.getElementById('e-date');
const eName         = document.getElementById('e-name');
const eCost         = document.getElementById('e-cost');
const eRev          = document.getElementById('e-rev');
const ePhoto        = document.getElementById('e-photo');
const ePhotoPreview = document.getElementById('ePhotoPreview');
const eSave         = document.getElementById('eSave');
const eCancel       = document.getElementById('eCancel');
const eCancelTop    = document.getElementById('eCancelTop');
const eClearPhoto   = document.getElementById('eClearPhoto');

enableTapSelect(eCost);
enableTapSelect(eRev);

let currentEditId = null;
let markClearPhoto = false;

function saveSales(){ saveLocal(SALES_KEY, sales); }
function monthOf(dStr){ return dStr ? dStr.slice(0,7) : ''; }
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// --- Miniatura 3:4 (300x400) z pliku ----
async function fileToThumb(file, targetW=300, targetH=400, quality=0.85){
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const img = await new Promise((resolve,reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  const scale = Math.max(targetW / img.width, targetH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (targetW - dw) / 2;
  const dy = (targetH - dh) / 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,targetW,targetH);
  ctx.drawImage(img, dx, dy, dw, dh);
  return canvas.toDataURL('image/jpeg', quality);
}

// Podgląd zdjęcia przy dodawaniu
sPhoto.addEventListener('change', async () => {
  photoPreview.innerHTML = '';
  const f = sPhoto.files?.[0];
  if (!f) return;
  try{
    const thumb = await fileToThumb(f);
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = thumb;
    img.alt = 'miniatura';
    photoPreview.appendChild(img);
  } catch {
    alert('Nie udało się przetworzyć zdjęcia.');
  }
});

function renderSales(){
  const m = monthPicker.value || curMonthStr;
  localStorage.setItem('qd_last_month', m);
  tbody.innerHTML = '';
  let sumC=0, sumR=0;

  const items = sales.filter(x => monthOf(x.date)===m)
                     .sort((a,b)=> (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  items.forEach((it, idx) => {
    const seq = idx + 1;
    const profit = (+it.rev||0) - (+it.cost||0);
    sumC += (+it.cost||0);
    sumR += (+it.rev||0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="num">${seq}</td>
      <td>${it.date}</td>
      <td>${it.photo ? `<img class="thumb" src="${it.photo}" alt="foto">` : `—`}</td>
      <td>${escapeHtml(it.name || '')}</td>
      <td class="num">${nf.format(+it.cost||0)} zł</td>
      <td class="num">${nf.format(+it.rev||0)} zł</td>
      <td class="num">${nf.format(profit)} zł</td>
      <td class="row-actions">
        <button class="icon-btn" data-edit="${it.id}" title="Edytuj">✏️</button>
        <button class="icon-btn" data-del="${it.id}" title="Usuń">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tCost.textContent   = `${nf.format(sumC)} zł`;
  tRev.textContent    = `${nf.format(sumR)} zł`;
  tProfit.textContent = `${nf.format(sumR - sumC)} zł`;
}

// Dodawanie pozycji
document.getElementById('addSale').addEventListener('click', async () => {
  const date = sDate.value || todayStr;
  const name = (sName.value || '').trim();
  const cost = parseFloat(String(sCost.value).replace(',','.')) || 0;
  const rev  = parseFloat(String(sRev.value).replace(',','.')) || 0;
  if (!name){ alert('Podaj nazwę przedmiotu.'); return; }

  let photo = null;
  const f = sPhoto.files?.[0];
  if (f) { try { photo = await fileToThumb(f); } catch { photo = null; } }

  sales.push({
    id: Date.now().toString(36)+Math.random().toString(36).slice(2,7),
    date, name, cost, rev, photo
  });
  saveSales();

  sName.value = '';
  sCost.value = '';
  sRev.value  = '';
  sPhoto.value = '';
  photoPreview.innerHTML = '';

  renderSales();
});

// Obsługa akcji w tabeli (edit/delete)
tbody.addEventListener('click', (e) => {
  const delBtn = e.target.closest('button[data-del]');
  const editBtn = e.target.closest('button[data-edit]');
  if (delBtn){
    const id = delBtn.getAttribute('data-del');
    const idx = sales.findIndex(x => x.id === id);
    if (idx >= 0 && confirm('Usunąć tę pozycję?')){
      sales.splice(idx,1);
      saveSales();
      renderSales();
    }
    return;
  }
  if (editBtn){
    const id = editBtn.getAttribute('data-edit');
    openEdit(id);
  }
});

// ---------- MODAL: logika ----------

function openEdit(id){
  const it = sales.find(x => x.id === id);
  if (!it) return;
  currentEditId = id;
  markClearPhoto = false;

  eDate.value = it.date || '';
  eName.value = it.name || '';
  eCost.value = (it.cost ?? '') === '' ? '' : String(it.cost);
  eRev.value  = (it.rev  ?? '') === '' ? '' : String(it.rev);

  ePhoto.value = '';
  ePhotoPreview.innerHTML = '';
  if (it.photo){
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = it.photo;
    img.alt = 'miniatura';
    ePhotoPreview.appendChild(img);
  }

  editModal.setAttribute('aria-hidden','false');
  editModal.classList.add('open');
}

function closeEdit(){
  currentEditId = null;
  markClearPhoto = false;
  ePhoto.value = '';
  ePhotoPreview.innerHTML = '';
  editModal.classList.remove('open');
  editModal.setAttribute('aria-hidden','true');
}

eCancel.addEventListener('click', closeEdit);
eCancelTop.addEventListener('click', closeEdit);
editModal.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) closeEdit();
});

// podgląd nowo wybranego zdjęcia w edycji
ePhoto.addEventListener('change', async () => {
  markClearPhoto = false;
  ePhotoPreview.innerHTML = '';
  const f = ePhoto.files?.[0];
  if (!f) return;
  try{
    const thumb = await fileToThumb(f);
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = thumb;
    img.alt = 'miniatura';
    ePhotoPreview.appendChild(img);
  } catch {
    alert('Nie udało się przetworzyć zdjęcia.');
  }
});

// usuń zdjęcie (nieobowiązkowe)
eClearPhoto.addEventListener('click', (e) => {
  e.preventDefault();
  ePhoto.value = '';
  ePhotoPreview.innerHTML = '';
  markClearPhoto = true;
});

// zapisz zmiany
eSave.addEventListener('click', async () => {
  if (!currentEditId) return;
  const it = sales.find(x => x.id === currentEditId);
  if (!it) return;

  const name = (eName.value || '').trim();
  if (!name){ alert('Podaj nazwę przedmiotu.'); return; }

  it.date = eDate.value || it.date;
  it.name = name;
  it.cost = parseFloat(String(eCost.value).replace(',','.'));
  if (isNaN(it.cost)) it.cost = 0;
  it.rev  = parseFloat(String(eRev.value).replace(',','.'));
  if (isNaN(it.rev)) it.rev = 0;

  // foto: albo wybrano nowe, albo zaznaczono „usuń”
  const f = ePhoto.files?.[0];
  if (f){
    try { it.photo = await fileToThumb(f); } catch { /* bez zmian */ }
  } else if (markClearPhoto){
    it.photo = null;
  }

  saveSales();
  renderSales();
  closeEdit();
});

monthPicker.addEventListener('change', renderSales);
renderSales();

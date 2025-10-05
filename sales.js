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

const tbody = document.getElementById('salesTbody');
const tCost = document.getElementById('t-cost');
const tRev  = document.getElementById('t-rev');
const tProfit = document.getElementById('t-profit');

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

  // canvas cover (object-fit: cover)
  const canvas = document.createElement('canvas');
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  const scale = Math.max(targetW / img.width, targetH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (targetW - dw) / 2;
  const dy = (targetH - dh) / 2;

  ctx.fillStyle = '#000'; // tło, gdyby były paski
  ctx.fillRect(0,0,targetW,targetH);
  ctx.drawImage(img, dx, dy, dw, dh);

  return canvas.toDataURL('image/jpeg', quality);
}

// Podgląd wybranego zdjęcia (miniatura)
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
    const seq = idx + 1; // numeracja od 1 w obrębie miesiąca (widokowa)
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

  // jeśli jest zdjęcie -> zrób miniaturę
  let photo = null;
  const f = sPhoto.files?.[0];
  if (f) {
    try { photo = await fileToThumb(f); } catch { photo = null; }
  }

  sales.push({
    id: Date.now().toString(36)+Math.random().toString(36).slice(2,7),
    date, name, cost, rev, photo
  });
  saveSales();

  // czyść pola
  sName.value = '';
  sCost.value = '';
  sRev.value  = '';
  sPhoto.value = '';
  photoPreview.innerHTML = '';

  renderSales();
});

// Kasowanie
tbody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-del]');
  if (!btn) return;
  const id = btn.getAttribute('data-del');
  const idx = sales.findIndex(x => x.id === id);
  if (idx >= 0){
    if (confirm('Usunąć tę pozycję?')){
      sales.splice(idx,1);
      saveSales();
      renderSales();
    }
  }
});

// Wyczyść miesiąc
document.getElementById('clearMonth').addEventListener('click', () => {
  const m = monthPicker.value || curMonthStr;
  const has = sales.some(x => monthOf(x.date)===m);
  if (!has){ alert('Brak pozycji w tym miesiącu.'); return; }
  if (confirm(`Usunąć wszystkie pozycje dla ${m}?`)){
    for (let i=sales.length-1;i>=0;i--){
      if (monthOf(sales[i].date)===m) sales.splice(i,1);
    }
    saveSales();
    renderSales();
  }
});

// Eksport CSV (dodajemy kolumnę # na początku, zdjęć nie eksportujemy)
document.getElementById('exportCsv').addEventListener('click', () => {
  const m = monthPicker.value || curMonthStr;
  const rows = sales.filter(x => monthOf(x.date)===m)
                    .sort((a,b)=> (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const header = ['#','Data','Nazwa','Koszt','Przychód','Dochód'];
  const lines = [header.join(';')];

  rows.forEach((r, idx) => {
    const profit = (+r.rev||0) - (+r.cost||0);
    const seq = idx + 1;
    lines.push([seq, r.date, r.name.replaceAll(';',','), (r.cost||0), (r.rev||0), profit].join(';'));
  });

  const csv = lines.join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sprzedaz_${m}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

monthPicker.addEventListener('change', renderSales);
renderSales();

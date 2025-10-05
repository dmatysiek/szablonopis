import { SALES_KEY, loadLocal, saveLocal, nf, enableTapSelect } from './common.js';

const sales = loadLocal(SALES_KEY, []); // [{id,date,name,cost,rev}]
const monthPicker = document.getElementById('monthPicker');
const now = new Date();
const curMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
const lastMonth = localStorage.getItem('qd_last_month') || curMonthStr;
monthPicker.value = lastMonth;

const sDate = document.getElementById('s-date');
const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
sDate.value = todayStr;

const sName = document.getElementById('s-name');
const sCost = document.getElementById('s-cost');
const sRev  = document.getElementById('s-rev');

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

function renderSales(){
  const m = monthPicker.value || curMonthStr;
  localStorage.setItem('qd_last_month', m);
  tbody.innerHTML = '';
  let sumC=0, sumR=0;

  const items = sales.filter(x => monthOf(x.date)===m)
                     .sort((a,b)=> (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  for (const it of items){
    const profit = (+it.rev||0) - (+it.cost||0);
    sumC += (+it.cost||0);
    sumR += (+it.rev||0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.date}</td>
      <td>${escapeHtml(it.name || '')}</td>
      <td class="num">${nf.format(+it.cost||0)} zł</td>
      <td class="num">${nf.format(+it.rev||0)} zł</td>
      <td class="num">${nf.format(profit)} zł</td>
      <td class="row-actions">
        <button class="icon-btn" data-del="${it.id}" title="Usuń">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tCost.textContent   = `${nf.format(sumC)} zł`;
  tRev.textContent    = `${nf.format(sumR)} zł`;
  tProfit.textContent = `${nf.format(sumR - sumC)} zł`;
}

// Dodawanie pozycji
document.getElementById('addSale').addEventListener('click', () => {
  const date = sDate.value || todayStr;
  const name = (sName.value || '').trim();
  const cost = parseFloat(String(sCost.value).replace(',','.')) || 0;
  const rev  = parseFloat(String(sRev.value).replace(',','.')) || 0;

  if (!name){ alert('Podaj nazwę przedmiotu.'); return; }

  sales.push({ id: Date.now().toString(36)+Math.random().toString(36).slice(2,7), date, name, cost, rev });
  saveSales();

  sName.value = '';
  sCost.value = '';
  sRev.value  = '';
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

// Eksport CSV
document.getElementById('exportCsv').addEventListener('click', () => {
  const m = monthPicker.value || curMonthStr;
  const rows = sales.filter(x => monthOf(x.date)===m)
                    .sort((a,b)=> (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const header = ['Data','Nazwa','Koszt','Przychód','Dochód'];
  const lines = [header.join(';')];
  rows.forEach(r => {
    const profit = (+r.rev||0) - (+r.cost||0);
    lines.push([r.date, r.name.replaceAll(';',','), (r.cost||0), (r.rev||0), profit].join(';'));
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

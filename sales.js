<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <title>QuickDesc — Sprzedaż</title>
  <link rel="manifest" href="manifest.webmanifest?v=38">
  <meta name="theme-color" content="#0b0b0c">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link rel="apple-touch-icon" href="icon-192.png">
  <link rel="stylesheet" href="styles.css?v=38">
</head>
<body>
  <div class="topbar">
    <div class="topbar-inner">
      <div class="title">QuickDesc</div>
      <div class="tabs">
        <a class="tab" href="./index.html">Opis</a>
        <a class="tab active" href="./sales.html">Sprzedaż</a>
      </div>
    </div>
  </div>

  <div class="wrap">
    <!-- Filtr miesiąc/rok -->
    <div class="card card-pad">
      <div class="form-grid">
        <div class="field">
          <label>Miesiąc</label>
          <input id="monthPicker" class="control" type="month" />
        </div>
      </div>
    </div>

    <!-- Formularz dodawania pozycji -->
    <div class="card card-pad">
      <div class="form-grid">
        <div class="field">
          <label>Data sprzedaży</label>
          <input id="s-date" class="control" type="date">
        </div>
        <div class="field">
          <label>Nazwa przedmiotu</label>
          <input id="s-name" class="control" type="text" placeholder="np. Bluza Nike Vintage">
        </div>
        <div class="field">
          <label>Koszt (PLN)</label>
          <input id="s-cost" class="control" type="number" inputmode="decimal" step="0.01" min="0" placeholder="np. 40.00">
        </div>
        <div class="field">
          <label>Przychód (PLN)</label>
          <input id="s-rev" class="control" type="number" inputmode="decimal" step="0.01" min="0" placeholder="np. 89.00">
        </div>
        <button id="addSale" class="btn">Dodaj pozycję</button>
      </div>
    </div>

    <!-- Lista i sumy -->
    <div class="card card-pad">
      <div class="muted" style="margin-bottom:8px;">Pozycje dla wybranego miesiąca</div>
      <div style="overflow-x:auto;">
        <table class="table" id="salesTable">
          <thead>
            <tr>
              <th>Data</th>
              <th>Nazwa</th>
              <th class="num">Koszt</th>
              <th class="num">Przychód</th>
              <th class="num">Dochód</th>
              <th class="row-actions">Akcje</th>
            </tr>
          </thead>
          <tbody id="salesTbody"></tbody>
        </table>
      </div>

      <div class="totals" id="totalsBox">
        <div class="muted">Suma kosztów</div><div class="num" id="t-cost">0,00 zł</div>
        <div class="muted">Suma przychodów</div><div class="num" id="t-rev">0,00 zł</div>
        <div><b>Dochód</b></div><div class="num"><b id="t-profit">0,00 zł</b></div>
      </div>

      <div class="btn-row" style="margin-top:12px;">
        <button id="exportCsv" class="btn small">Eksport CSV</button>
        <button id="clearMonth" class="btn small" style="border-color:rgba(255,0,0,.25)">Wyczyść miesiąc</button>
      </div>
    </div>
  </div>

  <script type="module" src="sales.js?v=38"></script>
  <script>
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=38');
  </script>
</body>
</html>

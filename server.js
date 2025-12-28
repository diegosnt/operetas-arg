require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

async function fetchPurchases() {
  const response = await fetch(process.env.API_URL, {
    method: 'GET',
    headers: {
      'apikey': process.env.API_KEY,
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function fetchTotalSummary() {
  const response = await fetch(process.env.API_URL_TOTAL, {
    method: 'GET',
    headers: {
      'apikey': process.env.API_KEY,
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

app.get('/', async (req, res) => {
  try {
    const purchases = await fetchPurchases();
    const totalSummary = await fetchTotalSummary();

    const groupedByDate = purchases.reduce((groups, purchase) => {
      const date = purchase.purchase_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(purchase);
      return groups;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

    const tickerSummary = totalSummary.map(item => ({
      ticker: item.ticker,
      name: item.name,
      type: item.type,
      totalAmount: item.total_purchase_amount || 0,
      averagePrice: item.average_purchase_price || 0,
      totalCost: item.total_investment || 0
    })).sort((a, b) => a.ticker.localeCompare(b.ticker));

    const groupedByType = purchases.reduce((groups, purchase) => {
      const type = purchase.type || 'Sin tipo';
      if (!groups[type]) {
        groups[type] = {
          type: type,
          totalCost: 0,
          count: 0
        };
      }
      groups[type].totalCost += purchase.purchase_price * purchase.purchase_amount;
      groups[type].count++;
      return groups;
    }, {});

    const typeSummary = Object.values(groupedByType).sort((a, b) => a.type.localeCompare(b.type));

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registro de Operaciones</title>
        <link rel="stylesheet" href="/css/water.min.css">
        <link rel="stylesheet" href="/css/frappe-charts.min.css">
        <style>
          :root {
            --color-primary: #667eea;
            --color-secondary: #764ba2;
            --color-accent: #f093fb;
            --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-secondary: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            --gradient-accent: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          body {
            max-width: 1200px;
            margin: 0 auto;
            padding: 10px;
            transition: background-color 0.3s ease;
          }

          body.dark-mode {
            background-color: #1a1a2e;
            color: #eee;
          }

          .dark-mode .summary-table-container,
          .dark-mode .summary-chart-container,
          .dark-mode .date-group,
          .dark-mode .charts-section {
            background-color: #16213e;
            border-color: #0f3460;
          }

          .dark-mode .total-card {
            background-color: #16213e;
            border-color: #0f3460;
          }

          .dark-mode table {
            background-color: #16213e !important;
            color: #eee !important;
          }

          .dark-mode tbody tr {
            background-color: #16213e !important;
            color: #eee !important;
          }

          .dark-mode tbody tr:hover {
            background-color: rgba(102, 126, 234, 0.2) !important;
          }

          .dark-mode td,
          .dark-mode th,
          .dark-mode tbody td,
          .dark-mode tbody th,
          .dark-mode table td,
          .dark-mode table th {
            color: #eee !important;
            background-color: transparent !important;
          }

          .dark-mode thead th {
            color: #fff !important;
          }

          .dark-mode .ticker {
            color: #a78bfa !important;
          }

          .dark-mode .subtotal {
            background-color: #0f3460 !important;
            color: #fff !important;
          }

          .dark-mode .subtotal td {
            color: #fff !important;
            background-color: #0f3460 !important;
            border-top-color: #667eea !important;
          }

          .dark-mode h2,
          .dark-mode h3 {
            color: #eee !important;
          }

          .dark-mode .date-info span {
            color: #fff !important;
          }

          .dark-mode-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--gradient-primary);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 24px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            z-index: 1000;
          }

          .dark-mode-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }

          h1 {
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
            margin-top: 0.5rem;
          }
          .date-group, .charts-section {
            margin-bottom: 0.5rem;
            border-radius: 4px;
            overflow: hidden;
            background-color: var(--background);
          }
          .charts-section {
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .date-header, .charts-header {
            background: var(--gradient-primary);
            color: white;
            padding: 0.6rem 1rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            transition: all 0.3s ease;
          }
          .charts-header {
            background: var(--gradient-secondary);
          }
          .date-header:hover, .charts-header:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .date-header h3, .charts-header h2 {
            margin: 0;
            color: white;
            font-size: 1rem;
          }
          .date-header .toggle-icon, .charts-header .toggle-icon {
            font-size: 1.2rem;
            transition: transform 0.3s;
          }
          .date-header.collapsed .toggle-icon, .charts-header.collapsed .toggle-icon {
            transform: rotate(-90deg);
          }
          .date-info {
            display: flex;
            gap: 2rem;
            font-size: 0.8rem;
            margin-top: 0.2rem;
          }
          .date-content, .charts-content {
            max-height: 2000px;
            overflow: hidden;
            transition: max-height 0.3s ease-out, padding 0.3s ease-out;
          }
          .date-content.collapsed, .charts-content.collapsed {
            max-height: 0;
            padding: 0 !important;
            margin: 0 !important;
          }
          .charts-content {
            padding: 0.75rem;
          }
          .ticker {
            font-weight: bold;
            color: var(--color-primary);
          }

          .date-content table {
            font-size: 0.7rem;
            table-layout: fixed;
          }

          .date-content th:nth-child(1),
          .date-content td:nth-child(1) { width: 8%; }

          .date-content th:nth-child(2),
          .date-content td:nth-child(2) { width: 10%; }

          .date-content th:nth-child(3),
          .date-content td:nth-child(3) {
            width: 38%;
            max-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .date-content th:nth-child(4),
          .date-content td:nth-child(4) { width: 15%; }

          .date-content th:nth-child(5),
          .date-content td:nth-child(5) { width: 10%; }

          .date-content th:nth-child(6),
          .date-content td:nth-child(6) { width: 19%; }

          table {
            border-radius: 8px;
            overflow: hidden;
          }

          thead {
            background: var(--gradient-primary);
          }

          .date-content thead {
            background: none;
          }

          thead th {
            color: white !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.3px;
          }

          .date-content thead th {
            color: var(--text-color) !important;
          }

          .dark-mode .date-content thead th {
            color: #eee !important;
          }

          tbody tr {
            transition: all 0.2s ease;
          }

          tbody tr:hover {
            background-color: rgba(102, 126, 234, 0.1);
            transform: scale(1.01);
          }

          .summary-table-container table {
            table-layout: auto;
            width: 100%;
          }

          .summary-table-container th:nth-child(1),
          .summary-table-container td:nth-child(1) {
            width: 8%;
            min-width: 60px;
          }

          .summary-table-container th:nth-child(2),
          .summary-table-container td:nth-child(2) {
            width: 10%;
            min-width: 80px;
          }

          .summary-table-container th:nth-child(3),
          .summary-table-container td:nth-child(3) {
            width: 30%;
            min-width: 150px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .summary-table-container th:nth-child(4),
          .summary-table-container td:nth-child(4) {
            width: 18%;
            min-width: 100px;
          }

          .summary-table-container th:nth-child(5),
          .summary-table-container td:nth-child(5) {
            width: 12%;
            min-width: 80px;
          }

          .summary-table-container th:nth-child(6),
          .summary-table-container td:nth-child(6) {
            width: 22%;
            min-width: 100px;
          }
          .subtotal {
            background-color: var(--background-alt);
            font-weight: bold;
          }
          .subtotal td {
            border-top: 2px solid var(--color-primary);
          }
          .total-card {
            margin-top: 0.5rem;
            padding: 0.75rem;
            background-color: var(--background-alt);
            border-radius: 4px;
            text-align: center;
            border: 1px solid var(--border);
            font-size: 0.9rem;
          }
          table {
            margin: 0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .summary-table-container {
            background-color: var(--background);
            border-radius: 4px;
            padding: 0.75rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid var(--border);
          }
          .summary-chart-container {
            background-color: var(--background);
            border-radius: 4px;
            padding: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .summary-chart-container h3 {
            text-align: center;
          }
          .summary-chart-container > div {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          @media (max-width: 900px) {
            .summary-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <button class="dark-mode-toggle" onclick="toggleDarkMode()">
          <span class="light-icon">🌙</span>
          <span class="dark-icon" style="display: none;">☀️</span>
        </button>
        <div>
          <h1 style="text-align: center;">Registro de Operaciones</h1>

          <div class="summary-table-container" style="margin-bottom: 0.5rem;">
            <h2 style="font-size: 1rem; margin-top: 0; margin-bottom: 0.5rem;">Resumen</h2>
            <table style="font-size: 0.8rem;">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>Precio Prom.</th>
                  <th>Cant.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${tickerSummary.map(item => `
                  <tr>
                    <td class="ticker">${item.ticker}</td>
                    <td>${item.type || '-'}</td>
                    <td>${item.name}</td>
                    <td>$${item.averagePrice.toFixed(2)}</td>
                    <td>${item.totalAmount}</td>
                    <td>$${item.totalCost.toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="subtotal">
                  <td colspan="4"></td>
                  <td>${tickerSummary.reduce((sum, item) => sum + item.totalAmount, 0)}</td>
                  <td>$${tickerSummary.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="charts-section">
            <div class="charts-header collapsed" onclick="toggleSection(this)">
              <h2>Gráficos de Distribución</h2>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="charts-content collapsed">
              <div class="summary-grid" style="margin: 0;">
                <div class="summary-chart-container" style="box-shadow: none;">
                  <h3 style="font-size: 0.9rem; margin-top: 0; margin-bottom: 0.25rem;">Distribución por Ticker</h3>
                  <div id="chartByTicker"></div>
                </div>

                <div class="summary-chart-container" style="box-shadow: none;">
                  <h3 style="font-size: 0.9rem; margin-top: 0; margin-bottom: 0.25rem;">Distribución por Tipo</h3>
                  <div id="chartByType"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="charts-section">
            <div class="charts-header collapsed" onclick="toggleSection(this)">
              <h2>Operaciones por Fecha</h2>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="charts-content collapsed">
              ${sortedDates.map(date => {
                const datePurchases = groupedByDate[date];
                const dateTotal = datePurchases.reduce((sum, p) => sum + (p.purchase_price * p.purchase_amount), 0);
                const itemCount = datePurchases.length;

                return `
                  <div class="date-group">
                    <div class="date-header collapsed" onclick="toggleDate(this)">
                      <div>
                        <h3>${new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        <div class="date-info">
                          <span>${itemCount} compra${itemCount !== 1 ? 's' : ''}</span>
                          <span>Total: $${dateTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      <span class="toggle-icon">▼</span>
                    </div>
                    <div class="date-content collapsed">
                      <table>
                        <thead>
                          <tr>
                            <th>Ticker</th>
                            <th>Tipo</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${datePurchases.sort((a, b) => a.ticker.localeCompare(b.ticker)).map(p => `
                            <tr>
                              <td class="ticker">${p.ticker}</td>
                              <td>${p.type || '-'}</td>
                              <td>${p.name}</td>
                              <td>$${p.purchase_price.toFixed(2)}</td>
                              <td>${p.purchase_amount}</td>
                              <td>$${(p.purchase_price * p.purchase_amount).toFixed(2)}</td>
                            </tr>
                          `).join('')}
                          <tr class="subtotal">
                            <td colspan="5">Subtotal del día</td>
                            <td>$${dateTotal.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="total-card">
            <strong>Total de operaciones:</strong> ${purchases.length} registros |
            <strong>Total invertido:</strong> $${purchases.reduce((sum, p) => sum + (p.purchase_price * p.purchase_amount), 0).toFixed(2)}
          </div>
        </div>

        <script src="/js/frappe-charts.min.js"></script>
        <script>
          function toggleDate(header) {
            const content = header.nextElementSibling;
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
          }

          function toggleSection(header) {
            const content = header.nextElementSibling;
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
          }

          function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const lightIcon = document.querySelector('.light-icon');
            const darkIcon = document.querySelector('.dark-icon');

            if (document.body.classList.contains('dark-mode')) {
              lightIcon.style.display = 'none';
              darkIcon.style.display = 'inline';
              localStorage.setItem('darkMode', 'enabled');
            } else {
              lightIcon.style.display = 'inline';
              darkIcon.style.display = 'none';
              localStorage.setItem('darkMode', 'disabled');
            }
          }

          // Cargar preferencia de modo oscuro
          if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            document.querySelector('.light-icon').style.display = 'none';
            document.querySelector('.dark-icon').style.display = 'inline';
          }

          const chartDataByTicker = {
            labels: ${JSON.stringify(tickerSummary.map(item => item.ticker))},
            datasets: [
              {
                values: ${JSON.stringify(tickerSummary.map(item => parseFloat(item.totalCost.toFixed(2))))}
              }
            ]
          };

          const chartByTicker = new frappe.Chart("#chartByTicker", {
            data: chartDataByTicker,
            type: 'pie',
            height: 220,
            colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#8b5cf6', '#a78bfa', '#c084fc', '#e879f9', '#ec4899', '#f472b6'],
            tooltipOptions: {
              formatTooltipY: d => "$" + d.toFixed(2)
            }
          });

          const chartDataByType = {
            labels: ${JSON.stringify(typeSummary.map(item => item.type))},
            datasets: [
              {
                values: ${JSON.stringify(typeSummary.map(item => parseFloat(item.totalCost.toFixed(2))))}
              }
            ]
          };

          const chartByType = new frappe.Chart("#chartByType", {
            data: chartDataByType,
            type: 'pie',
            height: 220,
            colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#8b5cf6'],
            tooltipOptions: {
              formatTooltipY: d => "$" + d.toFixed(2)
            }
          });
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).send('<h1>Error al cargar las compras</h1><p>' + error.message + '</p>');
  }
});

app.get('/api/purchases', async (req, res) => {
  try {
    const purchases = await fetchPurchases();
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Error al obtener las compras', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

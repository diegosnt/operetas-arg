function renderPage(data) {
  const { tickerSummary, typeSummary, sortedDates, groupedByDate, purchases } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Operaciones AR</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/css/water.min.css">
  <link rel="stylesheet" href="/css/styles.css">
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

      <!-- Vista móvil en formato de tarjetas -->
      <div class="mobile-cards">
        ${tickerSummary.map(item => `
          <div class="mobile-card">
            <div class="mobile-card-ticker">${item.ticker} - ${item.type || 'N/A'}</div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Nombre:</span>
              <span class="mobile-card-value">${item.name}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Precio Prom:</span>
              <span class="mobile-card-value">$${item.averagePrice.toFixed(2)}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Cantidad:</span>
              <span class="mobile-card-value">${item.totalAmount}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Total:</span>
              <span class="mobile-card-value"><strong>$${item.totalCost.toFixed(2)}</strong></span>
            </div>
          </div>
        `).join('')}
        <div class="mobile-card" style="background: var(--background-alt);">
          <div class="mobile-card-row">
            <span class="mobile-card-label">Total Invertido:</span>
            <span class="mobile-card-value"><strong>$${tickerSummary.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
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
            <canvas id="chartByTicker"></canvas>
          </div>

          <div class="summary-chart-container" style="box-shadow: none;">
            <h3 style="font-size: 0.9rem; margin-top: 0; margin-bottom: 0.25rem;">Distribución por Tipo</h3>
            <canvas id="chartByType"></canvas>
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

                <!-- Vista móvil en formato de tarjetas para operaciones por fecha -->
                <div class="mobile-cards">
                  ${datePurchases.sort((a, b) => a.ticker.localeCompare(b.ticker)).map(p => `
                    <div class="mobile-card">
                      <div class="mobile-card-ticker">${p.ticker}</div>
                      <div class="mobile-card-row">
                        <span class="mobile-card-label">Tipo:</span>
                        <span class="mobile-card-value">${p.type || 'N/A'}</span>
                      </div>
                      <div class="mobile-card-row">
                        <span class="mobile-card-label">Nombre:</span>
                        <span class="mobile-card-value">${p.name}</span>
                      </div>
                      <div class="mobile-card-row">
                        <span class="mobile-card-label">Precio:</span>
                        <span class="mobile-card-value">$${p.purchase_price.toFixed(2)}</span>
                      </div>
                      <div class="mobile-card-row">
                        <span class="mobile-card-label">Cantidad:</span>
                        <span class="mobile-card-value">${p.purchase_amount}</span>
                      </div>
                      <div class="mobile-card-row">
                        <span class="mobile-card-label">Total:</span>
                        <span class="mobile-card-value"><strong>$${(p.purchase_price * p.purchase_amount).toFixed(2)}</strong></span>
                      </div>
                    </div>
                  `).join('')}
                  <div class="mobile-card" style="background: var(--background-alt);">
                    <div class="mobile-card-row">
                      <span class="mobile-card-label">Subtotal del día:</span>
                      <span class="mobile-card-value"><strong>$${dateTotal.toFixed(2)}</strong></span>
                    </div>
                  </div>
                </div>
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

  <script src="/js/chart.min.js"></script>
  <script src="/js/app.js"></script>
  <script>
    // Inicializar gráficos con datos del servidor
    initializeCharts(
      {
        labels: ${JSON.stringify(tickerSummary.map(item => item.ticker))},
        data: ${JSON.stringify(tickerSummary.map(item => parseFloat(item.totalCost.toFixed(2))))}
      },
      {
        labels: ${JSON.stringify(typeSummary.map(item => item.type))},
        data: ${JSON.stringify(typeSummary.map(item => parseFloat(item.totalCost.toFixed(2))))}
      }
    );
  </script>
</body>
</html>
  `;
}

module.exports = { renderPage };

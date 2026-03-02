// State management
let dashboardData = null;

// Helpers
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0,00';
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function toggleCollapsible(header) {
  const content = header.nextElementSibling;
  header.classList.toggle('collapsed');
  content.classList.toggle('collapsed');
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark-mode');
  const isDark = document.documentElement.classList.contains('dark-mode');
  
  const lightIcon = document.querySelector('.light-icon');
  const darkIcon = document.querySelector('.dark-icon');
  
  if (isDark) {
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'inline';
    localStorage.setItem('darkMode', 'enabled');
  } else {
    lightIcon.style.display = 'inline';
    darkIcon.style.display = 'none';
    localStorage.setItem('darkMode', 'disabled');
  }
  
  updateChartColors();
}

// Data Fetching
async function fetchDashboardData() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) refreshBtn.classList.add('spinning');
  
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Error al cargar datos');
    
    dashboardData = await response.json();
    renderDashboard();
    localStorage.setItem('lastDashboardData', JSON.stringify(dashboardData));
  } catch (error) {
    console.error('Fetch error:', error);
    document.getElementById('footer-summary').innerText = 'Error al actualizar datos. Reintentando...';
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }
}

function renderDashboard() {
  if (!dashboardData) return;
  
  const { tickerSummary, typeSummary, sortedDates, groupedByDate, purchases } = dashboardData;
  
  const totalCost = tickerSummary.reduce((sum, item) => sum + item.totalCost, 0);
  const totalCurrent = tickerSummary.reduce((sum, item) => {
    return sum + (item.currentPrice !== null ? item.currentPrice * item.totalAmount : 0);
  }, 0);
  const totalProfit = totalCurrent - totalCost;
  const totalProfitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  
  updateKPI('kpi-invested', `$${formatNumber(totalCost)}`);
  updateKPI('kpi-current', `$${formatNumber(totalCurrent)}`);
  updateKPI('kpi-profit', `$${formatNumber(totalProfit)}`, totalProfit >= 0 ? 'profit-positive' : 'profit-negative');
  updateKPI('kpi-pct', `${formatNumber(totalProfitPct)}%`, totalProfit >= 0 ? 'profit-positive' : 'profit-negative');
  
  renderSummaryTable(tickerSummary, totalCost, totalCurrent, totalProfit, totalProfitPct);
  renderHistory(sortedDates, groupedByDate);
  
  // Preparar datos para gráficos
  const performanceData = tickerSummary.map(item => {
    const currentVal = item.currentPrice !== null ? item.currentPrice * item.totalAmount : 0;
    return {
      ticker: item.ticker,
      profit: currentVal > 0 ? (currentVal - item.totalCost) : 0
    };
  }).sort((a, b) => b.profit - a.profit);

  initializeCharts(
    {
      labels: tickerSummary.map(item => item.ticker),
      data: tickerSummary.map(item => parseFloat(item.totalCost.toFixed(2)))
    },
    {
      labels: typeSummary.map(item => item.type),
      data: typeSummary.map(item => parseFloat(item.totalCost.toFixed(2)))
    },
    {
      labels: performanceData.map(d => d.ticker),
      data: performanceData.map(d => d.profit)
    }
  );
  
  document.getElementById('footer-summary').innerHTML = `
    <strong>${purchases.length}</strong> operaciones registradas | 
    Actualizado: ${new Date().toLocaleTimeString()}
  `;
}

function updateKPI(id, value, className) {
  const el = document.getElementById(id);
  const valEl = el.querySelector('.kpi-value');
  valEl.innerText = value;
  if (className) {
    valEl.className = 'kpi-value ' + className;
  }
}

function renderSummaryTable(tickerSummary, totalCost, totalCurrent, totalProfit, totalProfitPct) {
  const container = document.getElementById('summary-table-container');
  container.classList.remove('loading-skeleton');
  
  const hasTotalCurrent = totalCurrent > 0;
  const totalProfitClass = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';

  let html = `
    <div class="table-container">
      <table class="desktop-only">
        <thead>
          <tr>
            <th>Activo</th>
            <th class="hide-tablet">Nombre</th>
            <th>Precios <small>(Prom/Act)</small></th>
            <th>Cant.</th>
            <th>Totales <small>(Costo/Act)</small></th>
            <th>Rendimiento</th>
          </tr>
        </thead>
        <tbody>
          ${tickerSummary.map(item => {
            const currentTotal = item.currentPrice !== null ? item.currentPrice * item.totalAmount : null;
            const profit = currentTotal !== null ? currentTotal - item.totalCost : null;
            const profitPct = profit !== null && item.totalCost > 0 ? (profit / item.totalCost) * 100 : null;
            const profitClass = profit !== null ? (profit >= 0 ? 'profit-positive' : 'profit-negative') : '';
            
            return `
              <tr>
                <td>
                  <div class="cell-stack">
                    <span class="ticker">${item.ticker}</span>
                    <span class="cell-subtext">${item.type || '-'}</span>
                  </div>
                </td>
                <td class="hide-tablet">
                  <div class="truncate" title="${item.name}">${item.name}</div>
                </td>
                <td>
                  <div class="cell-stack">
                    <span>$${formatNumber(item.averagePrice)}</span>
                    <span class="cell-subtext">${item.currentPrice !== null ? '$' + formatNumber(item.currentPrice) : 'N/A'}</span>
                  </div>
                </td>
                <td>${item.totalAmount.toLocaleString('es-AR')}</td>
                <td>
                  <div class="cell-stack">
                    <span>$${formatNumber(item.totalCost)}</span>
                    <span class="cell-subtext">${currentTotal !== null ? '$' + formatNumber(currentTotal) : 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <div class="cell-stack ${profitClass}">
                    <span style="font-weight: bold;">${profit !== null ? '$' + formatNumber(profit) : 'N/A'}</span>
                    <span class="cell-subtext" style="font-weight: bold;">${profitPct !== null ? formatNumber(profitPct) + '%' : 'N/A'}</span>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
          <tr class="subtotal">
            <td>TOTALES</td>
            <td class="hide-tablet"></td>
            <td></td>
            <td>${tickerSummary.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString('es-AR')}</td>
            <td>
              <div class="cell-stack">
                <span>$${formatNumber(totalCost)}</span>
                <span class="cell-subtext">${hasTotalCurrent ? '$' + formatNumber(totalCurrent) : 'N/A'}</span>
              </div>
            </td>
            <td>
              <div class="cell-stack ${totalProfitClass}">
                <span>${hasTotalCurrent ? '$' + formatNumber(totalProfit) : 'N/A'}</span>
                <span class="cell-subtext">${hasTotalCurrent ? formatNumber(totalProfitPct) + '%' : 'N/A'}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="mobile-cards mobile-only">
      ${tickerSummary.map(item => {
        const currentTotal = item.currentPrice !== null ? item.currentPrice * item.totalAmount : null;
        const profit = currentTotal !== null ? currentTotal - item.totalCost : null;
        const profitPct = profit !== null && item.totalCost > 0 ? (profit / item.totalCost) * 100 : null;
        const profitClass = profit !== null ? (profit >= 0 ? 'profit-positive' : 'profit-negative') : '';
        
        return `
          <div class="mobile-card">
            <div class="mobile-card-ticker">
              <span>${item.ticker} <small>(${item.type})</small></span>
              <span class="mobile-card-qty">${item.totalAmount.toLocaleString('es-AR')} un.</span>
            </div>
            <div class="mobile-card-row"><span>Precio Actual:</span><span>${item.currentPrice ? '$'+formatNumber(item.currentPrice) : 'N/A'}</span></div>
            <div class="mobile-card-row"><span>Valor Actual:</span><span><strong>${currentTotal ? '$'+formatNumber(currentTotal) : 'N/A'}</strong></span></div>
            <div class="mobile-card-row"><span>Ganancia:</span><span class="${profitClass}">${profit ? '$'+formatNumber(profit) : 'N/A'} (${profitPct ? formatNumber(profitPct)+'%' : ''})</span></div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  container.innerHTML = html;
}

function renderHistory(sortedDates, groupedByDate) {
  const container = document.getElementById('history-container');
  
  const capitalizeDate = (str) => {
    // Capitaliza la primera letra (día de la semana) y la primera letra del mes tras el "de "
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/de (\w)/g, (match, p1) => `de ${p1.toUpperCase()}`);
  };
  
  let html = sortedDates.map(date => {
    const datePurchases = groupedByDate[date].slice().sort((a, b) => a.ticker.localeCompare(b.ticker));
    const dateTotal = datePurchases.reduce((sum, p) => sum + (p.purchase_price * p.purchase_amount), 0);
    const dateStrRaw = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateStr = capitalizeDate(dateStrRaw);

    return `
      <div class="history-date-item">
        <div class="charts-header collapsed" onclick="toggleCollapsible(this)">
          <div>
            <h3>${dateStr}</h3>
            <div class="date-info">
              <span><strong>${datePurchases.length}</strong> operaciones</span>
              <span>Total: <strong>$${formatNumber(dateTotal)}</strong></span>
            </div>
          </div>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="charts-content collapsed">
          <table class="desktop-only">
            <thead>
              <tr><th>Ticker</th><th>Operación</th><th>Precio</th><th>Cantidad</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${datePurchases.map(p => `
                <tr>
                  <td class="ticker">${p.ticker}</td>
                  <td>${p.operation || 'COMPRA'}</td>
                  <td>$${formatNumber(p.purchase_price)}</td>
                  <td>${p.purchase_amount.toLocaleString('es-AR')}</td>
                  <td>$${formatNumber(p.purchase_price * p.purchase_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="mobile-cards mobile-only">
            ${datePurchases.map(p => `
              <div class="mobile-card history-card">
                <div class="mobile-card-ticker">
                  <span>${p.ticker}</span>
                  <span class="mobile-card-qty">${p.operation || 'COMPRA'}</span>
                </div>
                <div class="mobile-card-row"><span>Precio:</span><span>$${formatNumber(p.purchase_price)}</span></div>
                <div class="mobile-card-row"><span>Cantidad:</span><span>${p.purchase_amount.toLocaleString('es-AR')}</span></div>
                <div class="mobile-card-row"><span>Total:</span><span><strong>$${formatNumber(p.purchase_price * p.purchase_amount)}</strong></span></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html || '<p style="padding: 1rem;">No hay operaciones registradas.</p>';
}

// Charting Logic
let chartByTicker = null;
let chartByType = null;
let chartPerformance = null;

function initializeCharts(tickerData, typeData, perfData) {
  const isDarkMode = document.documentElement.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#cbd5e1' : '#64748b';
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 0, bottom: 20, left: 20, right: 20 }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          color: textColor, 
          padding: 25, 
          font: { size: 12, weight: '500' },
          usePointStyle: true
        }
      }
    }
  };

  if (chartByTicker) chartByTicker.destroy();
  if (chartByType) chartByType.destroy();
  if (chartPerformance) chartPerformance.destroy();

  chartByTicker = new Chart(document.getElementById('chartByTicker'), {
    type: 'doughnut',
    data: {
      labels: tickerData.labels,
      datasets: [{
        data: tickerData.data,
        backgroundColor: ['#0ea5e9', '#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        borderWidth: 0
      }]
    },
    options: pieOptions
  });

  chartByType = new Chart(document.getElementById('chartByType'), {
    type: 'pie',
    data: {
      labels: typeData.labels,
      datasets: [{
        data: typeData.data,
        backgroundColor: ['#0ea5e9', '#2563eb', '#14b8a6'],
        borderWidth: 0
      }]
    },
    options: pieOptions
  });

  chartPerformance = new Chart(document.getElementById('chartPerformance'), {
    type: 'bar',
    data: {
      labels: perfData.labels,
      datasets: [{
        label: 'Ganancia/Pérdida ($)',
        data: perfData.data,
        backgroundColor: perfData.data.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` $${formatNumber(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: { 
          grid: { color: isDarkMode ? '#334155' : '#e2e8f0' },
          ticks: { color: textColor }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      }
    }
  });
}

function updateChartColors() {
  const isDark = document.documentElement.classList.contains('dark-mode');
  const color = isDark ? '#cbd5e1' : '#64748b';
  [chartByTicker, chartByType, chartPerformance].forEach(c => {
    if (c) {
      if (c.options.plugins.legend) c.options.plugins.legend.labels.color = color;
      if (c.options.scales) {
        if (c.options.scales.x) c.options.scales.x.ticks.color = color;
        if (c.options.scales.y) {
          c.options.scales.y.ticks.color = color;
          c.options.scales.y.grid.color = isDark ? '#334155' : '#e2e8f0';
        }
      }
      c.update();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const cachedData = localStorage.getItem('lastDashboardData');
  if (cachedData) {
    dashboardData = JSON.parse(cachedData);
    renderDashboard();
  }
  fetchDashboardData();
  const isDark = document.documentElement.classList.contains('dark-mode');
  document.querySelector('.light-icon').style.display = isDark ? 'none' : 'inline';
  document.querySelector('.dark-icon').style.display = isDark ? 'inline' : 'none';
});

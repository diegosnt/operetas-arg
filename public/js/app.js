// State management
let dashboardData = null;

// Helpers
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0,00';
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- Manejo de Eventos (Refactorizado para Seguridad) ---

function handleGlobalClicks(e) {
  // 1. Toggle Colapsables (Delegación de eventos)
  const collapsibleHeader = e.target.closest('[data-collapsible]');
  if (collapsibleHeader) {
    const content = collapsibleHeader.nextElementSibling;
    collapsibleHeader.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
    return;
  }

  // 2. Botón Refrescar
  if (e.target.closest('#refresh-btn')) {
    fetchDashboardData();
    return;
  }

  // 3. Botón Modo Oscuro
  if (e.target.closest('#theme-toggle-btn')) {
    toggleDarkMode();
    return;
  }
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark-mode');
  const isDark = document.documentElement.classList.contains('dark-mode');
  
  const lightIcon = document.querySelector('.light-icon');
  const darkIcon = document.querySelector('.dark-icon');
  
  if (isDark) {
    if (lightIcon) lightIcon.style.display = 'none';
    if (darkIcon) darkIcon.style.display = 'inline';
    localStorage.setItem('darkMode', 'enabled');
  } else {
    if (lightIcon) lightIcon.style.display = 'inline';
    if (darkIcon) darkIcon.style.display = 'none';
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
    const footer = document.getElementById('footer-summary');
    if (footer) footer.innerText = 'Error al actualizar datos. Reintentando...';
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
  
  renderTreemap(tickerSummary);
  renderSummaryTable(tickerSummary, totalCost, totalCurrent, totalProfit, totalProfitPct);
  renderHistory(sortedDates, groupedByDate);
  
  const performanceData = tickerSummary.map(item => {
    const currentVal = item.currentPrice !== null ? item.currentPrice * item.totalAmount : 0;
    const profit = currentVal > 0 ? (currentVal - item.totalCost) : 0;
    const pct = item.totalCost > 0 ? (profit / item.totalCost * 100) : 0;
    return {
      ticker: item.ticker,
      profit: profit,
      pct: pct
    };
  }).sort((a, b) => b.profit - a.profit);

  const totalTickerCostForLabels = tickerSummary.reduce((sum, item) => sum + item.totalCost, 0);
  const totalTypeCostForLabels = typeSummary.reduce((sum, item) => sum + item.totalCost, 0);

  const equityDataRaw = purchases.slice().sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));
  let runningTotal = 0;
  const equityPoints = [];
  const equityLabels = [];
  
  // Agrupar por fecha para evitar puntos duplicados en el mismo día
  const dailyEquity = {};
  equityDataRaw.forEach(p => {
    runningTotal += (p.purchase_price * p.purchase_amount);
    dailyEquity[p.purchase_date] = runningTotal;
  });
  
  Object.keys(dailyEquity).sort().forEach(date => {
    equityLabels.push(new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }));
    equityLabels.push(new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }));
    equityPoints.push(dailyEquity[date]);
  });
  // Limpiar etiquetas para que no se repitan años si no es necesario
  const finalLabels = Object.keys(dailyEquity).sort().map(d => {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  });

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
      data: performanceData.map(d => d.profit),
      pcts: performanceData.map(d => d.pct)
    },
    {
      labels: finalLabels,
      data: equityPoints
    }
  );
  
  const footer = document.getElementById('footer-summary');
  if (footer) {
    footer.innerHTML = `
      <strong>${purchases.length}</strong> operaciones registradas | 
      Actualizado: ${new Date().toLocaleTimeString()}
    `;
  }
}

function updateKPI(id, value, className) {
  const el = document.getElementById(id);
  if (!el) return;
  const valEl = el.querySelector('.kpi-value');
  if (!valEl) return;
  valEl.innerText = value;
  if (className) {
    valEl.className = 'kpi-value ' + className;
  }
}

function renderSummaryTable(tickerSummary, totalCost, totalCurrent, totalProfit, totalProfitPct) {

  const container = document.getElementById('summary-table-container');
  if (!container) return;
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
  if (!container) return;
  
  const capitalizeDate = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/de (\w)/g, (match, p1) => `de ${p1.toUpperCase()}`);
  };
  
  let html = sortedDates.map(date => {
    const datePurchases = groupedByDate[date].slice().sort((a, b) => a.ticker.localeCompare(b.ticker));
    const dateTotal = datePurchases.reduce((sum, p) => sum + (p.purchase_price * p.purchase_amount), 0);
    const dateStrRaw = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateStr = capitalizeDate(dateStrRaw);

    return `
      <div class="history-date-item">
        <div class="charts-header collapsed" data-collapsible>
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
let chartEquity = null;
let chartTreemap = null;

function renderTreemap(tickerSummary) {
  const ctx = document.getElementById('chartTreemap');
  if (!ctx || !tickerSummary || tickerSummary.length === 0) return;
  
  if (chartTreemap) chartTreemap.destroy();

  try {
    const data = tickerSummary.map(item => {
      const cost = parseFloat(item.totalCost) || 0;
      const amount = parseFloat(item.totalAmount) || 0;
      const currentPrice = item.currentPrice !== null ? parseFloat(item.currentPrice) : null;
      
      let profitPct = 0;
      if (currentPrice !== null && cost > 0) {
        const currentTotal = currentPrice * amount;
        profitPct = ((currentTotal - cost) / cost) * 100;
      }
      
      const getColor = (p) => {
        if (p > 0) return p > 10 ? '#065f46' : '#10b981'; // Verdes (Oscuro / Normal)
        if (p < 0) return p < -10 ? '#991b1b' : '#ef4444'; // Rojos (Oscuro / Normal)
        return '#64748b'; // Gris
      };

      return {
        ticker: item.ticker,
        value: cost,
        pct: profitPct,
        color: getColor(profitPct)
      };
    }).filter(d => d.value > 0);

    chartTreemap = new Chart(ctx, {
      type: 'treemap',
      data: {
        datasets: [{
          tree: data,
          key: 'value',
          // NO usamos 'groups' para evitar nodos intermedios negros
          spacing: 1,
          borderWidth: 0,
          borderRadius: 4,
          backgroundColor: (context) => {
            const raw = context.raw;
            if (!raw || !raw._data) return '#64748b';
            return raw._data.color;
          },
          labels: {
            display: true,
            formatter: (context) => {
              const raw = context.raw;
              if (!raw || !raw._data) return [];
              const d = raw._data;
              return [d.ticker, formatNumber(d.pct) + '%'];
            },
            font: { size: 14, weight: 'bold' },
            color: '#ffffff',
            overflow: 'fit'
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const d = context.raw._data;
                if (!d) return '';
                return ` ${d.ticker}: $${formatNumber(d.value)} (${formatNumber(d.pct)}%)`;
              }
            }
          }
        }
      }
    });
  } catch (e) {
    console.error('Treemap error:', e);
  }
}

const datalabelsPlugin = {
  id: 'datalabels',
  afterDraw: (chart) => {
    const { ctx, config } = chart;
    const type = config.type;
    if (type !== 'pie' && type !== 'doughnut' && type !== 'bar') return;
    
    ctx.save();
    // Configuración de fuente unificada
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((element, index) => {
        let text = '';
        let x = 0, y = 0;
        let useWhite = true;

        if (type === 'pie' || type === 'doughnut') {
          const total = dataset.data.reduce((sum, val) => sum + val, 0);
          const value = dataset.data[index];
          if (value <= total * 0.03) return;
          text = ((value / total) * 100).toFixed(1) + '%';
          const center = element.getCenterPoint();
          x = center.x;
          y = center.y;
        } else if (type === 'bar') {
          const pct = chart.data.pcts ? chart.data.pcts[index] : 0;
          if (Math.abs(pct) < 0.1) return;
          text = formatNumber(pct) + '%';
          const model = element;
          x = model.x;
          const isPositive = dataset.data[index] >= 0;
          y = isPositive ? model.y + 15 : model.y - 15;
          const barHeight = Math.abs(model.base - model.y);
          if (barHeight < 25) {
            y = isPositive ? model.y - 10 : model.y + 10;
            useWhite = false; // Fuera de la barra usamos color de tema
          }
        }

        if (text) {
          if (useWhite) {
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
          } else {
            ctx.fillStyle = document.documentElement.classList.contains('dark-mode') ? '#cbd5e1' : '#64748b';
            ctx.shadowBlur = 0;
          }
          ctx.fillText(text, x, y);
        }
      });
    });
    ctx.restore();
  }
};

function initializeCharts(tickerData, typeData, perfData, equityData) {
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
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || '';
            const value = ctx.parsed;
            return ` ${label}: $${formatNumber(value)}`;
          }
        }
      }
    }
  };

  if (chartByTicker) chartByTicker.destroy();
  if (chartByType) chartByType.destroy();
  if (chartPerformance) chartPerformance.destroy();
  if (chartEquity) chartEquity.destroy();

  const ctxTicker = document.getElementById('chartByTicker');
  if (ctxTicker) {
    chartByTicker = new Chart(ctxTicker, {
      type: 'doughnut',
      data: {
        labels: tickerData.labels,
        datasets: [{
          data: tickerData.data,
          backgroundColor: ['#4f46e6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderWidth: 0
        }]
      },
      options: pieOptions,
      plugins: [datalabelsPlugin]
    });
  }

  const ctxType = document.getElementById('chartByType');
  if (ctxType) {
    chartByType = new Chart(ctxType, {
      type: 'pie',
      data: {
        labels: typeData.labels,
        datasets: [{
          data: typeData.data,
          backgroundColor: ['#4f46e6', '#bd63f1', '#10b981'],
          borderWidth: 0
        }]
      },
      options: pieOptions,
      plugins: [datalabelsPlugin]
    });
  }

  const ctxPerf = document.getElementById('chartPerformance');
  if (ctxPerf) {
    chartPerformance = new Chart(ctxPerf, {
      type: 'bar',
      data: {
        labels: perfData.labels,
        pcts: perfData.pcts,
        datasets: [{
          label: 'Ganancia/Pérdida ($)',
          data: perfData.data,
          backgroundColor: perfData.data.map(v => v >= 0 ? '#10b981' : '#ef4444'),
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
              label: (ctx) => {
                const val = ctx.parsed.y;
                const pct = chartPerformance.data.pcts[ctx.dataIndex];
                return ` $${formatNumber(val)} (${formatNumber(pct)}%)`;
              }
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
      },
      plugins: [datalabelsPlugin]
    });
  }

  const ctxEquity = document.getElementById('chartEquity');
  if (ctxEquity) {
    chartEquity = new Chart(ctxEquity, {
      type: 'line',
      data: {
        labels: equityData.labels,
        datasets: [{
          label: 'Inversión Acumulada',
          data: equityData.data,
          borderColor: '#4f46e6',
          backgroundColor: 'rgba(79, 70, 230, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#4f46e6'
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
            ticks: { 
              color: textColor,
              callback: (val) => '$' + formatNumber(val)
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          }
        }
      }
    });
  }
}

function updateChartColors() {
  const isDark = document.documentElement.classList.contains('dark-mode');
  const color = isDark ? '#cbd5e1' : '#64748b';
  [chartByTicker, chartByType, chartPerformance, chartEquity].forEach(c => {
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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Configurar escuchador global de clics (Delegación)
  document.body.addEventListener('click', handleGlobalClicks);

  const cachedData = localStorage.getItem('lastDashboardData');
  if (cachedData) {
    dashboardData = JSON.parse(cachedData);
    renderDashboard();
  }
  fetchDashboardData();
  
  const isDark = document.documentElement.classList.contains('dark-mode');
  const lightIcon = document.querySelector('.light-icon');
  const darkIcon = document.querySelector('.dark-icon');
  if (lightIcon) lightIcon.style.display = isDark ? 'none' : 'inline';
  if (darkIcon) darkIcon.style.display = isDark ? 'inline' : 'none';

  // Registrar Service Worker para PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
});

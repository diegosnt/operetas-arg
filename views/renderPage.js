function renderPage() {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Operaciones AR - Dashboard</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/css/styles.css">
  <script>if (localStorage.getItem('darkMode') === 'enabled') document.documentElement.classList.add('dark-mode');</script>
</head>
<body>
  <header class="main-header">
    <div class="container header-inner">
      <h1>Operaciones AR</h1>
      <div class="header-actions">
        <button id="refresh-btn" class="action-btn" title="Actualizar Datos" onclick="fetchDashboardData()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
        </button>
        <button class="dark-mode-toggle" title="Cambiar Modo" onclick="toggleDarkMode()">
          <span class="light-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </span>
          <span class="dark-icon" style="display: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </span>
        </button>
      </div>
    </div>
  </header>

  <main class="container dashboard-container">
    <!-- KPI Cards - Siempre visibles por ser el resumen vital -->
    <div class="kpi-grid">
      <div class="kpi-card" id="kpi-invested">
        <div class="kpi-label">Inversión Total</div>
        <div class="kpi-value">--</div>
      </div>
      <div class="kpi-card" id="kpi-current">
        <div class="kpi-label">Valor Actual</div>
        <div class="kpi-value">--</div>
      </div>
      <div class="kpi-card" id="kpi-profit">
        <div class="kpi-label">Ganancia Total</div>
        <div class="kpi-value">--</div>
      </div>
      <div class="kpi-card" id="kpi-pct">
        <div class="kpi-label">Rendimiento</div>
        <div class="kpi-value">--</div>
      </div>
    </div>

    <!-- Resumen Table - Ahora colapsado por defecto -->
    <section class="charts-section">
      <div class="charts-header collapsed" onclick="toggleCollapsible(this)">
        <h2>Cartera de Activos</h2>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="charts-content collapsed">
        <div id="summary-table-container" class="loading-skeleton"></div>
      </div>
    </section>

    <!-- Analysis Charts - Ahora colapsado por defecto -->
    <section class="charts-section">
      <div class="charts-header collapsed" onclick="toggleCollapsible(this)">
        <h2>Rendimiento y Distribución</h2>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="charts-content collapsed">
        <div class="summary-grid">
          <div class="summary-chart-container">
            <h3>Distribución por Ticker (Costo)</h3>
            <div class="chart-wrapper">
              <canvas id="chartByTicker"></canvas>
            </div>
          </div>
          <div class="summary-chart-container">
            <h3>Distribución por Tipo de Activo</h3>
            <div class="chart-wrapper">
              <canvas id="chartByType"></canvas>
            </div>
          </div>
          <div class="summary-chart-container" style="grid-column: 1 / -1;">
            <h3>Ganancia / Pérdida por Activo ($)</h3>
            <div class="chart-wrapper" style="min-height: 400px;">
              <canvas id="chartPerformance"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Operations History - Ya estaba colapsado -->
    <section class="charts-section">
      <div class="charts-header collapsed" onclick="toggleCollapsible(this)">
        <h2>Historial de Operaciones</h2>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="charts-content collapsed" id="history-container">
        <!-- Rendered via app.js -->
      </div>
    </section>
  </main>

  <footer class="container">
    <div id="footer-summary">Cargando datos del mercado...</div>
  </footer>

  <script src="/js/chart.min.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>
  `;
}

module.exports = { renderPage };

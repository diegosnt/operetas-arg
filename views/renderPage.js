function renderPage() {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Operaciones AR - Dashboard</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/manifest.json">
  <link rel="stylesheet" href="/css/styles.min.css">
  <script src="/js/theme-init.js"></script>
</head>
<body>
  <header class="main-header">
    <div class="container header-inner">
      <h1>Operaciones AR</h1>
      <div class="header-actions">
        <button id="refresh-btn" class="action-btn" title="Actualizar Datos">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
        </button>
        <button id="theme-toggle-btn" class="dark-mode-toggle" title="Cambiar Modo">
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
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" id="kpi-invested">
        <span class="kpi-label">Inversión Total</span>
        <div class="kpi-value">...</div>
      </div>
      <div class="kpi-card" id="kpi-current">
        <span class="kpi-label">Valor Actual</span>
        <div class="kpi-value">...</div>
      </div>
      <div class="kpi-card" id="kpi-profit">
        <span class="kpi-label">Ganancia Total</span>
        <div class="kpi-value">...</div>
      </div>
      <div class="kpi-card" id="kpi-pct">
        <span class="kpi-label">Rendimiento</span>
        <div class="kpi-value">...</div>
      </div>
    </div>

    <!-- Resumen Table -->
    <section class="charts-section">
      <div class="charts-header collapsed" data-collapsible>
        <h2>Cartera de Activos</h2>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="charts-content collapsed">
        <div id="summary-table-container" class="loading-skeleton"></div>
      </div>
    </section>

    <!-- Analysis Charts -->
    <section class="charts-section">
      <div class="charts-header collapsed" data-collapsible>
        <h2>Rendimiento y Distribución</h2>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="charts-content collapsed">
        <div class="summary-grid">
          <div class="summary-chart-container" style="grid-column: 1 / -1;">
            <h3>Mapa de Calor (Treemap) - Cartera</h3>
            <p class="section-desc">El tamaño representa el capital y el color el rendimiento (Verde: Ganancia, Rojo: Pérdida).</p>
            <div class="treemap-container">
              <canvas id="chartTreemap"></canvas>
            </div>
          </div>
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
            <h3>Comparativa: Inversión vs Valor Actual ($)</h3>
            <div class="chart-wrapper" style="min-height: 400px;">
              <canvas id="chartProfitVsCost"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Operations History -->
    <section class="charts-section">
      <div class="charts-header collapsed" data-collapsible>
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

  <!-- Librerías locales -->
  <script src="/js/chart.min.js"></script>
  <script src="/js/chartjs-chart-treemap.min.js"></script>
  <script src="/js/app.min.js"></script>
</body>
</html>
  `;
}

module.exports = { renderPage };

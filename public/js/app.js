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

  const isDark = document.body.classList.contains('dark-mode');
  const newTextColor = isDark ? '#e0e0e0' : '#666';

  if (isDark) {
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'inline';
    localStorage.setItem('darkMode', 'enabled');
  } else {
    lightIcon.style.display = 'inline';
    darkIcon.style.display = 'none';
    localStorage.setItem('darkMode', 'disabled');
  }

  // Actualizar colores de las leyendas de los gráficos
  if (window.chartByTicker) {
    window.chartByTicker.options.plugins.legend.labels.color = newTextColor;
    // Forzar regeneración de etiquetas
    window.chartByTicker.options.plugins.legend.labels.generateLabels = function(chart) {
      const data = chart.data;
      const isDark = document.body.classList.contains('dark-mode');
      const labelColor = isDark ? '#e0e0e0' : '#666';

      if (data.labels.length && data.datasets.length) {
        return data.labels.map((label, i) => {
          const value = data.datasets[0].data[i];
          return {
            text: label + ': $' + value.toFixed(2),
            fillStyle: data.datasets[0].backgroundColor[i],
            fontColor: labelColor,
            strokeStyle: labelColor,
            hidden: false,
            index: i
          };
        });
      }
      return [];
    };
    window.chartByTicker.update();
  }
  if (window.chartByType) {
    window.chartByType.options.plugins.legend.labels.color = newTextColor;
    // Forzar regeneración de etiquetas
    window.chartByType.options.plugins.legend.labels.generateLabels = function(chart) {
      const data = chart.data;
      const isDark = document.body.classList.contains('dark-mode');
      const labelColor = isDark ? '#e0e0e0' : '#666';

      if (data.labels.length && data.datasets.length) {
        return data.labels.map((label, i) => {
          const value = data.datasets[0].data[i];
          return {
            text: label + ': $' + value.toFixed(2),
            fillStyle: data.datasets[0].backgroundColor[i],
            fontColor: labelColor,
            strokeStyle: labelColor,
            hidden: false,
            index: i
          };
        });
      }
      return [];
    };
    window.chartByType.update();
  }
}

function initializeCharts(tickerData, typeData) {
  // IMPORTANTE: Cargar preferencia de modo oscuro ANTES de crear los gráficos
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.querySelector('.light-icon').style.display = 'none';
    document.querySelector('.dark-icon').style.display = 'inline';
  }

  // Detectar tamaño de pantalla para configuración de leyenda
  const isMobile = window.innerWidth <= 768;
  const legendPosition = isMobile ? 'right' : 'bottom';

  // Detectar modo oscuro para colores de texto (DESPUÉS de cargar preferencia)
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e0e0e0' : '#666';

  console.log('Modo oscuro activo:', isDarkMode, '- Color de texto:', textColor);

  // Configuración común para los gráficos
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: isMobile ? 1.2 : 1.5,
    plugins: {
      legend: {
        position: legendPosition,
        align: 'start',
        labels: {
          color: textColor,
          boxWidth: isMobile ? 12 : 15,
          padding: isMobile ? 8 : 10,
          font: {
            size: isMobile ? 10 : 12
          },
          generateLabels: function(chart) {
            const data = chart.data;
            const isDark = document.body.classList.contains('dark-mode');
            const labelColor = isDark ? '#e0e0e0' : '#666';

            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                return {
                  text: label + ': $' + value.toFixed(2),
                  fillStyle: data.datasets[0].backgroundColor[i],
                  fontColor: labelColor,
                  strokeStyle: labelColor,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return label + ': $' + value.toFixed(2) + ' (' + percentage + '%)';
          }
        }
      }
    }
  };

  // Gráfico por Ticker
  const ctxTicker = document.getElementById('chartByTicker').getContext('2d');
  window.chartByTicker = new Chart(ctxTicker, {
    type: 'pie',
    data: {
      labels: tickerData.labels,
      datasets: [{
        data: tickerData.data,
        backgroundColor: ['#0ea5e9', '#1e40af', '#14b8a6', '#0284c7', '#1e3a8a', '#0d9488', '#06b6d4', '#3b82f6', '#10b981', '#0891b2'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: commonOptions
  });

  // Gráfico por Tipo
  const ctxType = document.getElementById('chartByType').getContext('2d');
  window.chartByType = new Chart(ctxType, {
    type: 'pie',
    data: {
      labels: typeData.labels,
      datasets: [{
        data: typeData.data,
        backgroundColor: ['#0ea5e9', '#1e40af', '#14b8a6', '#0284c7', '#0d9488'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: commonOptions
  });
}

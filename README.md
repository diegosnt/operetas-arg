# 📈 Operetas AR - Dashboard de Inversiones

Aplicación web profesional de alto rendimiento para el seguimiento y análisis de activos financieros en el mercado argentino. Optimizada para velocidad extrema, seguridad y usabilidad en múltiples dispositivos.

## 🚀 Innovaciones Tecnológicas y Recientes

Esta aplicación ha evolucionado a una solución de alto rendimiento con las siguientes actualizaciones:

- ⚡ **Performance de Grado Producción**:
  - **Compresión Inteligente**: Implementación de Gzip/Brotli mediante `compression` para reducir transferencias hasta un 70%.
  - **Estrategia de Caché Agresiva**: Cabeceras `Cache-Control` de larga duración (1 año) para activos estáticos.
  - **Minificación Automática**: Pipeline de construcción para CSS y JS reduciendo el tiempo de parseo del navegador.
- 📉 **Visualización Avanzada (Chart.js v4)**:
  - **Nuevo**: **Mapa de Calor (Treemap)** que muestra la distribución de cartera por capital (tamaño) y rendimiento (color).
  - Gráfico de **Evolución de Inversión** (Línea) para crecimiento acumulado.
  - Gráfico de **Rendimiento Individual** (Barras) y Distribución (Doughnut/Pie).
- 📱 **PWA v2 (Progressive Web App)**:
  - **Estrategia Stale-While-Revalidate**: Carga instantánea desde caché con actualización asíncrona en segundo plano.
  - Soporte offline total para la interfaz y caché persistente de datos de API.
- 🛡️ **Seguridad Blindada**: 
  - Protección mediante **Helmet.js** con CSP restrictiva (solo recursos locales).
  - Todas las librerías externas (Chart.js, Treemap) servidas localmente para máxima privacidad y control.

## ✨ Características Principales

- 📊 **Dashboard Ejecutivo**: 4 tarjetas KPI principales (Inversión, Valor Actual, Ganancia Total y Rendimiento %).
- 🗺️ **Mapa de Calor Pro**: Identificación visual inmediata de activos ganadores y perdedores.
- 💰 **Cartera Inteligente**: Diseño colapsable, tablas densas y vista de tarjetas optimizada para móviles.
- 📅 **Historial Cronológico**: Operaciones agrupadas con capitalización automática y diseño compacto.
- 🌙 **Modo Oscuro Premium**: Transiciones suaves y gráficos adaptativos.

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express.js, dotenv
- **Base de Datos (Caché)**: Redis (vía ioredis / Upstash)
- **Frontend**: Vanilla JS (ES6+), CSS3 (Variables & Grid), HTML5, SVG Icons
- **Comunicación**: Fetch API (Async/Await)
- **Gestor de Paquetes**: pnpm
- **Optimización**: Compression, Terser, Clean-CSS
- **Seguridad**: Helmet, Express-Rate-Limit, CORS
- **Librerías**: Chart.js v4 (Local), Treemap Plugin (Local)

## Estructura del Proyecto

```
operetas-arg/
├── server.js               # Servidor optimizado con compresión y caché
├── views/
│   └── renderPage.js       # Shell estático (Skeleton)
├── public/                 # Recursos optimizados
│   ├── css/
│   │   ├── styles.css      # Código fuente de estilos
│   │   └── styles.min.css  # Versión minificada para producción
│   ├── js/
│   │   ├── app.js          # Motor de renderizado (Fuente)
│   │   ├── app.min.js      # Motor optimizado para producción
│   │   ├── chart.min.js    # Chart.js v4 (Local)
│   │   └── sw.js           # Service Worker v2 (Stale-While-Revalidate)
└── package.json            # Scripts de build y dependencias
```

## Instalación y Uso

```bash
# 1. Instalar dependencias
pnpm install

# 2. Generar archivos optimizados (Minificación)
pnpm run build

# 3. Iniciar en modo producción
pnpm start

# O modo desarrollo (auto-reload)
pnpm run dev
```

---
*Desarrollado con foco en la experiencia de usuario y la eficiencia de datos.*

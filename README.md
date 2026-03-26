# 📈 Operetas AR - Dashboard de Inversiones

Aplicación web profesional de alto rendimiento para el seguimiento y análisis de activos financieros en el mercado argentino. Optimizada para velocidad extrema, seguridad y usabilidad en múltiples dispositivos.

## 🚀 Innovaciones Tecnológicas y Recientes

Esta aplicación ha evolucionado a una solución de alto rendimiento con las siguientes actualizaciones:

- ⚡ **Performance de Grado Producción**:
  - **Procesamiento Paralelo**: Optimización de `getDashboardData` para ejecutar agrupamientos y peticiones de red en paralelo.
  - **Resiliencia de Red**: Implementación de `fetchWithRetry` para manejar fallos temporales en APIs externas.
  - **Eliminación de Redundancia**: Reducción de llamadas a API mediante el procesamiento local de datos de transacciones.
  - **Compresión Inteligente**: Gzip/Brotli mediante `compression` para reducir transferencias hasta un 70%.
  - **Estrategia de Caché Agresiva**: Cabeceras `Cache-Control` de larga duración (1 año) para activos estáticos.
- 📉 **Visualización Avanzada (Chart.js v4)**:
  - **Nuevo**: **Comparativa de Capital** (Inversión vs Valor Actual) para análisis de crecimiento real.
  - **Nuevo**: **Mapa de Calor (Treemap)** que muestra la distribución de cartera por capital (tamaño) y rendimiento (color).
  - Gráfico de **Rendimiento Individual** (Barras) y Distribución (Doughnut/Pie).
- 📱 **PWA v3 (Progressive Web App)**:
  - **Estrategia Stale-While-Revalidate**: Carga instantánea desde caché con actualización asíncrona en segundo plano.
  - Soporte offline total para la interfaz y caché persistente de datos de API.
- 🛡️ **Seguridad Blindada**: 
  - **CSP Estricta**: Eliminación de scripts inline; configuración de Content Security Policy (`script-src: 'self'`).
  - **Protección**: Uso de **Helmet.js** y Rate Limiting dual (Global y API).
  - **Privacidad**: Todas las librerías externas servidas localmente desde `/js/`.

## ✨ Características Principales

- 📊 **Dashboard Ejecutivo**: 4 tarjetas KPI principales (Inversión, Valor Actual, Ganancia Total y Rendimiento %).
- 🗺️ **Mapa de Calor Pro**: Identificación visual inmediata de activos ganadores y perdedores.
- 💰 **Cartera Inteligente**: Diseño colapsable, tablas densas y vista de tarjetas optimizada para móviles.
- 📅 **Historial Cronológico**: Operaciones agrupadas con capitalización automática y diseño compacto.
- 🌙 **Modo Oscuro Premium**: Transiciones suaves y gráficos adaptativos sin parpadeos iniciales.

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express.js, dotenv
- **Base de Datos (Caché)**: Redis (vía ioredis / Upstash)
- **Frontend**: Vanilla JS (ES6+), CSS3 (Variables & Grid), HTML5, SVG Icons
- **Comunicación**: Fetch API (Async/Await) con lógica de reintentos
- **Gestor de Paquetes**: pnpm
- **Optimización**: Compression, Terser, Clean-CSS
- **Seguridad**: Helmet (CSP Estricta), Express-Rate-Limit, CORS
- **Librerías**: Chart.js v4 (Local), Treemap Plugin (Local)

## Estructura del Proyecto

```
operetas-arg/
├── server.js               # Servidor optimizado con paralelismo y seguridad
├── views/
│   └── renderPage.js       # Shell estático (Skeleton) limpio de scripts
├── public/                 # Recursos optimizados
│   ├── css/
│   │   ├── styles.css      # Código fuente de estilos
│   │   └── styles.min.css  # Versión minificada para producción
│   ├── js/
│   │   ├── theme-init.js   # Inicialización segura de modo oscuro
│   │   ├── app.js          # Motor de renderizado (Fuente)
│   │   ├── app.min.js      # Motor optimizado para producción
│   │   ├── chart.min.js    # Chart.js v4 (Local)
│   │   └── sw.js           # Service Worker v3 (Stale-While-Revalidate)
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

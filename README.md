# 📈 Operetas AR - Dashboard de Inversiones

Aplicación web profesional de alto rendimiento para el seguimiento y análisis de activos financieros en el mercado argentino. Optimizada para velocidad, seguridad y usabilidad en múltiples dispositivos.

## 🚀 Innovaciones Tecnológicas y Recientes

Esta aplicación ha evolucionado a una solución moderna de alto rendimiento con las siguientes actualizaciones:

- ⚡ **Arquitectura Shell-First & Instant Load**: Carga inmediata de la interfaz mediante Skeleton Screens y persistencia de datos en `localStorage` para una experiencia instantánea.
- 💾 **Caché Inteligente con Redis**: Implementación de Upstash/Redis para almacenar precios de mercado en tiempo real, reduciendo latencia y optimizando el consumo de APIs externas.
- 📈 **Visualización Avanzada (Chart.js v4)**:
  - **Nuevo**: Gráfico de **Evolución de Inversión** (Línea) que muestra el crecimiento acumulado.
  - Gráfico de **Rendimiento Individual** (Barras) con porcentajes de ganancia/pérdida.
  - Distribución de cartera por Ticker (Doughnut) y por Tipo de Activo (Pie).
- 📱 **PWA (Progressive Web App)**: Instalable, con Service Worker para soporte offline y acceso directo desde la pantalla de inicio.
- 🛡️ **Seguridad de Grado Producción**: 
  - Protección mediante **Helmet.js** con CSP personalizada.
  - **Doble Nivel de Rate Limiting**: Limitación global y específica para la API de datos.
  - CORS restrictivo mediante `ALLOWED_ORIGINS` configurables.

## ✨ Características Principales

- 📊 **Dashboard Ejecutivo**: 4 tarjetas KPI principales (Inversión, Valor Actual, Ganancia Total y Rendimiento %).
- 💰 **Cartera Inteligente**:
  - Diseño colapsable para optimizar el espacio visual.
  - Tabla compacta con apilamiento de datos para Tablets.
  - Vista de tarjetas densas para Móviles con detalle de cantidad.
  - Indicadores visuales automáticos de rentabilidad (Esmeralda/Rojo).
- 📅 **Historial Cronológico**: Operaciones agrupadas por fecha, con capitalización automática y diseño compacto colapsable.
- 🌙 **Modo Oscuro Premium**: Transiciones suaves y gráficos que se adaptan automáticamente al tema elegido.

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express.js
- **Base de Datos (Caché)**: Redis (vía ioredis / Upstash)
- **Frontend**: Vanilla JS (ES6+), CSS3 (Variables & Grid), HTML5
- **Seguridad**: Helmet, Express-Rate-Limit, CORS
- **Librerías**: Chart.js v4 (Gráficos), Water.css (Base minimalista)

## Estructura del Proyecto

```
operetas-arg/
├── server.js               # Servidor seguro con lógica de Redis y APIs
├── views/
│   └── renderPage.js       # Shell estático de la aplicación
├── public/                 # Recursos del cliente
│   ├── css/
│   │   └── styles.css      # Diseño Slate & Indigo y Micro-interacciones
│   ├── js/
│   │   ├── app.js          # Motor de renderizado asíncrono y PWA
│   │   └── sw.js           # Service Worker para soporte Offline
│   ├── manifest.json       # Manifiesto de aplicación instalable
│   └── favicon.svg         # Identidad visual
└── package.json            # Dependencias de producción
```

## Configuración

Crear un archivo `.env` con las siguientes variables:

```env
API_URL=<url_compras>
API_URL_TOTAL=<url_resumen>
API_KEY=<tu_clave>
PRICE_API_URL=<api_precios>
REDIS_URL=<url_conexion_redis>
ALLOWED_ORIGINS=http://localhost:3000,https://tusitio.vercel.app
MARKET_SUFFIX=.BA
PORT=3000
```

## Instalación y Uso

```bash
# Instalar dependencias
pnpm install

# Iniciar en modo desarrollo (auto-reload)
pnpm run dev

# Iniciar en modo producción
pnpm start
```

---
*Desarrollado con foco en la experiencia de usuario y la eficiencia de datos.*

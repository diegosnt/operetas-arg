# 📈 Operetas AR - Dashboard de Inversiones

Aplicación web profesional de alto rendimiento para el seguimiento y análisis de activos financieros en el mercado argentino. Optimizada para velocidad, seguridad y usabilidad en múltiples dispositivos.

## 🚀 Innovaciones Tecnológicas

Esta aplicación ha sido evolucionada de una arquitectura estática a una solución moderna de alto rendimiento:

- ⚡ **Arquitectura Shell-First**: Carga instantánea de la interfaz (Skeleton Screens) mientras los datos financieros se procesan en segundo plano.
- 💾 **Caché Persistente con Redis**: Implementación de Upstash/Redis para almacenar precios de mercado, reduciendo la latencia de segundos a milisegundos y optimizando el consumo de APIs externas.
- 📱 **PWA (Progressive Web App)**: Instalable en dispositivos móviles y escritorio, con capacidades offline y acceso directo desde el inicio.
- 🛡️ **Seguridad Avanzada**: Protección mediante Helmet.js (CSP, HSTS), Rate Limiting para prevenir abusos y CORS restrictivo.
- 🎨 **Interfaz "Slate & Indigo"**: Diseño moderno con micro-interacciones suaves, transiciones de modo oscuro fluido y adaptabilidad total.

## ✨ Características Principales

- 📊 **Dashboard Ejecutivo**: 4 tarjetas KPI principales (Inversión, Valor Actual, Ganancia Total y Rendimiento %).
- 💰 **Cartera de Activos Inteligente**:
  - Tabla compacta con apilamiento de datos para Tablets (sin scroll horizontal).
  - Vista de tarjetas densas para Móviles con detalle de cantidad.
  - Cálculos automáticos de rentabilidad con indicadores visuales Esmeralda/Rojo.
- 📈 **Análisis Visual Pro**:
  - Gráficos de distribución por Ticker y por Tipo de Activo.
  - Nuevo gráfico de barras de **Rendimiento Individual** por activo ($).
- 📅 **Historial Cronológico**: Operaciones agrupadas por fecha con capitalización automática y diseño compacto.
- 🌙 **Modo Oscuro Premium**: Transiciones suaves de 0.4s entre temas para evitar la fatiga visual.

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
MARKET_SUFFIX=.BA
PORT=3000
```

## Instalación y Uso

```bash
# Instalar dependencias
pnpm install

# Iniciar en modo producción
pnpm start

# Iniciar en modo desarrollo (auto-reload)
pnpm run dev
```

---
*Desarrollado con foco en la experiencia de usuario y la eficiencia de datos.*

# 🏗️ Skill: Slate & Indigo Dashboard Blueprint (v2.0)

Esta guía define los estándares de arquitectura, seguridad y diseño para aplicaciones de seguimiento de datos de alto rendimiento, basadas en la evolución del proyecto "Operetas AR".

## 🛠️ Pilares de Arquitectura

### 1. Modelo Híbrido (Shell-First)
- **Backend**: Servidor Express con `dotenv` para gestión de secretos y entorno.
- **Frontend**: Renderizado asíncrono en el cliente mediante `fetch()` (Async/Await) a endpoints `/api/...`.
- **Estado**: Carga inicial desde `localStorage` para percepción de velocidad instantánea.

### 2. Gestión y Despliegue
- **Package Manager**: Uso obligatorio de `pnpm` para gestión eficiente de dependencias.
- **Pipeline de Build**: Automatización con `clean-css-cli` y `terser` para minificación de activos.

### 3. Estrategia de Performance (Grado Producción)
- **Compresión**: Uso obligatorio de `compression` (Gzip/Brotli).
- **Caché HTTP**: Servir recursos estáticos (`public/`) con `maxAge: '1y'` y `etag`.
- **Minificación**: Servir versiones `.min.js` y `.min.css` en producción.
- **Service Worker**: Estrategia `Stale-While-Revalidate` (v2) para carga offline instantánea.

### 3. Seguridad Blindada
- **Recursos Locales**: Prohibida la carga de scripts externos (CDN). Todas las librerías deben estar en `/js/` locales.
- **Helmet.js**: CSP estricta que solo permite `'self'` y `'unsafe-inline'`.
- **Doble Rate Limiting**: Límites globales y específicos para APIs.

## 🎨 Visualización de Datos (Chart.js v4)

- **Distribución Estática**: Doughnut/Pie para tickers y tipos de activo.
- **Evolución Temporal**: Gráficos de línea para tendencias de inversión.
- **Mapa de Calor (Treemap)**: Visualización de 2 dimensiones (Capital vs. Rendimiento) para análisis rápido de portafolio.

## 📱 Responsividad Inteligente (3 Niveles)

1.  **PC (>1200px)**: Contenedor con `max-width: 1600px` y padding lateral del `10%`. Tablas completas y Treemap expandido.
2.  **Tablet (768px - 1200px)**: **Cell Stacking**. Agrupar datos relacionados para evitar scroll horizontal.
3.  **Mobile (<768px)**: 
    - **KPIs**: Cuadrícula de 2x2.
    - **Tablas**: Ocultas totalmente.
    - **Contenido**: Sustituido por tarjetas densas y Treemap adaptativo.

## 🚀 Requisitos de PWA
- **Manifest**: Identidad visual Indigo, visualización `standalone`.
- **Versión de Caché**: Control de versiones (`v2`, `v3`) para forzar actualizaciones críticas.

---
*Este documento es la especificación técnica maestra para el ecosistema Operetas.*

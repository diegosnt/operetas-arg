# 📈 Operetas AR - Registro de Operaciones

Aplicación web desarrollada con Express.js para visualizar y analizar operaciones de inversión en acciones y CEDEARs del mercado argentino.

## ✨ Características

- 📊 **Resumen consolidado** por ticker con precio promedio, cantidad total y monto invertido
- 📈 **Gráficos de torta (pie charts)** interactivos de distribución por especie y tipo de instrumento
- 📅 **Histórico de operaciones** organizadas por fecha con desplegables colapsables
- 🌙 **Modo oscuro** automático con persistencia en localStorage y actualización dinámica
- 📱 **Completamente responsive**:
  - 💻 Desktop: Tablas completas con todas las columnas
  - 📱 Tablet/Móvil: Tablas scrolleables horizontalmente
  - 📲 Móvil pequeño: Vista de tarjetas (cards) vertical
- 🎨 **Leyendas adaptativas**: Al costado en móviles, abajo en desktop
- ⚡ **100% offline**: Todas las librerías alojadas localmente

## Instalación

```bash
pnpm install
```

## Configuración

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
API_URL=<url_api_operaciones>
API_URL_TOTAL=<url_api_resumen>
API_KEY=<api_key>
PORT=3000
```

Variables:
- `API_URL`: Endpoint de la API de operaciones individuales
- `API_URL_TOTAL`: Endpoint de la API con resumen consolidado
- `API_KEY`: Clave de autenticación para las APIs
- `PORT`: Puerto del servidor (por defecto 3000)

Ver `.env.example` para referencia.

## Uso

### Iniciar el servidor:

```bash
pnpm start
```

O en modo desarrollo con auto-reload:

```bash
pnpm run dev
```

Acceder a la aplicación en `http://localhost:3000`

## Rutas disponibles

- `GET /` - Interfaz web principal con visualización completa
- `GET /api/purchases` - API que devuelve las operaciones en formato JSON

## Estructura del proyecto

```
operetas-arg/
├── server.js               # Servidor Express y lógica de backend
├── views/
│   └── renderPage.js       # Template HTML con renderizado dinámico
├── public/                 # Archivos estáticos servidos por Express
│   ├── css/
│   │   ├── water.min.css   # Framework CSS minimalista
│   │   └── styles.css      # Estilos personalizados
│   ├── js/
│   │   ├── chart.min.js    # Chart.js para gráficos
│   │   └── app.js          # Lógica del cliente
│   └── favicon.svg         # Icono de la aplicación
├── package.json            # Configuración de dependencias
├── pnpm-lock.yaml          # Lock file de dependencias
├── .env                    # Variables de entorno (no versionar)
├── .env.example            # Plantilla de variables de entorno
├── .gitignore              # Archivos ignorados por git
└── README.md               # Documentación
```

## Estructura de datos

### API de Operaciones (`API_URL`)
Devuelve un array de operaciones individuales:

```json
{
  "ticker": "INVJ",
  "name": "INVERSORA JURAMENTO SA",
  "type": "acción",
  "purchase_price": 648.57,
  "purchase_amount": 50,
  "purchase_date": "2025-12-04"
}
```

### API de Resumen Total (`API_URL_TOTAL`)
Devuelve un array con datos consolidados por ticker:

```json
{
  "ticker": "INVJ",
  "name": "INVERSORA JURAMENTO SA",
  "type": "acción",
  "total_purchase_amount": 50,
  "average_purchase_price": 648.57,
  "total_investment": 32428.30
}
```

## 🛠️ Tecnologías utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web minimalista
- **dotenv** - Gestión de variables de entorno
- **Fetch API** - Cliente HTTP nativo

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos y animaciones
- **JavaScript ES6+** - Lógica del cliente (vanilla)

### Librerías
- **Chart.js v4.4.1** (~60KB) - Gráficos de torta interactivos y responsive
- **Water.css** (~2.6KB) - Framework CSS minimalista sin clases

### Características técnicas
- ✅ **Arquitectura separada**: HTML, CSS y JavaScript en archivos independientes
- ✅ Sin dependencias frontend (jQuery, React, etc.)
- ✅ Sin build tools ni transpiladores
- ✅ Todas las librerías alojadas localmente
- ✅ Compatible con todos los navegadores modernos
- ✅ SEO friendly con SSR (Server-Side Rendering)
- ✅ **Paleta de colores personalizable**: Océano y Naturaleza (azul cielo, azul marino, teal)

## 📊 Características de los gráficos

- **Tipo**: Pie charts (gráficos de torta)
- **Leyendas personalizadas**: Muestran ticker y monto ($)
- **Tooltips informativos**: Valor + porcentaje del total
- **Colores consistentes**: Paleta de 10 colores vibrantes
- **Responsive**:
  - Desktop: Leyendas abajo, altura 220px
  - Móvil: Leyendas al costado derecho, altura 160-180px
- **Modo oscuro**: Las etiquetas cambian de color automáticamente
- **Animaciones suaves**: Transiciones al cargar y actualizar

## 🎨 Diseño responsive

### Breakpoints
- **Desktop**: > 900px - Layout completo con 2 columnas
- **Tablet**: 769-900px - 1 columna, tablas scrolleables
- **Móvil**: 481-768px - Tablas compactas, fuentes reducidas
- **Móvil pequeño**: ≤ 480px - Vista de tarjetas (cards)

### Adaptaciones por dispositivo
| Componente | Desktop | Tablet | Móvil | Móvil pequeño |
|------------|---------|--------|-------|---------------|
| Tabla resumen | Completa | Completa | Scroll H | Cards |
| Tablas por fecha | Completa | Completa | Scroll H | Cards |
| Gráficos | 2 columnas | 1 columna | 1 columna | 1 columna |
| Leyendas | Abajo | Derecha | Derecha | Derecha |

## 📝 Notas de desarrollo

- El proyecto usa **pnpm** como gestor de paquetes
- Los gráficos se actualizan dinámicamente al cambiar de modo oscuro
- Las tarjetas móviles tienen sombras y bordes para mejor separación visual
- Todos los colores son accesibles según estándares WCAG
- El favicon usa un SVG personalizado con gráfico ascendente verde

## 🎨 Paleta de colores

La aplicación utiliza la paleta **"Océano y Naturaleza"** con gradientes invertidos (oscuro a claro):

- **Título principal**: Gradiente azul cielo (`#0284c7` → `#0ea5e9`)
- **Secciones principales**: Gradiente azul marino (`#1e3a8a` → `#1e40af`)
- **Fechas individuales**: Gradiente teal (`#0d9488` → `#14b8a6`)
- **Modo oscuro**: Cyan claro para textos destacados (`#22d3ee`)

## 🚀 Mejoras recientes

- ✅ Código separado en archivos independientes (HTML, CSS, JS)
- ✅ Favicon SVG personalizado con línea verde ascendente
- ✅ Paleta de colores profesional con diferenciación clara de secciones
- ✅ Gradientes invertidos para mejor contraste del texto
- ✅ Estructura modular para mejor mantenibilidad

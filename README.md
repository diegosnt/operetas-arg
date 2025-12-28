# Operetas Arg - Registro de Operaciones

Aplicación web desarrollada con Express.js que consume APIs REST para visualizar y analizar operaciones de inversión en acciones y CEDEARs.

## Características

- 📊 **Resumen consolidado** por ticker con precio promedio, cantidad total y monto invertido
- 📈 **Gráficos interactivos** de distribución por especie y tipo de instrumento
- 📅 **Histórico de operaciones** organizadas por fecha
- 🌙 **Modo oscuro** con persistencia en localStorage
- 📱 **Diseño responsive** optimizado para desktop y móvil

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
├── server.js          # Servidor Express y lógica principal
├── package.json       # Configuración de dependencias
├── .env              # Variables de entorno (no versionar)
├── .env.example      # Plantilla de variables de entorno
├── .gitignore        # Archivos ignorados por git
├── public/           # Archivos estáticos
│   ├── css/          # Hojas de estilo (Water.css, Frappe Charts)
│   └── js/           # Librerías JavaScript (Frappe Charts)
└── README.md         # Documentación
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

## Tecnologías utilizadas

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Gráficos**: Frappe Charts
- **Estilos**: Water.css
- **HTTP Client**: Fetch API

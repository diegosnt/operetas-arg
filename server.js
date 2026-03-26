require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const Redis = require('ioredis');
const { renderPage } = require('./views/renderPage');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Performance & Seguridad ---
app.use(compression()); // Gzip/Brotli para reducir transferencia de datos

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
    },
  },
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', /\.vercel\.app$/];

app.use(cors({ origin: allowedOrigins, methods: ['GET'] }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30
});

app.use(globalLimiter);

// Configuración de estáticos con caché agresivo (1 año) para librerías y estilos
app.use(express.static('public', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));


// --- Lógica de Datos y Redis ---

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, { connectTimeout: 5000, maxRetriesPerRequest: 1 });
    redis.on('error', () => {}); 
  } catch (e) {}
}

const localPriceCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchPurchases() {
  const response = await fetch(process.env.API_URL, {
    headers: { 'apikey': process.env.API_KEY, 'Authorization': `Bearer ${process.env.API_KEY}`, 'Content-Type': 'application/json' }
  });
  return await response.json();
}

async function fetchTotalSummary() {
  const response = await fetch(process.env.API_URL_TOTAL, {
    headers: { 'apikey': process.env.API_KEY, 'Authorization': `Bearer ${process.env.API_KEY}`, 'Content-Type': 'application/json' }
  });
  return await response.json();
}

async function fetchCurrentPrice(ticker) {
  const cacheKey = `price:${ticker}`;
  try {
    let cached = null;
    if (redis) {
      try { cached = await redis.get(cacheKey); } catch (e) {}
    }
    if (!cached && localPriceCache.has(ticker)) {
      const d = localPriceCache.get(ticker);
      if (Date.now() - d.timestamp < CACHE_TTL_MS) cached = d.price;
    }
    if (cached) return cached;

    const fullTicker = `${ticker}${process.env.MARKET_SUFFIX || ''}`;
    const url = `${process.env.PRICE_API_URL}/${fullTicker}?interval=1d&range=1d`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;

    if (price !== null) {
      if (redis) try { await redis.set(cacheKey, price, 'EX', 300); } catch (e) {}
      localPriceCache.set(ticker, { price, timestamp: Date.now() });
    }
    return price;
  } catch (error) { return null; }
}

async function fetchAllCurrentPrices(tickers) {
  const results = await Promise.all(tickers.map(t => fetchCurrentPrice(t).then(p => ({ t, p }))));
  return results.reduce((acc, { t, p }) => { acc[t] = p; return acc; }, {});
}

async function getDashboardData() {
  const [purchases, totalSummary] = await Promise.all([fetchPurchases(), fetchTotalSummary()]);
  const currentPrices = await fetchAllCurrentPrices(totalSummary.map(item => item.ticker));

  const groupedByDate = purchases.reduce((groups, p) => {
    const d = p.purchase_date;
    if (!groups[d]) groups[d] = [];
    groups[d].push(p);
    return groups;
  }, {});

  const calculatedTickerSummary = purchases.reduce((acc, p) => {
    const ticker = p.ticker;
    if (!acc[ticker]) {
      acc[ticker] = { 
        ticker, 
        name: p.name || ticker, 
        type: p.type || 'Sin tipo', 
        totalAmount: 0, 
        totalCost: 0 
      };
    }
    
    const operation = (p.operation || 'COMPRA').toUpperCase();
    const cost = p.purchase_price * p.purchase_amount;
    const amount = p.purchase_amount;
    
    if (operation === 'VENTA' || operation === 'SELL') {
      acc[ticker].totalAmount -= amount;
      acc[ticker].totalCost -= cost;
    } else {
      acc[ticker].totalAmount += amount;
      acc[ticker].totalCost += cost;
    }
    
    return acc;
  }, {});

  const tickerSummary = Object.values(calculatedTickerSummary).map(item => ({
    ...item,
    averagePrice: item.totalAmount > 0 ? item.totalCost / item.totalAmount : 0,
    currentPrice: currentPrices[item.ticker] || null
  })).sort((a, b) => a.ticker.localeCompare(b.ticker));

  const groupedByType = purchases.reduce((groups, p) => {
    const t = p.type || 'Sin tipo';
    if (!groups[t]) groups[t] = { type: t, totalCost: 0, count: 0 };
    
    const operation = (p.operation || 'COMPRA').toUpperCase();
    const cost = p.purchase_price * p.purchase_amount;
    
    if (operation === 'VENTA' || operation === 'SELL') {
      groups[t].totalCost -= cost;
    } else {
      groups[t].totalCost += cost;
    }
    
    groups[t].count++;
    return groups;
  }, {});

  return {
    tickerSummary,
    typeSummary: Object.values(groupedByType).sort((a, b) => a.type.localeCompare(b.type)),
    sortedDates: Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)),
    groupedByDate,
    purchases
  };
}

// --- Rutas ---
app.get('/', (req, res) => res.send(renderPage()));

app.get('/api/data', dataLimiter, async (req, res) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error al obtener datos' }); }
});

app.listen(PORT, () => {});

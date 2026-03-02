require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { kv } = require('@vercel/kv');
const { renderPage } = require('./views/renderPage');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Seguridad y Middleware ---

// 1. Helmet: Cabeceras de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"], 
    },
  },
}));

// 2. CORS: Restringir origen
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', /\.vercel\.app$/];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET'],
  optionsSuccessStatus: 200
}));

// 3. Rate Limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Demasiadas solicitudes. Por favor, intente de nuevo más tarde.'
});

const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Has alcanzado el límite de actualización de datos. Por favor, espera 15 minutos.'
});

app.use(globalLimiter);
app.use(express.static('public'));

// --- Lógica de Caché y Datos ---

const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const localPriceCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchPurchases() {
  const response = await fetch(process.env.API_URL, {
    method: 'GET',
    headers: {
      'apikey': process.env.API_KEY,
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return await response.json();
}

async function fetchTotalSummary() {
  const response = await fetch(process.env.API_URL_TOTAL, {
    method: 'GET',
    headers: {
      'apikey': process.env.API_KEY,
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return await response.json();
}

async function fetchCurrentPrice(ticker) {
  const cacheKey = `price:${ticker}`;
  try {
    let cached = null;
    if (isRedisConfigured) {
      try { cached = await kv.get(cacheKey); } catch (e) { console.warn('Redis error'); }
    }
    if (!cached && localPriceCache.has(ticker)) {
      const d = localPriceCache.get(ticker);
      if (Date.now() - d.timestamp < CACHE_TTL_MS) cached = d.price;
    }
    if (cached) return cached;

    const fullTicker = `${ticker}${process.env.MARKET_SUFFIX || ''}`;
    const url = `${process.env.PRICE_API_URL}/${fullTicker}?interval=1d&range=1d`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;

    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;

    if (price !== null) {
      if (isRedisConfigured) {
        try { await kv.set(cacheKey, price, { ex: 300 }); } catch (e) {}
      }
      localPriceCache.set(ticker, { price, timestamp: Date.now() });
    }
    return price;
  } catch (error) {
    return null;
  }
}

async function fetchAllCurrentPrices(tickers) {
  const results = await Promise.all(tickers.map(ticker => 
    fetchCurrentPrice(ticker).then(price => ({ ticker, price }))
  ));
  return results.reduce((acc, { ticker, price }) => {
    acc[ticker] = price;
    return acc;
  }, {});
}

async function getDashboardData() {
  const [purchases, totalSummary] = await Promise.all([fetchPurchases(), fetchTotalSummary()]);

  const groupedByDate = purchases.reduce((groups, p) => {
    const d = p.purchase_date;
    if (!groups[d]) groups[d] = [];
    groups[d].push(p);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  const tickerSummary = totalSummary.map(item => ({
    ticker: item.ticker,
    name: item.name,
    type: item.type,
    totalAmount: item.total_purchase_amount || 0,
    averagePrice: item.average_purchase_price || 0,
    totalCost: item.total_investment || 0
  })).sort((a, b) => a.ticker.localeCompare(b.ticker));

  const currentPrices = await fetchAllCurrentPrices(tickerSummary.map(item => item.ticker));
  tickerSummary.forEach(item => {
    item.currentPrice = currentPrices[item.ticker] || null;
  });

  const groupedByType = purchases.reduce((groups, p) => {
    const t = p.type || 'Sin tipo';
    if (!groups[t]) groups[t] = { type: t, totalCost: 0, count: 0 };
    groups[t].totalCost += (p.purchase_price * p.purchase_amount);
    groups[t].count++;
    return groups;
  }, {});

  return {
    tickerSummary,
    typeSummary: Object.values(groupedByType).sort((a, b) => a.type.localeCompare(b.type)),
    sortedDates,
    groupedByDate,
    purchases
  };
}

// --- Rutas ---

app.get('/', (req, res) => {
  res.send(renderPage());
});

app.get('/api/data', dataLimiter, async (req, res) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.get('/api/purchases', async (req, res) => {
  try {
    const p = await fetchPurchases();
    res.json(p);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener compras' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

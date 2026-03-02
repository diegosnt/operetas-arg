require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const Redis = require('ioredis');
const { renderPage } = require('./views/renderPage');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Seguridad ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"], 
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
app.use(express.static('public'));

// --- Lógica de Datos y Redis ---

// Conexión inteligente a Redis
let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1
    });
    redis.on('error', (err) => console.warn('Redis connection error:', err.message));
  } catch (e) {
    console.warn('Could not initialize Redis');
  }
}

const localPriceCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
let lastDataSource = 'Ninguna';

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
    
    // 1. Intentar Redis
    if (redis) {
      try { 
        cached = await redis.get(cacheKey); 
        if (cached) lastDataSource = 'Redis (Persistente)';
      } catch (e) { console.warn('Redis get error'); }
    }
    
    // 2. Intentar Memoria
    if (!cached && localPriceCache.has(ticker)) {
      const d = localPriceCache.get(ticker);
      if (Date.now() - d.timestamp < CACHE_TTL_MS) {
        cached = d.price;
        lastDataSource = 'Memoria (Volátil)';
      }
    }
    if (cached) return cached;

    // 3. Consultar API
    lastDataSource = 'API (Directa)';
    const fullTicker = `${ticker}${process.env.MARKET_SUFFIX || ''}`;
    const url = `${process.env.PRICE_API_URL}/${fullTicker}?interval=1d&range=1d`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;

    if (price !== null) {
      if (redis) {
        try { await redis.set(cacheKey, price, 'EX', 300); } catch (e) {}
      }
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

  const tickerSummary = totalSummary.map(item => ({
    ticker: item.ticker,
    name: item.name,
    type: item.type,
    totalAmount: item.total_purchase_amount || 0,
    averagePrice: item.average_purchase_price || 0,
    totalCost: item.total_investment || 0,
    currentPrice: currentPrices[item.ticker] || null
  })).sort((a, b) => a.ticker.localeCompare(b.ticker));

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
    sortedDates: Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)),
    groupedByDate,
    purchases,
    debug: { source: lastDataSource, redis: !!redis }
  };
}

// --- Rutas ---
app.get('/', (req, res) => res.send(renderPage()));

app.get('/api/data', dataLimiter, async (req, res) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.listen(PORT, () => console.log(`Iniciado en puerto ${PORT}`));

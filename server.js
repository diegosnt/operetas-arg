require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { kv } = require('@vercel/kv');
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

// Diagnóstico de variables en consola de Vercel
console.log('--- Redis Config ---');
console.log('UPSTASH_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? 'OK' : 'MISS');
console.log('KV_REST_URL:', process.env.KV_REST_API_URL ? 'OK' : 'MISS');

const isRedisConfigured = !!(
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) || 
  (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
);

const localPriceCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
let lastDataSource = 'API Directa';

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
    if (isRedisConfigured) {
      try { 
        cached = await kv.get(cacheKey); 
        if (cached) lastDataSource = 'Redis (Persistente)';
      } catch (e) { console.error('Redis error'); }
    }
    if (!cached && localPriceCache.has(ticker)) {
      const d = localPriceCache.get(ticker);
      if (Date.now() - d.timestamp < CACHE_TTL_MS) {
        cached = d.price;
        lastDataSource = 'Memoria (Volátil)';
      }
    }
    if (cached) return cached;

    lastDataSource = 'API (Yahoo/Market)';
    const fullTicker = `${ticker}${process.env.MARKET_SUFFIX || ''}`;
    const url = `${process.env.PRICE_API_URL}/${fullTicker}?interval=1d&range=1d`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;

    if (price !== null) {
      if (isRedisConfigured) try { await kv.set(cacheKey, price, { ex: 300 }); } catch (e) {}
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
    debug: { source: lastDataSource, redis: isRedisConfigured }
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

app.listen(PORT, () => console.log(`Puerto: ${PORT}`));

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
app.use(compression());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'"],
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

app.use(express.static('public', {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// --- Lógica de Datos y Redis ---

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, { 
      connectTimeout: 5000, 
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
    redis.on('error', (err) => console.error('Redis error:', err.message)); 
  } catch (e) {
    console.error('Redis connection failed:', e.message);
  }
}

const localPriceCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i === retries) throw new Error(`Status ${response.status}`);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function fetchPurchases() {
  const response = await fetchWithRetry(process.env.API_URL, {
    headers: { 
      'apikey': process.env.API_KEY, 
      'Authorization': `Bearer ${process.env.API_KEY}`, 
      'Content-Type': 'application/json' 
    }
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
    
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;

    if (price !== null) {
      if (redis) try { await redis.set(cacheKey, price, 'EX', 300); } catch (e) {}
      localPriceCache.set(ticker, { price, timestamp: Date.now() });
    }
    return price;
  } catch (error) { 
    return null; 
  }
}

async function fetchAllCurrentPrices(tickers) {
  const results = await Promise.all(tickers.map(t => fetchCurrentPrice(t).then(p => ({ t, p }))));
  return results.reduce((acc, { t, p }) => { acc[t] = p; return acc; }, {});
}

async function getDashboardData() {
  const purchases = await fetchPurchases();
  
  // Extraemos tickers únicos para pedir precios en paralelo mientras procesamos el resto
  const uniqueTickers = [...new Set(purchases.map(p => p.ticker))];
  const currentPricesPromise = fetchAllCurrentPrices(uniqueTickers);

  // Procesamiento paralelo de agrupamientos
  const [groupedByDate, calculatedTickerSummary, groupedByType] = await Promise.all([
    Promise.resolve(purchases.reduce((groups, p) => {
      const d = p.purchase_date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(p);
      return groups;
    }, {})),
    Promise.resolve(purchases.reduce((acc, p) => {
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
    }, {})),
    Promise.resolve(purchases.reduce((groups, p) => {
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
    }, {}))
  ]);

  const currentPrices = await currentPricesPromise;

  const tickerSummary = Object.values(calculatedTickerSummary)
    .filter(item => item.totalAmount > 0)
    .map(item => ({
      ...item,
      averagePrice: item.totalCost / item.totalAmount,
      currentPrice: currentPrices[item.ticker] || null
    })).sort((a, b) => a.ticker.localeCompare(b.ticker));

  // Recalcular typeSummary basado solo en activos con cantidad > 0
  const typeSummaryMap = tickerSummary.reduce((acc, item) => {
    const type = item.type || 'Sin tipo';
    if (!acc[type]) acc[type] = { type, totalCost: 0 };
    acc[type].totalCost += item.totalCost;
    return acc;
  }, {});

  return {
    tickerSummary,
    typeSummary: Object.values(typeSummaryMap).sort((a, b) => a.type.localeCompare(b.type)),
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
  } catch (error) { 
    console.error('Data Error:', error.message);
    res.status(500).json({ error: 'Error al obtener datos' }); 
  }
});

app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));

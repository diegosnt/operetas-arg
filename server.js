require('dotenv').config();
const express = require('express');
const { renderPage } = require('./views/renderPage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

async function fetchPurchases() {
  const response = await fetch(process.env.API_URL, {
    method: 'GET',
    headers: {
      'apikey': process.env.API_KEY,
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

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

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function fetchCurrentPrice(ticker) {
  try {
    const marketSuffix = process.env.MARKET_SUFFIX || '';
    const fullTicker = `${ticker}${marketSuffix}`;
    const url = `${process.env.PRICE_API_URL}/${fullTicker}?interval=1d&range=1d`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      console.warn(`Price API failed for ${fullTicker}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const regularMarketPrice = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    return regularMarketPrice || null;
  } catch (error) {
    console.warn(`Error fetching price for ${ticker}:`, error.message);
    return null;
  }
}

async function fetchAllCurrentPrices(tickers) {
  const pricePromises = tickers.map(ticker =>
    fetchCurrentPrice(ticker).then(price => ({ ticker, price }))
  );

  const results = await Promise.all(pricePromises);

  return results.reduce((acc, { ticker, price }) => {
    acc[ticker] = price;
    return acc;
  }, {});
}

app.get('/', async (req, res) => {
  try {
    const purchases = await fetchPurchases();
    const totalSummary = await fetchTotalSummary();

    const groupedByDate = purchases.reduce((groups, purchase) => {
      const date = purchase.purchase_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(purchase);
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

    // Obtener precios actuales
    const tickers = tickerSummary.map(item => item.ticker);
    const currentPrices = await fetchAllCurrentPrices(tickers);

    // Añadir precios actuales al tickerSummary
    tickerSummary.forEach(item => {
      item.currentPrice = currentPrices[item.ticker] || null;
    });

    const groupedByType = purchases.reduce((groups, purchase) => {
      const type = purchase.type || 'Sin tipo';
      if (!groups[type]) {
        groups[type] = {
          type: type,
          totalCost: 0,
          count: 0
        };
      }
      groups[type].totalCost += purchase.purchase_price * purchase.purchase_amount;
      groups[type].count++;
      return groups;
    }, {});

    const typeSummary = Object.values(groupedByType).sort((a, b) => a.type.localeCompare(b.type));

    const html = renderPage({
      tickerSummary,
      typeSummary,
      sortedDates,
      groupedByDate,
      purchases
    });

    res.send(html);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).send('<h1>Error al cargar las compras</h1><p>' + error.message + '</p>');
  }
});

app.get('/api/purchases', async (req, res) => {
  try {
    const purchases = await fetchPurchases();
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Error al obtener las compras', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

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

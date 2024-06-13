#!/usr/bin/env babel-node

import express from 'express';
import { promisify } from 'util';
import { createClient } from 'redis';

const client = createClient();

client.on('err', (err) => {
  console.log('Redis client not connected to the server:', err.toString());
});

const listProducts = [
  {
    id: 1,
    name: 'Suitcase 250',
    price: 50,
    stock: 4,
  },
  {
    id: 2,
    name: 'Suitcase 450',
    price: 100,
    stock: 10,
  },
  {
    id: 3,
    name: 'Suitcase 650',
    price: 350,
    stock: 2,
  },
  {
    id: 4,
    name: 'Suitcase 1050',
    price: 550,
    stock: 5,
  },
];
const getItemById = (id) => listProducts.find((product) => product.id === id);
const reserveStockById = (itemId, stock) => {
  const setAsync = promisify(client.set).bind(client);
  return setAsync(`item.${itemId}`, stock);
};

const getCurrentReservedStockById = async (itemId) => {
  const getAsync = promisify(client.get).bind(client);
  const reservedStock = await getAsync(`item.${itemId}`);
  if (reservedStock === null) {
    return 0;
  }
  return reservedStock;
};

const app = express();
const port = 1245;

app.get('/list_products', (req, res) => {
  res.json(
    listProducts.map((product) => ({
      itemId: product.id,
      itemName: product.name,
      price: product.price,
      initialAvailableQuantity: product.stock,
    })),
  );
});

app.get('/list_products/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const product = getItemById(parseInt(itemId, 10));
  if (product) {
    const currentQuantity = await getCurrentReservedStockById(itemId);
    res.json({
      itemId: product.id,
      itemName: product.name,
      price: product.price,
      initialAvailableQuantity: product.stock,
      currentQuantity: (product.stock - currentQuantity) || 0,
    });
  } else {
    res.json({ status: 'Product not found' });
  }
});

app.get('/reserve_product/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const product = getItemById(parseInt(itemId, 10));
  if (product) {
    const currentQuantity = await getCurrentReservedStockById(itemId);
    if (currentQuantity < product.stock) {
      await reserveStockById(itemId, parseInt(currentQuantity, 10) + 1);
      res.json({ status: 'Reservation confirmed', itemId: product.id });
    } else {
      res.json({ status: 'Not enough stock available', itemId: product.id });
    }
  } else {
    res.json({ status: 'Product not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

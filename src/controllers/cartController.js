const cartService = require('../services/cartService');

async function getCart(req, res) {
  try {
    const userId = req.user.id;
    const { cart, items, total } = await cartService.getCart(userId);
    res.status(200).json({ cart, items, total });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function addItem(req, res) {
  try {
    const userId = req.user.id;
    const { productId, unitPrice, storeId, quantity = 1 } = req.body;
    const item = await cartService.addItem(userId, storeId, productId, quantity, unitPrice);
    res.status(201).json(item);
  } catch (err) {
    if (err.message === 'STORE_ID_REQUIRED') {
      return res.status(400).json({ error: 'storeId es requerido para crear un nuevo carrito' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateItem(req, res) {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;
    const result = await cartService.updateItem(userId, req.params.id, quantity);
    if (result === null) {
      return res.status(200).json({ message: 'Item eliminado del carrito' });
    }
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    if (err.message === 'ITEM_NOT_OWNED') {
      return res.status(403).json({ error: 'No tenés permiso para modificar este item' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function removeItem(req, res) {
  try {
    const userId = req.user.id;
    const item = await cartService.removeItem(userId, req.params.id);
    res.status(200).json(item);
  } catch (err) {
    if (err.message === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    if (err.message === 'ITEM_NOT_OWNED') {
      return res.status(403).json({ error: 'No tenés permiso para eliminar este item' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };

// DEV-20

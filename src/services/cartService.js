const cartRepo = require('../repositories/cartRepository');

async function getCart(userId) {
  const cart = await cartRepo.findActiveCartByUserId(userId);

  if (!cart) {
    return { cart: null, items: [], total: 0 };
  }

  const cartWithItems = await cartRepo.getCartWithItems(cart.id);
  const items = cartWithItems.cart_items ?? [];
  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return { cart: cartWithItems, items, total };
}

async function addItem(userId, storeId, productId, quantity, unitPrice) {
  let cart = await cartRepo.findActiveCartByUserId(userId);

  if (!cart) {
    if (!storeId) throw new Error('STORE_ID_REQUIRED');
    cart = await cartRepo.createCart(userId, storeId);
  }

  const item = await cartRepo.addItemToCart(cart.id, productId, quantity, unitPrice);
  return item;
}

async function updateItem(userId, itemId, quantity) {
  const item = await cartRepo.findItemById(itemId);
  if (!item) throw new Error('ITEM_NOT_FOUND');

  const cart = await cartRepo.findActiveCartByUserId(userId);
  if (!cart || item.cart_id !== cart.id) throw new Error('ITEM_NOT_OWNED');

  if (quantity <= 0) {
    await cartRepo.removeItem(itemId);
    return null;
  }

  return cartRepo.updateItemQuantity(itemId, quantity);
}

async function removeItem(userId, itemId) {
  const item = await cartRepo.findItemById(itemId);
  if (!item) throw new Error('ITEM_NOT_FOUND');

  const cart = await cartRepo.findActiveCartByUserId(userId);
  if (!cart || item.cart_id !== cart.id) throw new Error('ITEM_NOT_OWNED');

  return cartRepo.removeItem(itemId);
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};

// DEV-20

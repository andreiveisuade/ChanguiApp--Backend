export const validUser = {
  id: 'user-uuid-1',
  email: 'test@test.com',
  password: 'Password123!',
  full_name: 'Test User',
};

export const validProduct = {
  id: 'prod-uuid-1',
  barcode: '7790895000782',
  name: 'Coca Cola 500ml',
  brand: 'Coca Cola',
  price: 1500,
  image_url: null,
};

export const validCartItem = {
  id: 'cart-item-uuid-1',
  cart_id: 'cart-uuid-1',
  product_id: 'prod-uuid-1',
  quantity: 2,
  unit_price: 1500,
};

export const validCart = {
  id: 'cart-uuid-1',
  user_id: 'user-uuid-1',
  store_id: 'store-uuid-1',
  status: 'active',
};

export const validList = {
  id: 'list-uuid-1',
  user_id: 'user-uuid-1',
  name: 'Compras del sábado',
};

export const validListItem = {
  id: 'list-item-uuid-1',
  list_id: 'list-uuid-1',
  product_id: 'prod-uuid-1',
  quantity: 1,
  purchased: false,
};

export const validStore = {
  id: 'store-uuid-1',
  name: 'Carrefour Express',
  chain: 'Carrefour',
  address: 'Av. Corrientes 1234, CABA',
  lat: -34.6037,
  lng: -58.3816,
  precios_claros_id: '10-1-5',
};

export const validPurchase = {
  id: 'purchase-uuid-1',
  user_id: 'user-uuid-1',
  store_id: 'store-uuid-1',
  total: 3000,
  payment_id: 'MP-123456',
  payment_status: 'approved',
  created_at: '2026-04-09T12:00:00Z',
};

export const validPurchaseItem = {
  id: 'purchase-item-uuid-1',
  purchase_id: 'purchase-uuid-1',
  product_name: 'Coca Cola 500ml',
  barcode: '7790895000782',
  quantity: 2,
  unit_price: 1500,
};

export const validCheckoutPreference = {
  preference_id: 'pref-uuid-1',
  init_point:
    'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-uuid-1',
};

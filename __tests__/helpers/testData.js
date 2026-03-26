module.exports = {
  validUser: {
    id: 'user-uuid-1',
    email: 'test@test.com',
    password: 'Password123!',
  },

  validProduct: {
    id: 'prod-uuid-1',
    barcode: '7790895000782',
    name: 'Coca Cola 500ml',
    brand: 'Coca Cola',
    price: 1500,
  },

  validCartItem: {
    id: 'cart-item-uuid-1',
    cart_id: 'cart-uuid-1',
    product_id: 'prod-uuid-1',
    quantity: 2,
  },

  validCart: {
    id: 'cart-uuid-1',
    user_id: 'user-uuid-1',
    status: 'active',
  },

  validList: {
    id: 'list-uuid-1',
    user_id: 'user-uuid-1',
    name: 'Compras del sábado',
  },

  validListItem: {
    id: 'list-item-uuid-1',
    list_id: 'list-uuid-1',
    product_id: 'prod-uuid-1',
    quantity: 1,
    purchased: false,
  },
};

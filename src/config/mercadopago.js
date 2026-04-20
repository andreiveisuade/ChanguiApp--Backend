const mercadopago = require('mercadopago');

if (process.env.MP_ACCESS_TOKEN) {
  mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });
}

module.exports = mercadopago;

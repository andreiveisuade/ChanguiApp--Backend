import * as mercadopago from 'mercadopago';

if (process.env.MP_ACCESS_TOKEN) {
  mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });
}

export default mercadopago;

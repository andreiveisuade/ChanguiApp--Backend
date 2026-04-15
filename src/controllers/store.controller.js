'use strict';

const storeService = require('../services/store.service');

async function list(req, res) {
  try {
    const { lat, lng } = req.query;
    const hasLat = lat !== undefined;
    const hasLng = lng !== undefined;

    if (hasLat !== hasLng) {
      return res.status(400).json({ error: 'Debés enviar lat y lng juntos, o ninguno.' });
    }

    if (hasLat && hasLng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      if (isNaN(latNum) || isNaN(lngNum)) {
        return res.status(400).json({ error: 'lat y lng deben ser números válidos.' });
      }

      const stores = await storeService.list(latNum, lngNum);
      return res.json(stores);
    }

    const stores = await storeService.list();
    return res.json(stores);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { list };

'use strict';

const supabase = require('../config/supabase');

async function findAll() {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, chain, address, lat, lng');

  if (error) throw error;
  return data;
}

module.exports = { findAll };

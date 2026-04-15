const supabase = require('../config/supabase');

async function findByBarcode(barcode) {
  const { data, error } = await supabase
    .from('products')
    .select('id, barcode, name, brand, price, image_url')
    .eq('barcode', barcode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

module.exports = { findByBarcode };

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('products').select('category');
  if (error) {
    console.error(error);
    return;
  }
  const cats = [...new Set(data.map(d => d.category))];
  console.log('Categories found:', cats);
}
check();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkImages() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image')
    .in('name', ['Fluminense 2012 - Retrô (Titular)', 'Barcelona 15/16 - Retrô (Titular)', 'Brasil 26/27 - Titular Versão Jogador']);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log('--- Product Image Diagnostic ---');
  data.forEach(p => {
    console.log(`Product: ${p.name}`);
    console.log(`Image URL: ${p.image}`);
    console.log('----------------------------');
  });
}

checkImages();

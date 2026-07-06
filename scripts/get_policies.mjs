import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying view_policies...');
  const { data, error } = await supabase
    .from('view_policies')
    .select('*');

  if (error) {
    console.error('Error fetching policies:', error);
  } else {
    console.log('Active policies on orders table:');
    console.log(JSON.stringify(data, null, 2));
  }
}

main();

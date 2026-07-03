import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL_REBRAND || process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY_REBRAND || process.env.VITE_SUPABASE_ANON_KEY
);

const OLD_PRICE = 97.90;
const NEW_PRICE = 137.80;

async function main() {
  // 1. Fetch all NHL/Hockey products currently priced at 97.90
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, category, price')
    .in('category', ['NHL', 'Hockey'])
    .eq('price', OLD_PRICE);

  if (fetchErr) {
    console.error('❌ Error fetching products:', fetchErr.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('⚠️  No NHL/Hockey products found at $97.90. Listing all Hockey products for inspection...');

    const { data: allHockey } = await supabase
      .from('products')
      .select('id, name, category, price')
      .in('category', ['NHL', 'Hockey'])
      .order('price');

    if (allHockey?.length) {
      console.table(allHockey.map(p => ({ id: p.id.slice(0,8), name: p.name.slice(0,40), category: p.category, price: p.price })));
    } else {
      console.log('No Hockey products found in database at all.');
    }
    return;
  }

  console.log(`\n✅ Found ${products.length} NHL/Hockey product(s) at $${OLD_PRICE}:\n`);
  products.forEach(p => console.log(`  • [${p.category}] ${p.name} — $${p.price}`));

  // 2. Update all of them to 137.80
  const { error: updateErr, count } = await supabase
    .from('products')
    .update({ price: NEW_PRICE })
    .in('category', ['NHL', 'Hockey'])
    .eq('price', OLD_PRICE);

  if (updateErr) {
    console.error('\n❌ Error updating prices:', updateErr.message);
    process.exit(1);
  }

  console.log(`\n🎉 Done! Updated ${products.length} products from $${OLD_PRICE} → $${NEW_PRICE}`);
}

main();

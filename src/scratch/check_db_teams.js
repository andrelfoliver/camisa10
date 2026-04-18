
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeams() {
    console.log('--- Teams in "teams" table ---');
    const { data: teams } = await supabase.from('teams').select('name, logo');
    teams?.forEach(t => console.log(`- ${t.name} (Logo: ${t.logo?.substring(0, 30)}...)`));

    console.log('\n--- Teams used in "products" table ---');
    const { data: products } = await supabase.from('products').select('team');
    const uniqueProductTeams = [...new Set(products?.map(p => p.team).filter(Boolean))];
    uniqueProductTeams.sort().forEach(t => console.log(`- ${t}`));
}

checkTeams();

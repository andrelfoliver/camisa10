import { supabase } from './src/services/supabase.js';
async function test() {
  const { data, error } = await supabase.from('teams').select('*');
  console.log(data);
}
test();

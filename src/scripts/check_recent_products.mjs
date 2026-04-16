import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://agbskncncrnzmutaubdn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ4OTksImV4cCI6MjA5MTU0MDg5OX0.Y-p426eqLyl-rumc-ZI56u2WJFk0oDvXkvp5G6m1iFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false }).limit(10);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

checkProducts();

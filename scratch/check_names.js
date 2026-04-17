// scratch/check_names.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('testimonials')
    .select('name, location, status')
    .order('name');

  if (error) {
    console.error("❌ Error fetching testimonials:", error);
    return;
  }

  console.log("✅ Current Testimonials in DB:");
  console.table(data);
}

check();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const BUCKET = 'product-imagens'; // Using existing bucket for stability

const files = [
  { name: 'hero-arrascaeta.png', path: '/Users/andreoliveira/.gemini/antigravity/brain/814b4b53-78cb-4483-a1fe-568ef46fbafe/media__1776548842763.png' },
  { name: 'hero-mbappe.png', path: '/Users/andreoliveira/.gemini/antigravity/brain/814b4b53-78cb-4483-a1fe-568ef46fbafe/media__1776548842797.png' },
  { name: 'hero-paqueta.png', path: '/Users/andreoliveira/.gemini/antigravity/brain/814b4b53-78cb-4483-a1fe-568ef46fbafe/media__1776548842873.png' },
  { name: 'hero-vinijr.png', path: '/Users/andreoliveira/.gemini/antigravity/brain/814b4b53-78cb-4483-a1fe-568ef46fbafe/media__1776548842913.png' },
  { name: 'hero-cr7.png', path: '/Users/andreoliveira/.gemini/antigravity/brain/814b4b53-78cb-4483-a1fe-568ef46fbafe/media__1776548842945.png' }
];

async function upload() {
  for (const file of files) {
    const fileBuffer = fs.readFileSync(file.path);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(`branding/${file.name}`, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) console.error(`Error uploading ${file.name}:`, error.message);
    else console.log(`Successfully uploaded ${file.name}`);
  }
}

upload();

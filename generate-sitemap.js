import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase variables in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateSitemap() {
  console.log("Gerando sitemap.xml...");
  
  // Páginas Estáticas Fixas
  const baseUrl = "https://ifooty.ca";
  const staticPages = [
    "/",
    "/colecao/brasileirao",
    "/colecao/selecoes",
    "/colecao/internacionais",
    "/colecao/retro",
    "/colecao/lancamentos"
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Adicionar páginas estáticas
  staticPages.forEach(path => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${path}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${path === '/' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Puxar produtos do Supabase
  const { data: products, error } = await supabase.from('products').select('id');
  
  if (error) {
    console.error("Erro ao puxar produtos do Supabase:", error);
    process.exit(1);
  }

  if (products) {
    products.forEach(product => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/produto/${product.id}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });
  }

  xml += `</urlset>`;

  fs.writeFileSync('public/sitemap.xml', xml);
  console.log("sitemap.xml gerado com sucesso na pasta public!");
}

generateSitemap();

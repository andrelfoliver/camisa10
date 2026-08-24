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
  
  // Páginas Estáticas Fixas e Coleções Ativas
  const baseUrl = "https://ifooty.ca";
  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/colecao/soccer", priority: "0.9", changefreq: "daily" },
    { path: "/colecao/basketball", priority: "0.8", changefreq: "weekly" },
    { path: "/colecao/football", priority: "0.8", changefreq: "weekly" },
    { path: "/colecao/baseball", priority: "0.8", changefreq: "weekly" },
    { path: "/colecao/hockey", priority: "0.8", changefreq: "weekly" },
    { path: "/colecao/new-arrivals", priority: "0.9", changefreq: "daily" },
    { path: "/colecao/best-sellers", priority: "0.9", changefreq: "daily" },
    { path: "/colecao/sale", priority: "0.9", changefreq: "daily" },
    { path: "/about", priority: "0.6", changefreq: "monthly" },
    { path: "/affiliates", priority: "0.5", changefreq: "monthly" }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Adicionar páginas estáticas
  staticPages.forEach(item => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${item.path}</loc>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
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
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });
  }

  xml += `</urlset>`;

  fs.writeFileSync('public/sitemap.xml', xml);
  console.log("sitemap.xml gerado com sucesso na pasta public!");
}

generateSitemap();

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

const SUPABASE_URL = 'https://agbskncncrnzmutaubdn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk2NDg5OSwiZXhwIjoyMDkxNTQwODk5fQ.KhzhUyD53jfZmTwMDlcBG5r8q3KJFsGg4b-KGrKbiDI';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const IMG_DIR = path.join(process.cwd(), 'public', 'catalog');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

let browser;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    console.log('\n🔄 (Re)iniciando browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    // Warmup session
    const warmup = await browser.newPage();
    await warmup.goto('https://hsquan996.x.yupoo.com/albums', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    await warmup.close().catch(() => {});
    console.log('✅ Sessão pronta!\n');
  }
  return browser;
}

async function downloadWithPuppeteer(albumUrl, productId) {
  const b = await getBrowser();
  let page;
  try {
    page = await b.newPage();
  } catch {
    browser = null;
    const b2 = await getBrowser();
    page = await b2.newPage();
  }

  const capturedBuffers = [];

  page.on('response', async (response) => {
    const url = response.url();
    const ct = response.headers()['content-type'] || '';
    if ((ct.includes('image/jpeg') || ct.includes('image/png') || ct.includes('image/webp'))
        && url.includes('photo.yupoo.com')) {
      try {
        const buf = await response.buffer();
        if (buf.length > 10000) capturedBuffers.push({ url, buf });
      } catch {}
    }
  });

  try {
    await page.goto(albumUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    if (capturedBuffers.length > 0) {
      const { url, buf } = capturedBuffers[0];
      const ext = url.endsWith('.png') ? 'png' : 'jpg';
      const filename = `shirt_${productId}.${ext}`;
      fs.writeFileSync(path.join(IMG_DIR, filename), buf);
      await page.close().catch(() => {});
      return `/catalog/${filename}`;
    }
  } catch (err) {
    // If browser crashed, mark it null so it gets recreated
    if (err.message.includes('Connection closed') || err.message.includes('Target closed')) {
      browser = null;
    }
  }

  await page.close().catch(() => {});
  return null;
}

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .like('image', '%yupoo.com%')
    .order('id', { ascending: true });

  if (error) { console.error(error); return; }
  console.log(`📦 ${products.length} produtos ainda com URL do Yupoo para baixar.`);

  await getBrowser();

  let success = 0;
  let fail = 0;
  let i = 0;

  for (const product of products) {
    i++;
    if (!product.original_url) { fail++; continue; }

    process.stdout.write(`[${i}/${products.length}] ID ${product.id} | ${product.name.substring(0, 28)}... `);

    const localPath = await downloadWithPuppeteer(product.original_url, product.id);

    if (localPath) {
      await supabase.from('products').update({ image: localPath }).eq('id', product.id);
      process.stdout.write(`✅\n`);
      success++;
    } else {
      process.stdout.write(`❌\n`);
      fail++;
    }

    await new Promise(r => setTimeout(r, 400));
  }

  if (browser) await browser.close().catch(() => {});
  console.log(`\n🎉 Concluído! ✅ ${success} ok | ❌ ${fail} falhou`);
}

main();

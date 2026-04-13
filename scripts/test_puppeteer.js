import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const url = 'https://photo.yupoo.com/hsquan996/d32ee6b4/small.jpeg';

async function test() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  console.log("Passing cloudflare on yupoo...");
  await page.goto('https://yupoo.com/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  console.log("Navigating to image...");
  const viewSource = await page.goto(url);
  const buffer = await viewSource.buffer();
  fs.writeFileSync('test_image.jpg', buffer);
  
  console.log("Image saved! Size:", buffer.length);
  await browser.close();
}

test();

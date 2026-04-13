import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE_URL = 'https://hsquan996.x.yupoo.com/albums';

async function scrapeYupoo() {
  try {
    let currentPage = 1;
    let keepScraping = true;
    const allAlbums = [];

    while (keepScraping) {
      console.log(`Buscando dados da página ${currentPage}...`);
      const { data } = await axios.get(`${BASE_URL}?page=${currentPage}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://yupoo.com/'
        }
      });

      const $ = cheerio.load(data);
      const items = $('.showindex__children');
      
      if (items.length === 0) {
        keepScraping = false;
        break;
      }

      let albunsFoundInPage = 0;

      items.each((i, el) => {
        let title = $(el).find('.album3__title').text().trim();
        if(!title) return;
        
        let cleanedTitle = title.replace(/[^\w\s\-\/\:]/gi, '').trim(); 
        const href = $(el).find('a.album3__main').attr('href');
        const url = href ? `https://hsquan996.x.yupoo.com${href}` : null;
        
        let img = $(el).find('.album__imgwrap img').attr('data-origin-src') || $(el).find('.album__imgwrap img').attr('src');
        if (img && img.startsWith('//')) {
          img = 'https:' + img;
        }

        let category = "Catálogo";
        const upperTitle = cleanedTitle.toUpperCase();
        if (upperTitle.includes('BRASIL') || upperTitle.includes('ARGENTINA') || upperTitle.includes('FRANCA')) category = "Seleções";
        else if (upperTitle.includes('FLAMENGO') || upperTitle.includes('PALMEIRAS')) category = "Clubes Nacionais";
        else if (upperTitle.includes('RETRO')) category = "Retrô";
        else if (upperTitle.includes('PSG') || upperTitle.includes('MADRID')) category = "Internacionais";

        allAlbums.push({ name: cleanedTitle, category, image: img, original_url: url });
        albunsFoundInPage++;
      });
      
      console.log(`Página ${currentPage}: ${albunsFoundInPage} camisas achadas.`);
      currentPage++;
      // Wait to avoid anti-bot limits
      await new Promise(r => setTimeout(r, 1000));
      // Segurança: Parar depois da página 20
      if(currentPage > 20) keepScraping = false;
    }

    console.log(`Sucesso! Achamos um total absoluto de ${allAlbums.length} camisas.`);
    fs.writeFileSync('yupoo_data.json', JSON.stringify(allAlbums, null, 2));
    
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

scrapeYupoo();

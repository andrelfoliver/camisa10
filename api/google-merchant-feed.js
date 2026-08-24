import { createClient } from '@supabase/supabase-js';

let supabase = null;
function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  }
  return supabase;
}

const GOOGLE_PRODUCT_CATEGORIES = {
  soccer: 'Sporting Goods > Team Sports > Soccer > Soccer Equipment > Soccer Jerseys',
  hockey: 'Sporting Goods > Team Sports > Ice Hockey',
  nhl: 'Sporting Goods > Team Sports > Ice Hockey',
  basketball: 'Sporting Goods > Team Sports > Basketball',
  nba: 'Sporting Goods > Team Sports > Basketball',
  football: 'Sporting Goods > Team Sports > American Football',
  nfl: 'Sporting Goods > Team Sports > American Football',
  baseball: 'Sporting Goods > Team Sports > Baseball & Softball',
  mlb: 'Sporting Goods > Team Sports > Baseball & Softball',
  streetwear: 'Apparel & Accessories > Clothing',
  tenis: 'Apparel & Accessories > Shoes > Athletic Shoes'
};

const DEFAULT_GOOGLE_CATEGORY = 'Apparel & Accessories > Clothing > Activewear';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getGoogleCategory(product) {
  const cat = (product.category || '').toLowerCase();
  const league = (product.league || '').toLowerCase();

  if (cat.includes('hockey') || cat.includes('nhl') || league.includes('nhl')) {
    return GOOGLE_PRODUCT_CATEGORIES.hockey;
  }
  if (cat.includes('basketball') || cat.includes('nba') || league.includes('nba')) {
    return GOOGLE_PRODUCT_CATEGORIES.basketball;
  }
  if (cat.includes('football') || cat.includes('nfl') || league.includes('nfl')) {
    return GOOGLE_PRODUCT_CATEGORIES.football;
  }
  if (cat.includes('baseball') || cat.includes('mlb') || league.includes('mlb')) {
    return GOOGLE_PRODUCT_CATEGORIES.baseball;
  }
  if (cat === 'streetwear') {
    return GOOGLE_PRODUCT_CATEGORIES.streetwear;
  }
  if (cat === 'tênis' || cat === 'tenis') {
    return GOOGLE_PRODUCT_CATEGORIES.tenis;
  }
  if (cat.includes('soccer') || cat.includes('brasileir') || cat.includes('seleç') || cat.includes('selec') || cat.includes('inter') || cat.includes('retr') || league) {
    return GOOGLE_PRODUCT_CATEGORIES.soccer;
  }
  return DEFAULT_GOOGLE_CATEGORY;
}

function calculateAvailability(inventory) {
  if (!inventory || typeof inventory !== 'object') {
    return 'in_stock';
  }
  const totalStock = Object.values(inventory).reduce((acc, qty) => {
    const val = parseInt(qty, 10);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return totalStock > 0 ? 'in_stock' : 'out_of_stock';
}

export default async function handler(req, res) {
  try {
    const baseUrl = 'https://ifooty.ca';
    const client = getSupabase();

    if (!client) {
      return res.status(500).send('Supabase configuration missing');
    }

    const { data: products, error } = await client
      .from('products')
      .select('id, name, description, price, image, gallery, category, league, team, inventory')
      .order('id', { ascending: false });

    if (error) {
      console.error('Merchant feed query error:', error);
      return res.status(500).send('Error generating Google Merchant feed');
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>iFooty Canada - Sports Jerseys Catalog</title>\n`;
    xml += `    <link>${baseUrl}</link>\n`;
    xml += `    <description>Official and replica sports jerseys in Canada. Fast shipping across Canada &amp; USA.</description>\n`;

    if (products && products.length > 0) {
      products.forEach(p => {
        const id = p.id;
        const title = escapeXml(p.name);
        const description = escapeXml(p.description || `${p.name} - ${p.category || 'Sports Jersey'} available in Canada at iFooty.`);
        const link = `${baseUrl}/produto/${id}`;
        
        let imageUrl = p.image || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        // Encode special characters in image URLs (spaces, parentheses, @, etc.)
        try {
          const imgUrlObj = new URL(imageUrl || `${baseUrl}/og-image-full.png`);
          imageUrl = imgUrlObj.toString();
        } catch (e) {
          // Fallback: manual encode for paths with special chars
          imageUrl = imageUrl ? encodeURI(imageUrl) : `${baseUrl}/og-image-full.png`;
        }
        imageUrl = escapeXml(imageUrl);

        const price = typeof p.price === 'number' ? p.price : parseFloat(p.price || 89.90);
        const availability = calculateAvailability(p.inventory);
        const googleCategory = escapeXml(getGoogleCategory(p));
        const productType = escapeXml(p.category || p.league || 'Jerseys');

        xml += `    <item>\n`;
        xml += `      <g:id>IFOOTY-${id}</g:id>\n`;
        xml += `      <g:title>${title}</g:title>\n`;
        xml += `      <g:description>${description}</g:description>\n`;
        xml += `      <g:link>${link}</g:link>\n`;
        xml += `      <g:image_link>${imageUrl}</g:image_link>\n`;
        xml += `      <g:condition>new</g:condition>\n`;
        xml += `      <g:availability>${availability}</g:availability>\n`;
        xml += `      <g:price>${price.toFixed(2)} CAD</g:price>\n`;
        xml += `      <g:identifier_exists>no</g:identifier_exists>\n`;
        xml += `      <g:product_type>${productType}</g:product_type>\n`;
        xml += `      <g:google_product_category>${googleCategory}</g:google_product_category>\n`;
        xml += `    </item>\n`;
      });
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).send(xml);

  } catch (err) {
    console.error('Merchant feed handler error:', err);
    return res.status(500).send('Internal Server Error');
  }
}

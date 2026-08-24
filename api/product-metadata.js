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

// Rebrand canonical route mapping: DB category → URL slug
const CATEGORY_TO_ROUTE = {
  'Brasileirão':    'soccer',
  'Seleções':       'soccer',
  'Internacionais': 'soccer',
  'Lançamentos':    'soccer',
  'NBA':            'basketball',
  'Basketball':     'basketball',
  'Hockey':         'hockey',
  'NHL':            'hockey',
  'Football':       'football',
  'NFL':            'football',
  'Baseball':       'baseball',
  'MLB':            'baseball',
  'Streetwear':     'soccer',
  'Tênis':          'soccer',
};

// Rebrand display name for breadcrumbs
const CATEGORY_DISPLAY_NAME = {
  'soccer': 'Soccer',
  'basketball': 'Basketball',
  'hockey': 'Hockey',
  'football': 'Football',
  'baseball': 'Baseball',
};

function getCategoryRoute(dbCategory) {
  return CATEGORY_TO_ROUTE[dbCategory] || 'soccer';
}

function getCategoryDisplayName(dbCategory) {
  const route = getCategoryRoute(dbCategory);
  return CATEGORY_DISPLAY_NAME[route] || dbCategory || 'Jerseys';
}

function isSearchCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return ua.includes('googlebot') || ua.includes('bingbot');
}

export default async function handler(req, res) {
  const { id } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  // Detect domain automatically to avoid mismatch issues
  const host = req.headers.host || 'ifooty.ca';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;
  const defaultImage = `${baseUrl}/og-image-full.png`;

  let product = null;

  try {
    if (!id) throw new Error('No ID provided');

    if (id.startsWith('q')) {
      const p = {
        q1: { name: 'Brasil Titular 25/26 (Torcedor)', image: '/catalog/shirt_188.jpg', category: 'Seleção Brasileira', price: 89.90 },
        q2: { name: 'Brasil Titular 25/26 (Jogador)', image: '/catalog/shirt_183.jpg', category: 'Seleção Brasileira', price: 119.90 },
        q3: { name: 'Brasil Reserva 25/26', image: '/catalog/shirt_165.jpg', category: 'Seleção Brasileira', price: 89.90 },
        q4: { name: 'Brasil Feminina Titular/Reserva', image: '/catalog/shirt_344.jpg', category: 'Feminina', price: 89.90 }
      }[id];
      product = p;
    } else if (id.startsWith('geral_')) {
      const idx = parseInt(id.replace('geral_', ''));
      product = {
        name: `Camisa Torcedor/Geral #${idx}`,
        image: `/camisas/@carinhacriativo (${idx}).png`,
        category: 'Catálogo',
        price: 89.90
      };
    } else {
      // Clean ID for numeric search
      const numericId = parseInt(id);
      const client = getSupabase();
      if (client) {
        const { data, error } = await client
          .from('products')
          .select('id, name, image, gallery, category, description, price, inventory')
          .eq('id', isNaN(numericId) ? id : numericId)
          .single();
        
        if (!error && data) {
          product = data;
        }
      }
    }

    // FALLBACK: If product not found, serve site default meta
    if (!product) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="iFooty | Premium Sports Jerseys">
            <meta property="og:description" content="Your premium sports jersey store in Canada. NHL, NFL, NBA, soccer, and retro jerseys.">
            <meta property="og:image" content="${defaultImage}">
            <meta property="og:url" content="${baseUrl}/produto/${id}">
            <meta http-equiv="refresh" content="0;url=${baseUrl}/produto/${id}">
          </head>
          <body>Redirecting...</body>
        </html>
      `);
    }

    const title = `${product.name} | iFooty Canada`.replace(/"/g, '&quot;');
    const description = `${product.description || (product.category ? `${product.name} - ${product.category} collection available at iFooty Canada.` : `${product.name} available at iFooty Canada.`)}`.replace(/"/g, '&quot;');
    let imageUrl = product.image;
    let isVideo = imageUrl && imageUrl.toLowerCase().endsWith('.mp4');

    // Se a imagem principal for um vídeo, busca a primeira imagem estática na galeria do produto
    if (isVideo && product.gallery && Array.isArray(product.gallery)) {
      const firstStaticImage = product.gallery.find(img => img && !img.toLowerCase().endsWith('.mp4'));
      if (firstStaticImage) {
        imageUrl = firstStaticImage;
        isVideo = false;
      }
    }
    
    // Ensure absolute image URL
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    // FINAL IMAGE FALLBACK
    let previewImage = (isVideo || !imageUrl) ? defaultImage : imageUrl;
    
    // URL Encoding for WhatsApp (CRITICAL: WhatsApp fails on spaces or special chars)
    try {
      const urlObj = new URL(previewImage);
      previewImage = urlObj.toString();
    } catch (e) {
      // fallback if URL is weird
    }
    
    const imageType = previewImage.toLowerCase().endsWith('.png') ? 'image/png' : 
                      previewImage.toLowerCase().endsWith('.webp') ? 'image/webp' : 
                      'image/jpeg';

    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || 89.90);
    const totalStock = product.inventory && typeof product.inventory === 'object'
      ? Object.values(product.inventory).reduce((acc, qty) => acc + (parseInt(qty) || 0), 0)
      : null;
    const isAvailable = totalStock === null ? true : totalStock > 0;
    const canonicalUrl = `${baseUrl}/produto/${id}`;

    const productJsonLd = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [previewImage],
      "description": product.description || description,
      "sku": `IFOOTY-${id}`,
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "priceCurrency": "CAD",
        "price": price.toFixed(2),
        "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org/",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": getCategoryDisplayName(product.category),
          "item": `${baseUrl}/colecao/${getCategoryRoute(product.category)}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": canonicalUrl
        }
      ]
    };

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    // Diagnostic comment to check if product was found
    const debugInfo = `<!-- ID: ${id} | Found: ${!!product} | Image: ${!!imageUrl} -->`;

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          ${debugInfo}
          <title>${title}</title>
          <meta name="description" content="${description}">
          <link rel="canonical" href="${canonicalUrl}">

          <!-- Schema.org for Google / Social -->
          <meta itemprop="name" content="${title}">
          <meta itemprop="description" content="${description}">
          <meta itemprop="image" content="${previewImage}">

          <!-- Open Graph / Facebook / WhatsApp -->
          <meta property="og:type" content="product">
          <meta property="og:url" content="${canonicalUrl}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${previewImage}">
          <meta property="og:image:secure_url" content="${previewImage}">
          <meta property="og:image:type" content="${imageType}">
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">
          <meta property="og:site_name" content="iFooty">
          
          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:url" content="${canonicalUrl}">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${previewImage}">

          <!-- JSON-LD Structured Data -->
          <script type="application/ld+json">
            ${JSON.stringify(productJsonLd)}
          </script>
          <script type="application/ld+json">
            ${JSON.stringify(breadcrumbJsonLd)}
          </script>

          <!-- Legacy / Fallback -->
          <link rel="image_src" href="${previewImage}">

          ${isSearchCrawler(userAgent) ? '' : `<meta http-equiv="refresh" content="0;url=${canonicalUrl}">`}
        </head>
        <body>
          <h1>${title}</h1>
          <p>${description}</p>
          <p>Price: $${price.toFixed(2)} CAD</p>
          <img src="${previewImage}" alt="${title}" style="width: 300px;">
          ${isSearchCrawler(userAgent) ? '' : `<script>window.location.href = "${canonicalUrl}";</script>`}
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Metadata error:', err);
    return res.status(500).send('Internal Server Error');
  }
}

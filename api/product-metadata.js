import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;
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
        q1: { name: 'Brasil Titular 25/26 (Torcedor)', image: '/catalog/shirt_188.jpg', category: 'Seleção Brasileira' },
        q2: { name: 'Brasil Titular 25/26 (Jogador)', image: '/catalog/shirt_183.jpg', category: 'Seleção Brasileira' },
        q3: { name: 'Brasil Reserva 25/26', image: '/catalog/shirt_165.jpg', category: 'Seleção Brasileira' },
        q4: { name: 'Brasil Feminina Titular/Reserva', image: '/catalog/shirt_344.jpg', category: 'Feminina' }
      }[id];
      product = p;
    } else if (id.startsWith('geral_')) {
      const idx = parseInt(id.replace('geral_', ''));
      product = {
        name: `Camisa Torcedor/Geral #${idx}`,
        image: `/camisas/@carinhacriativo (${idx}).png`,
        category: 'Catálogo'
      };
    } else {
      // Clean ID for numeric search
      const numericId = parseInt(id);
      const { data, error } = await supabase
        .from('products')
        .select('name, image, category, description')
        .eq('id', isNaN(numericId) ? id : numericId)
        .single();
      
      if (!error && data) {
        product = data;
      }
    }

    // FALLBACK: If product not found, serve site default meta
    if (!product) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="iFooty | Especialistas em Camisas de Futebol">
            <meta property="og:description" content="A sua loja de camisas de futebol brasileiras, europeias e retrô no Canadá.">
            <meta property="og:image" content="${defaultImage}">
            <meta property="og:url" content="${baseUrl}/produto/${id}">
            <meta http-equiv="refresh" content="0;url=${baseUrl}/produto/${id}">
          </head>
          <body>Redirecting...</body>
        </html>
      `);
    }

    const title = `${product.name} | iFooty`.replace(/"/g, '&quot;');
    const description = `${product.category || 'Catálogo'} - ${product.description || 'Qualidade premium e envio rápido para todo o Canadá.'}`.replace(/"/g, '&quot;');
    let imageUrl = product.image;

    // Check for video
    const isVideo = imageUrl && imageUrl.toLowerCase().endsWith('.mp4');
    
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

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    // Diagnostic comment to check if product was found
    const debugInfo = `<!-- ID: ${id} | Found: ${!!product} | Image: ${!!imageUrl} -->`;

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          ${debugInfo}
          <!-- Priority Meta Tags for Scrapers -->
          <meta property="og:title" content="${title}">
          <meta property="og:image" content="${previewImage}">
          <meta property="og:image:secure_url" content="${previewImage}">
          <meta property="og:image:type" content="${imageType}">
          <meta property="og:image:width" content="1200">
          <meta property="og:image:height" content="630">
          
          <meta property="og:type" content="website">
          <meta property="og:url" content="${baseUrl}/produto/${id}">
          <meta property="og:description" content="${description}">

          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:image" content="${previewImage}">
          <meta property="twitter:title" content="${title}">
          <meta property="twitter:description" content="${description}">

          <title>${title}</title>
          <meta http-equiv="refresh" content="0;url=${baseUrl}/produto/${id}">
        </head>
        <body>
          <script>window.location.href = "${baseUrl}/produto/${id}";</script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Metadata error:', err);
    return res.status(500).send('Internal Server Error');
  }
}

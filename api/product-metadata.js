import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;
  const baseUrl = 'https://www.ifooty.ca';

  let product = null;

  try {
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
      const { data, error } = await supabase
        .from('products')
        .select('name, image, category, description')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        product = data;
      }
    }

    if (!product) {
      // Fallback to default metadata
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="iFooty | Especialistas em Camisas de Futebol">
            <meta property="og:description" content="A sua loja de camisas de futebol brasileiras, europeias e retrô no Canadá.">
            <meta property="og:image" content="${baseUrl}/og-image-full.png">
            <meta property="og:url" content="${baseUrl}/produto/${id}">
            <meta http-equiv="refresh" content="0;url=${baseUrl}/produto/${id}">
          </head>
          <body>
            Redirecting to product page...
          </body>
        </html>
      `);
    }

    const title = `${product.name} | iFooty`;
    const description = `${product.category || 'Catálogo'} - ${product.description || 'Qualidade premium e envio rápido para todo o Canadá.'}`;
    let imageUrl = product.image;

    // Ensure absolute image URL
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    // Return minimal HTML with meta tags
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <meta name="description" content="${description}">
          
          <!-- Open Graph / Facebook / WhatsApp -->
          <meta property="og:type" content="website">
          <meta property="og:url" content="${baseUrl}/produto/${id}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${imageUrl}">

          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="${baseUrl}/produto/${id}">
          <meta property="twitter:title" content="${title}">
          <meta property="twitter:description" content="${description}">
          <meta property="twitter:image" content="${imageUrl}">

          <!-- Redirect for non-bots (optional, but vercel.json handles this better) -->
          <meta http-equiv="refresh" content="0;url=${baseUrl}/produto/${id}">
        </head>
        <body>
          <h1>${product.name}</h1>
          <p>${description}</p>
          <img src="${imageUrl}" alt="${product.name}">
          <script>window.location.href = "${baseUrl}/produto/${id}";</script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Metadata error:', err);
    return res.status(500).send('Internal Server Error');
  }
}

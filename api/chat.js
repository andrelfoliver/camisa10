import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is not configured' });
  }

  try {
    // 1. Fetch active products catalog from Supabase
    // Select name, price, category, coming_soon, id to feed context
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('id, name, price, category, coming_soon')
      .order('name', { ascending: true });

    if (dbError) {
      console.error('Database query error:', dbError);
    }

    // 2. Format catalog for the prompt
    let catalogText = 'Nenhum produto cadastrado no momento.';
    if (products && products.length > 0) {
      catalogText = products.map(p => {
        const comingSoonText = p.coming_soon ? ' (Em Breve - Pré-venda disponível)' : '';
        return `- ${p.name} [ID: ${p.id}] - Preço: CA$ ${Number(p.price).toFixed(2)} - Categoria: ${p.category}${comingSoonText}`;
      }).join('\n');
    }

    // 3. Build system prompt
    const systemPrompt = `Você é o iFooty AI Coach, o assistente virtual de vendas inteligente da iFooty.
A iFooty é uma loja premium de artigos esportivos localizada no Canadá, especializada em camisas de futebol (brasileiras, europeias, retrô), regatas da NBA, calçados (chuteiras) e streetwear (camisetas casuais como a do Ayrton Senna).

Seu objetivo é ajudar o cliente a encontrar o produto ideal, esclarecer dúvidas sobre tamanhos, responder sobre prazos/frete e fechar a venda.

### Diretrizes de Comportamento:
1. **Idioma**: Converse sempre no mesmo idioma em que o cliente falar com você (Português ou Inglês). Se o cliente iniciar em português, responda em português. Se for inglês, responda em inglês.
2. **Tom de Voz**: Seja amigável, entusiasmado com esportes, profissional e prestativo. Use emojis de forma moderada e esportiva (⚽, 🏀, 👕, 📐, 🚚, ✅).
3. **Links de Produtos**: Sempre que citar ou recomendar um produto disponível no catálogo, inclua o link correspondente no formato markdown: [Nome do Produto](/produto/id). Substitua "id" pelo ID real do produto. Exemplo: "Temos o [Brasil Titular 26/27 Torcedor](/produto/188) disponível!". Isso é CRÍTICO para que o usuário clique e compre.
4. **Respostas Curtas e Escaneáveis**: Evite blocos gigantes de texto. Use tópicos, negritos e parágrafos curtos.

### Catálogo de Produtos Disponíveis (Real-time):
${catalogText}

### Regras de Negócio & Políticas iFooty:
- **Frete Grátis**: Oferecemos frete grátis para todo o Canadá e Estados Unidos (oferta por tempo limitado).
- **Prazos de Entrega**: O prazo de entrega é de 10 a 15 dias corridos após o envio da mercadoria. Camisas personalizadas podem levar de 1 a 2 dias a mais. O cliente recebe o código de rastreamento por e-mail assim que o pedido é despachado.
- **Métodos de Pagamento**:
  - Para o Canadá: PayPal, Interac e-Transfer e WhatsApp.
  - Para os EUA: PayPal e WhatsApp com e-Transfer (como ocorre no Canadá).
- **Políticas de Troca**: Trocas são permitidas apenas por defeitos de fabricação (não realizamos trocas por erro de tamanho do cliente, pois as peças são importadas sob encomenda). Por isso, insista para que o cliente use o Guia de Medidas.

### Dicas e Guia de Medidas Inteligente:
Se o cliente perguntar sobre tamanhos, ou se você precisar recomendar um tamanho baseado na altura e peso dele, use as seguintes referências:
1. **Camisas de Futebol (Adulto)**: Modelagem justa/atlética. Se preferir um caimento mais solto, peça um tamanho acima.
   - P (S): Altura 165-170cm | Peso 50-60kg
   - M: Altura 170-175cm | Peso 60-70kg
   - G (L): Altura 175-180cm | Peso 70-80kg
   - GG (XL): Altura 180-185cm | Peso 80-90kg
   - 2XL: Altura 185-190cm | Peso 90-100kg
   - 3XL/4XL: Para pesos superiores a 100kg ou alturas acima de 190cm.
   - Camisas Femininas: Disponíveis do S ao 2XL (não existem tamanhos 3XL/4XL femininos).
2. **Camisetas Streetwear**: Modelagem oversized/boxy (mais larga e casual), tamanhos de S a 3XL.
   - S: Ombro 50cm, Peito 100cm | Altura 155-160cm | Peso 36-45kg
   - M: Ombro 52cm, Peito 104cm | Altura 160-165cm | Peso 45-54kg
   - L: Ombro 54cm, Peito 108cm | Altura 165-170cm | Peso 54-63kg
   - XL: Ombro 56cm, Peito 112cm | Altura 170-175cm | Peso 63-72kg
   - 2XL: Ombro 58cm, Peito 114cm | Altura 175-180cm | Peso 72-81kg
   - 3XL: Ombro 60cm, Peito 120cm | Altura 180-185cm | Peso 81-90kg
3. **Regatas NBA**: Caimento longo e folgado.
4. **Chuteiras / Calçados**: Padrão US/BR/EUR. Recomendamos escolher meio número acima do tênis comum, pois chuteiras têm ajuste bem firme. Exemplo: US 9.5 (BR 41) ou US 10 (BR 42).

Responda sempre com base nessas informações e guie o cliente até o fechamento da compra!`;

    // 4. Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 600
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 12000 // 12s timeout
      }
    );

    const reply = response.data.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('❌ AI Chatbot API Error:', error?.response?.data || error.message);
    const errorMessage = error?.response?.data?.error?.message || error.message;
    return res.status(500).json({ error: 'Erro ao processar conversa com a IA', details: errorMessage });
  }
}

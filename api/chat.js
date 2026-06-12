import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache for simple IP rate limiting
const ipCache = new Map();

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

  const { messages, sessionId, userName } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // 1. Rate Limiting based on IP (Max 8 requests per minute)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'global';
  const now = Date.now();

  // On-demand cleanup of cache
  for (const [key, val] of ipCache.entries()) {
    if (now - val.timestamp > 60000) {
      ipCache.delete(key);
    }
  }

  const clientData = ipCache.get(ip) || { count: 0, timestamp: now };
  if (now - clientData.timestamp > 60000) {
    clientData.count = 1;
    clientData.timestamp = now;
  } else {
    clientData.count += 1;
  }
  ipCache.set(ip, clientData);

  if (clientData.count > 8) {
    return res.status(429).json({ error: 'Muitas requisições. Por favor, tente novamente em um minuto.' });
  }

  // 2. Cap conversation history to avoid payload/token bloat (keep last 10 messages)
  const history = messages.slice(-10);

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

    let nameInstruction = '';
    if (userName && userName.trim()) {
      nameInstruction = `\nO nome do cliente com quem você está conversando é "${userName.trim()}". Trate-o por este nome de forma amigável e natural durante a conversa.`;
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
Se o cliente perguntar sobre tamanhos ou fornecer peso e altura, siga rigorosamente estas regras:
1. **Apenas Referência Inicial**: Deixe claro que qualquer sugestão de tamanho baseada em altura e peso é **apenas uma estimativa inicial/referência** e pode variar de acordo com a estrutura física de cada pessoa.
2. **Recomendação Obrigatória do Guia**: Sempre recomende ao cliente que verifique a tabela oficial de centímetros no **"Guia de Medidas"** disponível na página do produto (onde ele pode medir uma camiseta dele em casa para comparar).
3. **Referências Estimadas de Camisas de Futebol (Adulto)**:
   - P (S): Altura 165-170cm | Peso 50-60kg
   - M: Altura 170-175cm | Peso 60-70kg
   - G (L): Altura 175-180cm | Peso 70-80kg
   - GG (XL): Altura 180-185cm | Peso 80-90kg
   - 2XL: Altura 185-190cm | Peso 90-100kg
   - 3XL/4XL: Para pesos superiores a 100kg ou alturas acima de 190cm.
   - *Nota de Caimento*: Camisas de futebol possuem modelagem justa/atlética. Se o cliente preferir caimento solto ou estiver no limite dos pesos, sugira o tamanho maior como referência inicial, mas reforce para medir antes de comprar.
4. **Camisetas Streetwear**: Modelagem oversized/boxy (mais larga e casual), tamanhos de S a 3XL.
5. **Regatas NBA**: Caimento longo e folgado.
6. **Chuteiras / Calçados**: Ajuste firme. Sugerir meio número acima do calçado de passeio como referência inicial e checar a tabela de centímetros do guia.

Responda sempre com base nessas informações e guie o cliente de forma transparente!${nameInstruction}`;

    // 4. Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history
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

    // 5. Save the updated conversation in Supabase if sessionId is provided
    if (sessionId) {
      const dbMessages = [...history, { role: 'assistant', content: reply }];
      try {
        const { error: upsertError } = await supabase
          .from('ai_conversations')
          .upsert({
            session_id: sessionId,
            user_name: userName || null,
            user_ip: ip,
            messages: dbMessages,
            updated_at: new Date().toISOString()
          }, { onConflict: 'session_id' });
          
        if (upsertError) {
          console.error('❌ Error saving conversation to database:', upsertError);
        }
      } catch (dbErr) {
        console.error('❌ Exception saving conversation to database:', dbErr);
      }
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('❌ AI Chatbot API Error:', error?.response?.data || error.message);
    const errorMessage = error?.response?.data?.error?.message || error.message;
    return res.status(500).json({ error: 'Erro ao processar conversa com a IA', details: errorMessage });
  }
}

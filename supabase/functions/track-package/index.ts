import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dicionário básico para termos comuns caso a API de tradução falhe
const commonTranslations = {
  "货物电子信息已经收到": "Informações eletrônicas recebidas",
  "已揽收": "Coletado pelo fornecedor",
  "到达": "Chegou em",
  "离开": "Partiu de",
  "正在处理": "Em processamento",
  "出库": "Saiu do depósito",
  "入库": "Entrou no depósito",
  "海关": "Alfândega",
  "清关完成": "Desembaraço aduaneiro concluído",
  "派送中": "Em rota de entrega",
  "签收": "Entregue/Assinado"
};

async function translateText(text) {
  if (!text) return '';
  
  // Limpa o texto (remove / no final e espaços extras)
  const cleanText = text.replace(/\/$/, '').trim();
  if (!cleanText) return '';
  
  // Tenta o dicionário local primeiro
  if (commonTranslations[cleanText]) {
    return commonTranslations[cleanText];
  }

  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=zh|pt`);
    const data = await res.json();
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (e) {
    console.error("Erro na tradução:", e);
  }
  
  return cleanText;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { trackingNumber } = await req.json()

    if (!trackingNumber) {
      return new Response(JSON.stringify({ error: 'Tracking number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const formData = new URLSearchParams();
    formData.append('documentCode', trackingNumber);

    const response = await fetch('http://193.112.141.69:8082/en/trackIndex.htm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: formData.toString()
    });

    const html = await response.text();

    const cleanHTML = (str) => {
      if (!str) return '';
      return str.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
    }

    // 1. Extract Main Info (reference, tracking, country, etc)
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let match;
    const items = [];
    while ((match = liRegex.exec(html)) !== null) {
      items.push(cleanHTML(match[1]));
    }

    let trackingData = null;
    if (items.length >= 12) {
      trackingData = {
        referenceNo: items[6],
        trackingNumber: items[7],
        country: items[8],
        date: items[9],
        lastRecord: await translateText(items[10]),
        consigneeName: items[11]
      };
    }

    // 2. Extract History (Timeline) - Localizado dentro da div men_li
    const history = [];
    
    // Pegamos apenas o conteúdo da div men_li para evitar pegar outras tabelas do site
    const menLiMatch = html.match(/<div class="men_li">([\s\S]*?)<\/div>/);
    if (menLiMatch) {
      const menLiHtml = menLiMatch[1];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
      
      let trMatch;
      while ((trMatch = trRegex.exec(menLiHtml)) !== null) {
        const rowHtml = trMatch[1];
        const rowData = [];
        let tdMatch;
        while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
          rowData.push(cleanHTML(tdMatch[1]));
        }
        
        if (rowData.length >= 3) {
          rowData[2] = await translateText(rowData[2]);
          history.push(rowData);
        }
      }
    }

    return new Response(JSON.stringify({ 
      trackingData,
      history
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

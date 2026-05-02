// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatToAMPM(dateStr: string) {
  if (!dateStr || !dateStr.includes(' ')) return dateStr;
  try {
    const parts = dateStr.split(' ');
    const date = parts[0];
    const time = parts[parts.length - 1];
    const [h, m, s] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    const pad = (n: number) => n < 10 ? `0${n}` : n;
    return `${date} às ${pad(hh)}:${pad(m)}:${pad(s || 0)} ${ampm}`;
  } catch { return dateStr; }
}

const commonTranslations: Record<string, string> = {
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
  "签收": "Entregue/Assinado",
  "广州": "Guangzhou",
  "深圳": "Shenzhen",
  "上海": "Xangai",
  "北京": "Pequim",
  "香港": "Hong Kong",
  "Cantão": "Guangzhou",
  "Canton": "Guangzhou",
  "The goods leave the operation center": "As mercadorias saíram do centro de operação",
  "Arrived at the operating center": "Chegou ao centro operacional",
  "The goods have been received": "As mercadorias foram recebidas",
  "Electronic information received": "Informações eletrônicas recebidas",
  "Departed from facility": "Partiu da instalação",
  "Arrived at facility": "Chegou na instalação",
  "In transit": "Em trânsito",
  "Out for delivery": "Saiu para entrega",
  "Delivered": "Entregue",
  "Electronic information submitted by shipper": "Informações eletrônicas enviadas pelo remetente"
};

const htmlEntities: Record<string, string> = {
  '&nbsp;': ' ', '&aacute;': 'á', '&Aacute;': 'Á', '&eacute;': 'é', '&Eacute;': 'É',
  '&iacute;': 'í', '&Iacute;': 'Í', '&oacute;': 'ó', '&Oacute;': 'Ó', '&uacute;': 'ú',
  '&Uacute;': 'Ú', '&atilde;': 'ã', '&Atilde;': 'Ã', '&otilde;': 'õ', '&Otilde;': 'Õ',
  '&ccedil;': 'ç', '&Ccedil;': 'Ç', '&acirc;': 'â', '&ecirc;': 'ê', '&ocirc;': 'ô',
  '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>'
};

async function translateText(text: string): Promise<string> {
  if (!text) return '';
  const clean = text.replace(/\/$/, '').trim();
  if (!clean) return '';
  if (commonTranslations[clean]) return commonTranslations[clean];
  if (/[^\x00-\xff]/.test(clean)) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=zh|pt`);
      const d: any = await res.json();
      if (d.responseData?.translatedText) return d.responseData.translatedText;
    } catch { }
  } else if (/^[a-zA-Z\s,.'-]+$/.test(clean) && clean.length > 3) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|pt`);
      const d: any = await res.json();
      if (d.responseData?.translatedText) return d.responseData.translatedText;
    } catch { }
  }
  return clean;
}

async function fetchChineseTracking(num: string) {
  const decodeEntities = (str: string): string => str.replace(/&[a-zA-Z]+;/g, (m: string) => htmlEntities[m] || m);
  const cleanHTML = (str: string): string => {
    if (!str) return '';
    const noTags = str.replace(/<[^>]+>/g, '');
    return decodeEntities(noTags).trim();
  };

  const body = new URLSearchParams(); 
  body.append('documentCode', num);
  
  const res = await fetch('http://193.112.141.69:8082/en/trackIndex.htm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
    body: body.toString()
  });
  
  const html = await res.text();
  const history: any[] = [];
  const menLiMatch = html.match(/<div class="men_li">([\s\S]*?)<\/div>/);
  
  if (menLiMatch) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let trM;
    while ((trM = trRegex.exec(menLiMatch[1])) !== null) {
      const row: string[] = [];
      let tdM;
      while ((tdM = tdRegex.exec(trM[1])) !== null) row.push(cleanHTML(tdM[1]));
      if (row.length >= 3) {
        history.push({ 
          date: formatToAMPM(row[0]), 
          location: await translateText(row[1]), 
          status: await translateText(row[2]), 
          carrier: 'CN' 
        });
      }
    }
  }

  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let liM; 
  const items: string[] = [];
  while ((liM = liRegex.exec(html)) !== null) items.push(cleanHTML(liM[1]));
  
  let trackingData = null;
  if (items.length >= 12) {
    trackingData = { 
      referenceNo: items[6], 
      trackingNumber: items[7], 
      country: items[8], 
      date: history[history.length-1]?.date || items[9], 
      lastRecord: await translateText(items[10]), 
      consigneeName: items[11] 
    };
  }
  return { trackingData, chineseHistory: history };
}

async function fetch17trackData(num: string) {
  // @ts-ignore
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY');
  if (!apiKey) return [];
  try {
    const cleanNum = num.trim();
    await fetch('https://api.17track.net/track/v2/register', {
      method: 'POST',
      headers: { '17token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ number: cleanNum }])
    });

    // PAUSA TÉCNICA: Dá tempo para o servidor do 17track processar o registro
    await new Promise(r => setTimeout(r, 3000));
    
    let res = await fetch('https://api.17track.net/track/v2/gettrackinfo', {
      method: 'POST',
      headers: { '17token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ number: cleanNum }])
    });
    
    let data: any = await res.json();
    console.log(`DIAGNÓSTICO 17TRACK V2 - Resposta para ${cleanNum}:`, JSON.stringify(data));
    
    const accepted = data?.data?.accepted?.[0];
    if (!accepted) return [];

    const events: any[] = [];
    
    // 1. Tenta o formato novo (do seu log)
    const providers = accepted.track_info?.tracking?.providers || [];
    providers.forEach((p: any) => {
      if (p.events) events.push(...p.events);
    });

    // 2. Tenta o formato antigo (z0, z1, z2) como backup
    const track = accepted.track;
    if (track) {
      events.push(...(track.z0 || []), ...(track.z1 || []), ...(track.z2 || []));
    }

    if (events.length === 0) {
      console.log(`17TRACK SEM EVENTOS: O objeto existe mas a lista de eventos está vazia.`);
      return [];
    }

    // Remover duplicados
    const uniqueEvents = events.filter((v, i, a) => 
      a.findIndex(t => (t.time_iso === v.time_iso && t.description === v.description)) === i
    );

    return await Promise.all(uniqueEvents.map(async (e: any) => {
      let displayDate = e.time_iso || e.a || '';
      
      // Limpeza robusta: Troca T por espaço e remove fuso horário (ex: -04:00 ou +02:00)
      displayDate = displayDate
        .replace('T', ' ')
        .replace(/[-+]\d{2}:?\d{2}$/, '') // Remove fuso no final
        .split('.')[0] // Remove milissegundos se houver
        .trim();

      return { 
        date: formatToAMPM(displayDate), 
        location: await translateText(e.location || e.c || ''), 
        status: await translateText(e.description || e.z || ''), 
        carrier: 'CA' 
      };
    }));
  } catch { return []; }
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  console.log("FUNÇÃO INICIADA - Recebendo requisição...");
  
  try {
    const { trackingNumber } = await req.json();
    if (!trackingNumber) return new Response(JSON.stringify({ error: 'Número obrigatório' }), { headers: corsHeaders, status: 400 });

    const cleanNum = trackingNumber.trim();
    console.log(`Buscando número: ${cleanNum}`);

    // @ts-ignore
    const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');

    // Se o número tiver espaço no final, ignoramos o cache para teste
    if (trackingNumber === cleanNum) {
      const { data: cached } = await supabase.from('tracking_cache').select('*').eq('tracking_number', cleanNum).maybeSingle();
      if (cached && (Date.now() - new Date(cached.last_updated).getTime()) < 14400000) {
        console.log("Retornando dados do CACHE.");
        return new Response(JSON.stringify(cached.status_data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    } else {
      console.log("IGNORANDO CACHE (Modo Refresh ativado pelo espaço no final)");
    }

    console.log("Iniciando buscas externas (China + 17Track)...");
    
    // Controller para timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const [cnRes, caRes] = await Promise.allSettled([
      fetchChineseTracking(cleanNum), 
      fetch17trackData(cleanNum)
    ]);
    
    clearTimeout(timeoutId);

    const cn = cnRes.status === 'fulfilled' ? cnRes.value : { trackingData: null, chineseHistory: [] };
    const ca = caRes.status === 'fulfilled' ? caRes.value : [];
    
    console.log(`Busca concluída. China: ${cn.chineseHistory.length} eventos, 17Track: ${ca.length} eventos.`);

    const finalData = { 
      trackingData: cn.trackingData, 
      history: [...cn.chineseHistory, ...ca].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
      hasCanadaPostData: ca.length > 0, 
      cachedAt: new Date().toISOString() 
    };

    if (finalData.history.length > 0) {
      await supabase.from('tracking_cache').upsert({ 
        tracking_number: cleanNum, 
        status_data: finalData, 
        last_updated: new Date().toISOString() 
      });
    }

    return new Response(JSON.stringify(finalData), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (e: any) {
    console.error("ERRO CRÍTICO NA FUNÇÃO:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});

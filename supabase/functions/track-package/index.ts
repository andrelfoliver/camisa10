// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  "The goods leave the operation center": "As mercadorias saíram do centro de operação",
  "Arrived at the operating center": "Chegou ao centro operacional",
  "The goods have been received": "As mercadorias foram recebidas",
  "Electronic information received": "Informações eletrônicas recebidas",
  "Departed from facility": "Partiu da instalação",
  "Arrived at facility": "Chegou na instalação",
  "In transit": "Em trânsito",
  "Out for delivery": "Saiu para entrega",
  "Delivered": "Entregue"
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
  const hasChinese = /[^\x00-\xff]/.test(clean);
  if (hasChinese) {
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
  const cleanHTML = (s: string) => s ? s.replace(/<[^>]+>/g, '').replace(/&[a-zA-Z]+;/g, (m) => htmlEntities[m] || m).trim() : '';
  const body = new URLSearchParams(); body.append('documentCode', num);
  const res = await fetch('http://193.112.141.69:8082/en/trackIndex.htm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
    body: body.toString()
  });
  const html = await res.text();
  const history: any[] = [];
  const menLi = html.match(/<div class="men_li">([\s\S]*?)<\/div>/);
  if (menLi) {
    const trs = menLi[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];
    for (const tr of trs) {
      const tds = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
      const row = tds.map(cleanHTML);
      if (row.length >= 3) history.push({ date: row[0], location: await translateText(row[1]), status: await translateText(row[2]), carrier: 'CN' });
    }
  }
  const items = (html.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || []).map(cleanHTML);
  const trackingData = items.length >= 12 ? { referenceNo: items[6], trackingNumber: items[7], country: items[8], date: history[history.length-1]?.date || items[9], lastRecord: await translateText(items[10]), consigneeName: items[11] } : null;
  return { trackingData, chineseHistory: history };
}

async function fetch17trackData(num: string) {
  // @ts-ignore
  const key = Deno.env.get('SEVENTEENTRACK_API_KEY'); if (!key) return [];
  try {
    await fetch('https://api.17track.net/track/v2.4/register', { method: 'POST', headers: { '17token': key, 'Content-Type': 'application/json' }, body: JSON.stringify([{ number: num }]) });
    const res = await fetch('https://api.17track.net/track/v2.4/gettrackinfo', { method: 'POST', headers: { '17token': key, 'Content-Type': 'application/json' }, body: JSON.stringify([{ number: num }]) });
    const d: any = await res.json();
    return (d?.data?.accepted?.[0]?.track?.z1 || []).map((e: any) => ({ date: e.a || '', location: e.c || '', status: e.z || '', carrier: 'CA' }));
  } catch { return []; }
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { trackingNumber } = await req.json();
    if (!trackingNumber) return new Response('error', { status: 400 });
    // @ts-ignore
    const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { data: cached } = await supabase.from('tracking_cache').select('*').eq('tracking_number', trackingNumber).maybeSingle();
    if (cached && (Date.now() - new Date(cached.last_updated).getTime()) < 14400000) return new Response(JSON.stringify(cached.status_data), { headers: corsHeaders });

    const results: any[] = await Promise.allSettled([fetchChineseTracking(trackingNumber), fetch17trackData(trackingNumber)]);
    const cn = results[0].status === 'fulfilled' ? results[0].value : { trackingData: null, chineseHistory: [] };
    const ca = results[1].status === 'fulfilled' ? results[1].value : [];
    
    const finalData = { trackingData: cn.trackingData, history: [...cn.chineseHistory, ...ca].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), hasCanadaPostData: ca.length > 0, cachedAt: new Date().toISOString() };
    await supabase.from('tracking_cache').upsert({ tracking_number: trackingNumber, status_data: finalData, last_updated: new Date().toISOString() });
    return new Response(JSON.stringify(finalData), { headers: corsHeaders });
  } catch (e: any) { return new Response(e.message, { status: 500 }); }
});

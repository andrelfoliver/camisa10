// @ts-ignore: Deno types
const corsHeaders: { [key: string]: string } = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const commonTranslations: { [key: string]: string } = {
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
  "香港": "Hong Kong"
};

const htmlEntities: { [key: string]: string } = {
  '&nbsp;': ' ',
  '&aacute;': 'á', '&Aacute;': 'Á',
  '&eacute;': 'é', '&Eacute;': 'É',
  '&iacute;': 'í', '&Iacute;': 'Í',
  '&oacute;': 'ó', '&Oacute;': 'Ó',
  '&uacute;': 'ú', '&Uacute;': 'Ú',
  '&atilde;': 'ã', '&Atilde;': 'Ã',
  '&otilde;': 'õ', '&Otilde;': 'Õ',
  '&ccedil;': 'ç', '&Ccedil;': 'Ç',
  '&acirc;': 'â', '&ecirc;': 'ê', '&ocirc;': 'ô',
  '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>'
};

async function translateText(text: string): Promise<string> {
  if (!text) return '';
  const cleanText: string = text.replace(/\/$/, '').trim();
  if (!cleanText) return '';
  if (commonTranslations[cleanText]) return commonTranslations[cleanText];

  if (/^[\x00-\x7F\u00C0-\u024F\s\d\W]+$/.test(cleanText)) return cleanText;

  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=zh|pt`);
    const data: any = await res.json();
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (e) {
    console.error("Erro na tradução:", e);
  }
  return cleanText;
}

async function fetchChineseTracking(trackingNumber: string) {
  const decodeEntities = (str: string): string =>
    str.replace(/&[a-zA-Z]+;/g, (match: string) => htmlEntities[match] || match);

  const cleanHTML = (str: string): string => {
    if (!str) return '';
    const noTags: string = str.replace(/<[^>]+>/g, '');
    return decodeEntities(noTags).trim();
  };

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

  const html: string = await response.text();
  const liRegex: RegExp = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let match: RegExpExecArray | null;
  const items: string[] = [];
  while ((match = liRegex.exec(html)) !== null) {
    items.push(cleanHTML(match[1]));
  }

  const history: Array<{ date: string; location: string; status: string; carrier: 'CN' }> = [];
  const menLiMatch: RegExpMatchArray | null = html.match(/<div class="men_li">([\s\S]*?)<\/div>/);
  if (menLiMatch) {
    const menLiHtml: string = menLiMatch[1];
    const trRegex: RegExp = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const tdRegex: RegExp = /<td[^>]*>([\s\S]*?)<\/td>/g;

    let trMatch: RegExpExecArray | null;
    while ((trMatch = trRegex.exec(menLiHtml)) !== null) {
      const rowHtml: string = trMatch[1];
      const rowData: string[] = [];
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        rowData.push(cleanHTML(tdMatch[1]));
      }

      if (rowData.length >= 3) {
        const translatedLocation: string = await translateText(rowData[1]);
        const translatedStatus: string = await translateText(rowData[2]);
        history.push({
          date: rowData[0],
          location: translatedLocation,
          status: translatedStatus,
          carrier: 'CN'
        });
      }
    }
  }

  let trackingData = null;
  if (items.length >= 12) {
    const shippingDate: string = (history.length > 0) ? history[history.length - 1].date : items[9];
    trackingData = {
      referenceNo: items[6],
      trackingNumber: items[7],
      country: items[8],
      date: shippingDate,
      lastRecord: await translateText(items[10]),
      consigneeName: items[11]
    };
  }

  return { trackingData, chineseHistory: history };
}

async function fetch17trackData(trackingNumber: string) {
  // @ts-ignore: Deno global
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY');
  if (!apiKey) return [];

  try {
    const registerRes = await fetch('https://api.17track.net/track/v2.4/register', {
      method: 'POST',
      headers: { '17token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ number: trackingNumber }])
    });

    if (!registerRes.ok) return [];

    const trackRes = await fetch('https://api.17track.net/track/v2.4/gettrackinfo', {
      method: 'POST',
      headers: { '17token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ number: trackingNumber }])
    });

    if (!trackRes.ok) return [];

    const trackData: any = await trackRes.json();
    const accepted: any[] = trackData?.data?.accepted || [];
    if (accepted.length === 0) return [];

    const packageInfo = accepted[0];
    const trackList: any[] = packageInfo?.track?.z1 || [];
    const canadianEvents: Array<{ date: string; location: string; status: string; carrier: 'CA' }> = [];

    for (const event of trackList) {
      canadianEvents.push({
        date: event.a || '',
        location: event.c || '',
        status: event.z || '',
        carrier: 'CA'
      });
    }

    return canadianEvents;
  } catch (e) {
    console.error('17track error:', e);
    return [];
  }
}

function mergeTimelines(
  chineseHistory: Array<{ date: string; location: string; status: string; carrier: 'CN' }>,
  canadianHistory: Array<{ date: string; location: string; status: string; carrier: 'CA' }>
) {
  const all = [...chineseHistory, ...canadianHistory];
  all.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (isNaN(dateA) || isNaN(dateB)) return 0;
    return dateB - dateA;
  });
  return all;
}

// @ts-ignore: Deno.serve global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: any = await req.json();
    const trackingNumber: string = body?.trackingNumber;

    if (!trackingNumber) {
      return new Response(JSON.stringify({ error: 'Tracking number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const results: any[] = await Promise.allSettled([
      fetchChineseTracking(trackingNumber),
      fetch17trackData(trackingNumber)
    ]);

    const chineseResult = results[0];
    const canadianResult = results[1];

    const chineseData = chineseResult.status === 'fulfilled' 
      ? chineseResult.value 
      : { trackingData: null, chineseHistory: [] };
    
    const caHistory = canadianResult.status === 'fulfilled' 
      ? canadianResult.value 
      : [];

    const mergedHistory = mergeTimelines(chineseData.chineseHistory, caHistory);

    return new Response(JSON.stringify({
      trackingData: chineseData.trackingData,
      history: mergedHistory,
      hasCanadaPostData: caHistory.length > 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

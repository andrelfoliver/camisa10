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
  // Chinês
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
  "Electronic information submitted by shipper": "Informações eletrônicas enviadas pelo remetente",
  // USPS / DHL eCommerce US
  "In Transit, Arriving On Time": "Em trânsito — chegando no prazo",
  "In Transit, Arriving Late": "Em trânsito — com atraso",
  "Departed USPS Facility": "Saiu das instalações do USPS",
  "Arrived at USPS Facility": "Chegou nas instalações do USPS",
  "Accepted at USPS Facility": "Aceito nas instalações do USPS",
  "Accepted at USPS Origin Facility": "Aceito no centro de origem do USPS",
  "Arrived at USPS Regional Facility": "Chegou ao centro regional do USPS",
  "Departed USPS Regional Facility": "Saiu do centro regional do USPS",
  "Arrived at USPS Regional Origin Facility": "Chegou ao centro regional de origem do USPS",
  "Arrived at USPS Regional Destination Facility": "Chegou ao centro regional de destino do USPS",
  "Departed USPS Regional Destination Facility": "Saiu do centro regional de destino do USPS",
  "Arrived at Post Office": "Chegou na agência postal",
  "Out for Delivery": "Saiu para entrega",
  "Delivered, In/At Mailbox": "Entregue na caixa de correio",
  "Delivered, Front Door/Porch": "Entregue na porta da frente",
  "Delivered, Left with Individual": "Entregue a uma pessoa",
  "Delivered, Parcel Locker": "Entregue no armário de encomendas",
  "Delivered, To Agent": "Entregue a um agente",
  "Delivered": "Entregue",
  "Delivery Attempt": "Tentativa de entrega",
  "Delivery Attempted - No Access to Delivery Location": "Tentativa de entrega — sem acesso ao local",
  "Notice Left (No Authorized Recipient Available)": "Aviso deixado — destinatário não disponível",
  "Notice Left (No Secure Location Available)": "Aviso deixado — sem local seguro disponível",
  "Available for Pickup": "Disponível para retirada",
  "Picked Up by Agent": "Retirado por agente",
  "Return to Sender": "Devolvido ao remetente",
  "Shipment Received, Package Acceptance Pending": "Remessa recebida — aceitação pendente",
  "USPS in possession of item": "Encomenda em posse do USPS",
  "USPS awaiting item": "USPS aguardando a encomenda",
  "Pre-Shipment Info Sent to USPS, USPS Awaiting Item": "Informação pré-envio enviada ao USPS — aguardando encomenda",
  "Shipping Label Created, USPS Awaiting Item": "Etiqueta criada — USPS aguardando encomenda",
  "Electronic Shipping Info Received": "Informações eletrônicas de envio recebidas",
  "Processed Through Facility": "Processado no centro de distribuição",
  "Processed Through USPS Facility": "Processado nas instalações do USPS",
  "Customs Clearance": "Desembaraço aduaneiro",
  "Customs Clearance Processing Complete": "Desembaraço aduaneiro concluído",
  "Inbound Out of Customs": "Saiu da alfândega — entrada no país",
  "Held in Customs": "Retido na alfândega",
  "International Dispatch": "Despacho internacional",
  "Arrived at Hub": "Chegou ao hub de distribuição",
  "Departed Hub": "Saiu do hub de distribuição",
  "Package transferred to post office": "Encomenda transferida para a agência postal",
  "Forwarded": "Encaminhado",
  "Addressee not available": "Destinatário não disponível",
  "Insufficient address": "Endereço insuficiente",
  "No Such Number": "Número inexistente",
  "Moved, Left no Address": "Mudou de endereço sem deixar novo endereço"
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
  const raw = text.trim();
  if (!raw) return '';

  // 1. Tenta o texto completo no dicionário primeiro
  if (commonTranslations[raw]) return commonTranslations[raw];

  // 2. Para textos USPS com "Status → Descrição longa" ou "Status -> Descrição longa"
  //    extrai apenas a parte antes da seta (pode ser Unicode → ou ASCII ->)
  const arrowMatch = raw.match(/^(.+?)\s*(?:→|->)\s+.+$/);
  if (arrowMatch) {
    const shortStatus = arrowMatch[1].trim();
    if (commonTranslations[shortStatus]) return commonTranslations[shortStatus];
  }

  // 3. Tenta verificar se alguma chave do dicionário está no início do texto
  for (const key of Object.keys(commonTranslations)) {
    if (raw.startsWith(key)) return commonTranslations[key];
  }

  // 4. Texto limpo para tradução via API (sem a parte longa após →)
  const clean = (arrowMatch ? arrowMatch[1] : raw).replace(/\/$/, '').trim();
  if (!clean) return raw;

  if (/[^\x00-\xff]/.test(clean)) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=zh|pt`);
      const d: any = await res.json();
      if (d.responseData?.translatedText) {
        const trans = d.responseData.translatedText;
        if (trans.toUpperCase().includes('MYMEMORY WARNING')) return clean;
        return trans;
      }
    } catch { }
  } else if (/^[a-zA-Z\s,.'()-]+$/.test(clean) && clean.length > 3) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|pt`);
      const d: any = await res.json();
      if (d.responseData?.translatedText) {
        const trans = d.responseData.translatedText;
        if (trans.toUpperCase().includes('MYMEMORY WARNING')) return clean;
        return trans;
      }
    } catch { }
  }
  return clean;
}


function isEventInDestinationCountry(locationText: string, statusText: string, country: string): boolean {
  const loc = (locationText || '').toLowerCase();
  const stat = (statusText || '').toLowerCase();
  
  if (country === 'US') {
    const directKeywords = [
      'usa', 'eua', 'united states', 'chicago', 'miami', 'new york', 'jfk', 'lax', 
      'o\'hare', 'ohare', 'houston', 'katy', 'orlando', 'los angeles', 'san francisco', 
      'dallas', 'atlanta', 'newark', 'oakland', 'seattle', 'boston', 'detroit', 'philadelphia'
    ];
    if (directKeywords.some(kw => loc.includes(kw) || stat.includes(kw))) {
      return true;
    }
    const usRegex = /\bus\b/i;
    if (usRegex.test(loc) || usRegex.test(stat)) {
      return true;
    }
  } else if (country === 'CA') {
    const directKeywords = [
      'canada', 'canadá', 'toronto', 'vancouver', 'montreal', 'calgary', 
      'edmonton', 'ottawa', 'mississauga', 'winnipeg', 'halifax'
    ];
    if (directKeywords.some(kw => loc.includes(kw) || stat.includes(kw))) {
      return true;
    }
    const caRegex = /\bca\b/i;
    if (caRegex.test(loc) || caRegex.test(stat)) {
      return true;
    }
  }
  return false;
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
          rawDate: row[0],
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

async function fetch17trackData(num: string, isUsps: boolean, destCountry: string, postalCode: string, dbCity?: string, forceRefresh?: boolean) {
  // @ts-ignore
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY');
  if (!apiKey) return { events: [], rawAccepted: null, debugLogs: [], infoResults: [] };
  try {
    const cleanNum = num.trim();
    const cleanPostal = postalCode ? postalCode.trim().replace(/\s+/g, '') : '';
    const paramVal = cleanPostal ? `${destCountry}-${cleanPostal}` : destCountry;

    // ECONOMIA DE COTA: apenas auto-detect + 1 carrier específico (max 2 itens)
    // O 17track consegue identificar o carrier automaticamente na maioria dos casos.
    // Carrier específico: 7047 = DHL eCommerce US (cobre USPS/DHL números começando com 92...)
    const carriersToTry = isUsps
      ? [undefined, 7047]   // auto-detect + DHL eCommerce US
      : [undefined, 3041];  // auto-detect + Canada Post

    const baseItem = (c: number | undefined) => ({
      number: cleanNum,
      ...(c !== undefined ? { carrier: c } : {}),
      param: paramVal,
      destination_postal_code: cleanPostal || undefined,
      destination_country: destCountry || undefined,
      destination_city: dbCity || undefined
    });

    // 1. Registra (apenas se forceRefresh ou primeira vez — o 17track ignora duplicatas automaticamente)
    try {
      const registerPayload = carriersToTry.map(baseItem);
      await fetch('https://api.17track.net/track/v2/register', {
        method: 'POST',
        headers: { '17token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload)
      });
    } catch (err) {
      console.error("Erro ao registrar no 17track:", err);
    }

    // Pausa para o servidor processar o registro
    await new Promise(r => setTimeout(r, 3000));

    // 2. Busca dados — apenas UMA chamada (gettrackinfo v2, mais estável e econômica)
    const infoPayload = carriersToTry.map(baseItem);
    let infoResults: any[] = [];
    let acceptedList: any[] = [];

    try {
      console.log("Chamando gettrackinfo v2...");
      const res = await fetch('https://api.17track.net/track/v2/gettrackinfo', {
        method: 'POST',
        headers: { '17token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(infoPayload)
      });
      const resData = await res.json();
      if (resData && resData.code === 0 && resData.data?.accepted) {
        infoResults.push(resData);
        acceptedList.push(...(resData.data.accepted || []));
        console.log(`gettrackinfo v2: ${resData.data.accepted.length} aceitos`);
      } else {
        console.warn("gettrackinfo v2 sem aceitos. Code:", resData?.code);
      }
    } catch (err) {
      console.error("Erro no gettrackinfo v2:", err);
    }

    const debugLogs: string[] = [];
    acceptedList.forEach((accepted: any) => {
      const providers = accepted.track_info?.tracking?.providers || [];
      const providerNames = providers.map((p: any) => `${p.provider?.name} (${p.events?.length || 0})`);
      debugLogs.push(`CARRIER ${accepted.carrier}: status=${accepted.track_info?.latest_status?.status}, providers=${JSON.stringify(providerNames)}`);
    });

    if (acceptedList.length === 0) return { events: [], rawAccepted: null, debugLogs, infoResults };

    const events: any[] = [];
    acceptedList.forEach((accepted: any) => {
      const providers = accepted.track_info?.tracking?.providers || [];
      providers.forEach((p: any) => {
        if (p.events) events.push(...p.events);
      });

      const track = accepted.track;
      if (track) {
        events.push(...(track.z0 || []), ...(track.z1 || []), ...(track.z2 || []));
      }
    });

    if (events.length === 0) {
      console.log(`17TRACK SEM EVENTOS.`);
      return { events: [], rawAccepted: acceptedList[0], debugLogs, infoResults };
    }

    // Remover duplicados
    const uniqueEvents = events.filter((v, i, a) =>
      a.findIndex(t => (t.time_iso === v.time_iso && t.description === v.description)) === i
    );

    const mappedEvents = await Promise.all(uniqueEvents.map(async (e: any) => {
      let displayDate = e.time_iso || e.a || '';
      displayDate = displayDate
          .replace('T', ' ')
          .replace(/[-+]\d{2}:?\d{2}$/, '')
          .split('.')[0]
          .trim();

      return {
        rawDate: displayDate,
        date: formatToAMPM(displayDate),
        location: await translateText(e.location || e.c || ''),
        status: await translateText(e.description || e.z || ''),
        carrier: isUsps ? 'US' : 'CA'
      };
    }));

    const bestAccepted = acceptedList.find(a =>
      a.track_info?.tracking?.providers?.some((p: any) => p.events && p.events.length > 0)
    ) || acceptedList[0];

    return { events: mappedEvents, rawAccepted: bestAccepted, debugLogs, infoResults };
  } catch (err) {
    console.error("Erro no fetch17trackData:", err);
    return { events: [], rawAccepted: null, debugLogs: [], infoResults: [] };
  }
}


// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  console.log("FUNÇÃO INICIADA - Recebendo requisição...");
  
  try {
    const { trackingNumber, forceRefresh } = await req.json();
    if (!trackingNumber) return new Response(JSON.stringify({ error: 'Número obrigatório' }), { headers: corsHeaders, status: 400 });

    const cleanNum = trackingNumber.trim();
    const isUsps = /^(9\d{21}|[A-Z]{2}\d{9}US)$/i.test(cleanNum);
    console.log(`Buscando número: ${cleanNum}, isUsps: ${isUsps}, forceRefresh: ${forceRefresh}`);

    // @ts-ignore
    const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');

    // Ignora cache se forceRefresh for true ou se houver espaço no final
    const bypassCache = forceRefresh || (trackingNumber !== cleanNum);

    let cachedRecord = null;
    let cachedTrackingData = null;
    let cachedHistory: any[] = [];

    try {
      const { data: cached } = await supabase.from('tracking_cache').select('*').eq('tracking_number', cleanNum).maybeSingle();
      if (cached) {
        cachedRecord = cached;
        cachedTrackingData = cached.status_data?.trackingData || null;
        cachedHistory = cached.status_data?.history || [];
      }
    } catch (err) {
      console.error("Erro ao buscar cache do banco:", err);
    }

    if (!bypassCache && cachedRecord) {
      if ((Date.now() - new Date(cachedRecord.last_updated).getTime()) < 14400000) {
        console.log("Retornando dados do CACHE.");
        return new Response(JSON.stringify(cachedRecord.status_data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    } else if (bypassCache) {
      console.log("IGNORANDO CACHE (Modo Refresh ativado)");
    }

    // Tenta encontrar o pedido no banco de dados para obter detalhes de endereço ANTES da consulta à API
    let dbCity = null;
    let destCountry = isUsps ? 'US' : 'CA';
    let postalCode = '';
    let debugOrder = null;

    try {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .ilike('tracking_number', `%${cleanNum}%`)
        .limit(1)
        .maybeSingle();
      if (order) {
        debugOrder = order;
        if (order.shipping_address && typeof order.shipping_address === 'object') {
          dbCity = order.shipping_address.city || null;
          
          const rawCountry = (order.shipping_address.country || '').toUpperCase().trim();
          if (rawCountry.includes('US') || rawCountry.includes('UNITED') || rawCountry.includes('ESTADOS') || rawCountry.includes('EUA')) {
            destCountry = 'US';
          } else {
            destCountry = 'CA';
          }
          
          postalCode = order.shipping_address.postalCode || order.shipping_address.postal_code || order.shipping_address.zip || '';
        }
      }
    } catch (dbErr) {
      console.error("Erro ao buscar dados do pedido no banco:", dbErr);
    }

    console.log(`Dados do pedido: destCountry=${destCountry}, postalCode=${postalCode}, dbCity=${dbCity}`);
    console.log("Iniciando buscas externas (China + 17Track)...");
    
    // Timeout de 14 segundos garantido via Promise.race
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout de busca externa")), 14000)
    );

    const [cnRes, caRes] = await Promise.allSettled([
      Promise.race([fetchChineseTracking(cleanNum), timeoutPromise]),
      Promise.race([fetch17trackData(cleanNum, isUsps || destCountry === 'US', destCountry, postalCode, dbCity, bypassCache), timeoutPromise])
    ]);

    const cn = cnRes.status === 'fulfilled' ? cnRes.value : { trackingData: null, chineseHistory: [] };
    const caData = caRes.status === 'fulfilled' ? caRes.value : { events: [], rawAccepted: null, debugLogs: [], infoResults: [] };
    const ca = caData.events || [];
    const debugLogs = caData.debugLogs || [];
    const infoResults = caData.infoResults || [];
    
    console.log(`Busca concluída. China: ${cn.chineseHistory.length} eventos, 17Track: ${ca.length} eventos.`);

    const allEvents = [...ca, ...cn.chineseHistory, ...cachedHistory];
    const toRemove = new Set();

    // Função auxiliar para normalização agressiva (remove acentos, pontuação, espaços e converte para minúsculo)
    const normalize = (s: string) => s ? s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Mantém apenas letras e números
      .trim() : '';

    const normalizeDate = (d: string) => d ? d.replace(/[^0-9]/g, '') : '';

    // 1. Deduplicação primária: mesma transportadora, mesma data/hora e mesmo status
    const uniqueCombined: any[] = [];
    const seenKeys = new Set();
    for (const e of allEvents) {
      if (!e) continue;
      const dKey = normalizeDate(e.rawDate || e.date);
      const sKey = normalize(e.status);
      const key = `${e.carrier || ''}|${dKey}|${sKey}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueCombined.push(e);
      } else {
        // Se já vimos, mas a versão atual tem mais informações (como localização), atualiza
        const idx = uniqueCombined.findIndex(x => `${x.carrier || ''}|${normalizeDate(x.rawDate || x.date)}|${normalize(x.status)}` === key);
        if (idx !== -1 && !uniqueCombined[idx].location && e.location) {
          uniqueCombined[idx] = e;
        }
      }
    }

    // 2. Deduplicação Inteligente com Normalização Agressiva entre transportadoras (CN vs CA ou CN vs US)
    for (let i = 0; i < uniqueCombined.length; i++) {
      for (let j = 0; j < uniqueCombined.length; j++) {
        if (i === j || toRemove.has(i) || toRemove.has(j)) continue;
        const a = uniqueCombined[i];
        const b = uniqueCombined[j];

        // Só comparamos se forem de transportadoras diferentes (CN vs CA ou CN vs US)
        if (a.carrier === b.carrier) continue;

        const statusA = normalize(a.status);
        const statusB = normalize(b.status);
        const locA = normalize(a.location);
        const locB = normalize(b.location);

        // Se o conteúdo (status + localização) for idêntico após normalização
        if (statusA === statusB && locA === locB) {
          const timeA = new Date(a.rawDate.replace(' ', 'T')).getTime();
          const timeB = new Date(b.rawDate.replace(' ', 'T')).getTime();
          
          // Se as datas forem válidas e estiverem em uma janela de 24h
          if (!isNaN(timeA) && !isNaN(timeB)) {
            const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
            if (diffHours < 24) {
              // Sempre remove o da China (CN) em favor do Local (CA/US)
              if (a.carrier === 'CN') toRemove.add(i);
              else if (b.carrier === 'CN') toRemove.add(j);
            }
          }
        }
      }
    }

    const filteredHistory = uniqueCombined.filter((_, idx) => !toRemove.has(idx));

    const country = cn.trackingData?.country?.toUpperCase() || cachedTrackingData?.country?.toUpperCase() || (isUsps || destCountry === 'US' ? 'US' : 'CA');
    const isActualUs = country === 'US' || country === 'USA' || country === 'EUA' || destCountry === 'US';

    // 3. Corrigir/atualizar o carrier para eventos locais
    const processedHistory = filteredHistory.map(event => {
      if (event.carrier === 'CA' || event.carrier === 'US') {
        return {
          ...event,
          carrier: isActualUs ? 'US' : 'CA'
        };
      }
      if (event.carrier === 'CN') {
        if (isEventInDestinationCountry(event.location, event.status, isActualUs ? 'US' : 'CA')) {
          return {
            ...event,
            carrier: isActualUs ? 'US' : 'CA'
          };
        }
      }
      return event;
    });

    // 4. Ordenar decrescente (mais recente primeiro) de forma GARANTIDA
    const sortedHistory = processedHistory.sort((a, b) => {
      const dateA = new Date(a.rawDate.replace(' ', 'T')).getTime();
      const dateB = new Date(b.rawDate.replace(' ', 'T')).getTime();
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });

    // Obter o primeiro status e a data de envio original (do evento mais antigo)
    const oldestEvent = sortedHistory[sortedHistory.length - 1];
    const newestEvent = sortedHistory[0];
    const computedDate = oldestEvent ? (oldestEvent.date || oldestEvent.rawDate) : '';
    const computedLastRecord = newestEvent ? newestEvent.status : '';

    // 5. Mesclar dados de cabeçalho para garantir que informações do cache não sejam perdidas
    const mergedTrackingData = {
      referenceNo: cn.trackingData?.referenceNo || cachedTrackingData?.referenceNo || caData.rawAccepted?.track_info?.reference_number || '',
      trackingNumber: cleanNum,
      country: isActualUs ? 'US' : 'CA',
      date: computedDate || cn.trackingData?.date || cachedTrackingData?.date || '',
      lastRecord: computedLastRecord || cn.trackingData?.lastRecord || cachedTrackingData?.lastRecord || caData.rawAccepted?.track_info?.latest_status?.status || '',
      consigneeName: cn.trackingData?.consigneeName || cachedTrackingData?.consigneeName || caData.rawAccepted?.track_info?.recipient_info?.name || caData.rawAccepted?.track_info?.consignee || '',
      city: dbCity || cn.trackingData?.city || cachedTrackingData?.city || null
    };

    const finalData = { 
      trackingData: mergedTrackingData, 
      history: sortedHistory, 
      hasCanadaPostData: !isActualUs && (ca.length > 0 || sortedHistory.some(h => h.carrier === 'CA')), 
      hasUspsData: isActualUs && (ca.length > 0 || sortedHistory.some(h => h.carrier === 'US')), 
      cachedAt: new Date().toISOString(),
      raw17Track: caData.rawAccepted,
      debugLogs,
      infoResults,
      debugOrder
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

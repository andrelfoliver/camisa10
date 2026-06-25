// src/services/analytics.js
import { supabase } from './supabase';

const SESSION_KEY = 'ifooty_session_id';
const REFERRER_KEY = 'ifooty_referrer';

// Função utilitária para gerar um ID de sessão único (UUID-like)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Inicializa a sessão, captura UTMs e configura o Meta Pixel no navegador
export function initAnalytics() {
  if (typeof window === 'undefined') return;

  // 1. Gerenciar session_id
  let sessionId = localStorage.getItem(SESSION_KEY);
  let isNewSession = false;
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
    isNewSession = true;
    
    // Limpeza preventiva de UTMs antigas de sessões anteriores
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmParams.forEach(key => {
      localStorage.removeItem(`ifooty_${key}`);
    });
    localStorage.removeItem(REFERRER_KEY);
  }

  // 2. Capturar parâmetros UTM e Referrer da URL
  const params = new URLSearchParams(window.location.search);
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  
  let hasUtm = false;
  utmParams.forEach(key => {
    const value = params.get(key);
    if (value) {
      localStorage.setItem(`ifooty_${key}`, value.trim());
      hasUtm = true;
    }
  });

  // Autodetectar Meta Ads (fbclid ou social referrer) e Google se não houver UTMs explícitas na URL
  if (!hasUtm) {
    const fbclid = params.get('fbclid');
    const referrer = document.referrer ? document.referrer.toLowerCase() : '';
    
    if (fbclid || referrer.includes('facebook.com') || referrer.includes('instagram.com') || referrer.includes('t.co') || referrer.includes('twitter.com')) {
      let detectedSource = 'facebook';
      if (referrer.includes('instagram.com')) detectedSource = 'instagram';
      else if (referrer.includes('t.co') || referrer.includes('twitter.com')) detectedSource = 'twitter';
      
      localStorage.setItem('ifooty_utm_source', detectedSource);
      localStorage.setItem('ifooty_utm_medium', 'cpc');
      localStorage.setItem('ifooty_utm_campaign', 'Meta Ads (Autodetect)');
    } else if (referrer.includes('google.com')) {
      localStorage.setItem('ifooty_utm_source', 'google');
      localStorage.setItem('ifooty_utm_medium', 'organic');
      localStorage.setItem('ifooty_utm_campaign', 'Google Search');
    }
  }

  const ref = params.get('ref') || params.get('agent');
  if (ref) {
    localStorage.setItem(REFERRER_KEY, ref.trim());
  }

  // Capturar código de teste da Meta se estiver presente na URL
  const testCode = params.get('fb_pixel_test_event_code');
  if (testCode) {
    sessionStorage.setItem('ifooty_test_event_code', testCode.trim());
  }

  // 4. Registrar Sessão encerrada no beforeunload (apenas uma vez)
  if (!window._ifooty_unload_registered) {
    window._ifooty_unload_registered = true;
    window.addEventListener('beforeunload', () => {
      // Disparar evento de Sessão encerrada de forma assíncrona/best-effort
      trackEvent('Sessão encerrada');
    });
  }

  // 3. Inicializar Meta Pixel se o ID estiver configurado
  const pixelId = (import.meta.env.VITE_META_PIXEL_ID || '').trim();
  if (pixelId && !window.fbq) {
    // Código padrão do Meta Pixel de injeção dinâmica
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId);
    console.log(`[Analytics] Meta Pixel inicializado com ID: ${pixelId}`);
  }
}

// Retorna os UTMs salvos no localStorage
export function getSavedUtms() {
  return {
    utm_source: localStorage.getItem('ifooty_utm_source') || null,
    utm_medium: localStorage.getItem('ifooty_utm_medium') || null,
    utm_campaign: localStorage.getItem('ifooty_utm_campaign') || null,
    utm_content: localStorage.getItem('ifooty_utm_content') || null,
    utm_term: localStorage.getItem('ifooty_utm_term') || null,
  };
}

// Dispara um evento de rastreamento de forma redundante (Pixel, CAPI e Banco de Dados Interno)
export async function trackEvent(eventName, customData = {}, userData = {}, eventId = null) {
  if (typeof window === 'undefined') return;

  const pixelId = (import.meta.env.VITE_META_PIXEL_ID || '').trim();
  const sessionId = localStorage.getItem(SESSION_KEY) || generateUUID();
  const utms = getSavedUtms();
  
  // Garante um eventId para deduplicação entre Pixel e CAPI
  const finalEventId = eventId || generateUUID();

  // 1. Disparar evento Meta Pixel no Navegador (Client-Side)
  if (pixelId && window.fbq) {
    try {
      window.fbq('track', eventName, customData, { eventID: finalEventId });
      console.log(`[Pixel] Evento enviado: ${eventName}`, customData, { eventID: finalEventId });
    } catch (err) {
      console.warn('[Pixel] Erro ao disparar evento:', err);
    }
  }

  // 2. Disparar evento Meta Conversion API (Server-Side CAPI)
  try {
    const testEventCode = sessionStorage.getItem('ifooty_test_event_code') || null;
    fetch('/api/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId: finalEventId,
        customData,
        userData: {
          ...userData,
          client_user_agent: window.navigator.userAgent,
        },
        testEventCode
      })
    }).catch(err => console.warn('[CAPI] Fetch background error:', err));
  } catch (capiErr) {
    console.warn('[CAPI] Erro ao disparar requisição serverless:', capiErr);
  }

  // 3. Persistir evento no banco de dados interno (Supabase analytics_events)
  try {
    const userSession = await supabase.auth.getSession();
    const userId = userSession.data?.session?.user?.id || null;

    // Extrair ID do produto se presente nas tags
    const productId = customData.content_ids && customData.content_ids[0] 
      ? Number(customData.content_ids[0]) 
      : null;

    const page = customData.path || (typeof window !== 'undefined' ? window.location.pathname : null);

    const { error } = await supabase.from('analytics_events').insert({
      event_name: eventName,
      session_id: sessionId,
      user_id: userId,
      product_id: productId,
      page: page,
      metadata: customData,
      ...utms
    });

    if (error) {
      // Falha silenciosa para não quebrar a navegação caso o usuário não tenha rodado a migração SQL ainda
      console.debug('[Analytics DB] Não foi possível persistir evento (A migração SQL foi aplicada?):', error.message);
    } else {
      console.log(`[Analytics DB] Evento persistido no banco: ${eventName}`);
    }
  } catch (dbErr) {
    console.debug('[Analytics DB] Falha silenciosa:', dbErr);
  }
}

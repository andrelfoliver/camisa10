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

  const params = new URLSearchParams(window.location.search);

  // 1. Gerenciar session_id
  let sessionId = localStorage.getItem(SESSION_KEY);
  let isNewSession = false;
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
    isNewSession = true;
    
    // Limpeza preventiva de dados antigos de sessões anteriores
    const oldParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'session_source', 'session_medium', 'session_campaign', 'session_content', 'session_term',
      'session_fbclid', 'session_gclid', 'session_landing_page', 'session_referrer', 'session_first_page',
      'session_device', 'session_browser', 'session_country', 'session_province', 'session_city', 'session_created_at'
    ];
    oldParams.forEach(key => {
      localStorage.removeItem(`ifooty_${key}`);
    });
    localStorage.removeItem(REFERRER_KEY);
  }

  // 2. Capturar parâmetros de atribuição se for nova sessão ou se a origem não estiver gravada
  if (isNewSession || !localStorage.getItem('ifooty_session_source')) {
    const referrer = document.referrer ? document.referrer.trim() : '';
    const cleanReferrer = referrer.toLowerCase();
    
    let source = 'Direto';
    let medium = null;
    let campaign = null;
    let content = null;
    let term = null;
    let fbclid = params.get('fbclid') || null;
    let gclid = params.get('gclid') || null;

    // A. Parâmetros UTM clássicos (Hierarquia 1)
    if (params.get('utm_source')) {
      source = params.get('utm_source').trim();
      medium = params.get('utm_medium') ? params.get('utm_medium').trim() : null;
      campaign = params.get('utm_campaign') ? params.get('utm_campaign').trim() : null;
      content = params.get('utm_content') ? params.get('utm_content').trim() : null;
      term = params.get('utm_term') ? params.get('utm_term').trim() : null;
    }
    // B. Meta Ads Click (Hierarquia 2)
    else if (fbclid) {
      if (cleanReferrer.includes('instagram.com')) {
        source = 'Instagram Ads';
      } else {
        source = 'Facebook Ads';
      }
      medium = 'cpc';
      campaign = 'Meta Ads';
    }
    // C. Google Ads Click (Hierarquia 3)
    else if (gclid) {
      source = 'Google Ads';
      medium = 'cpc';
      campaign = 'Google Ads';
    }
    // D. Document Referrer (Hierarquia 4)
    else if (referrer) {
      if (cleanReferrer.includes('google.')) {
        source = 'Google Orgânico';
        medium = 'organic';
      } else if (cleanReferrer.includes('bing.')) {
        source = 'Bing';
        medium = 'organic';
      } else if (cleanReferrer.includes('search.yahoo.')) {
        source = 'Yahoo';
        medium = 'organic';
      } else if (cleanReferrer.includes('duckduckgo.')) {
        source = 'DuckDuckGo';
        medium = 'organic';
      } else if (cleanReferrer.includes('facebook.com')) {
        source = 'Facebook Orgânico';
        medium = 'referral';
      } else if (cleanReferrer.includes('instagram.com')) {
        source = 'Instagram Orgânico';
        medium = 'referral';
      } else if (cleanReferrer.includes('youtube.com') || cleanReferrer.includes('youtu.be')) {
        source = 'YouTube';
        medium = 'referral';
      } else if (cleanReferrer.includes('reddit.com')) {
        source = 'Reddit';
        medium = 'referral';
      } else if (cleanReferrer.includes('linkedin.com')) {
        source = 'LinkedIn';
        medium = 'referral';
      } else if (cleanReferrer.includes('tiktok.com')) {
        source = 'TikTok';
        medium = 'referral';
      } else if (cleanReferrer.includes('wa.me') || cleanReferrer.includes('whatsapp.com')) {
        source = 'WhatsApp';
        medium = 'chat';
      } else {
        source = 'Referral';
        medium = 'referral';
      }
    }

    // Persistir dados de atribuição no localStorage
    localStorage.setItem('ifooty_session_source', source);
    if (medium) localStorage.setItem('ifooty_session_medium', medium);
    if (campaign) localStorage.setItem('ifooty_session_campaign', campaign);
    if (content) localStorage.setItem('ifooty_session_content', content);
    if (term) localStorage.setItem('ifooty_session_term', term);
    
    if (fbclid) localStorage.setItem('ifooty_session_fbclid', fbclid);
    if (gclid) localStorage.setItem('ifooty_session_gclid', gclid);
    
    localStorage.setItem('ifooty_session_referrer', referrer || 'Direto');
    localStorage.setItem('ifooty_session_landing_page', window.location.pathname + window.location.search);
    localStorage.setItem('ifooty_session_first_page', window.location.pathname);
    localStorage.setItem('ifooty_session_created_at', new Date().toISOString());

    // Identificar dispositivo e navegador a partir do User Agent
    const userAgent = window.navigator.userAgent;
    let browser = 'Outro';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('OPR')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('OPR') || userAgent.includes('Opera')) browser = 'Opera';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const device = isMobile ? 'Mobile' : 'Desktop';

    localStorage.setItem('ifooty_session_device', device);
    localStorage.setItem('ifooty_session_browser', browser);

    // Buscar dados geográficos (Canadá target) via IP (CORS-friendly)
    fetch('https://ipwho.is/')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          localStorage.setItem('ifooty_session_country', data.country || 'Canada');
          localStorage.setItem('ifooty_session_province', data.region_code || 'AB');
          localStorage.setItem('ifooty_session_city', data.city || 'Calgary');
        } else {
          throw new Error('ipwho.is success false');
        }
      })
      .catch(err => {
        console.debug('[Geolocation API] Failed, using fallback Calgary/AB:', err);
        localStorage.setItem('ifooty_session_country', 'Canada');
        localStorage.setItem('ifooty_session_province', 'AB');
        localStorage.setItem('ifooty_session_city', 'Calgary');
      });
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

  // Registrar Sessão encerrada no beforeunload (apenas uma vez)
  if (!window._ifooty_unload_registered) {
    window._ifooty_unload_registered = true;
    window.addEventListener('beforeunload', () => {
      trackEvent('Sessão encerrada');
    });
  }

  // Inicializar Meta Pixel se o ID estiver configurado
  const pixelId = (import.meta.env.VITE_META_PIXEL_ID || '').trim();
  if (pixelId && !window.fbq) {
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

// Retorna os UTMs salvos no localStorage (mantendo compatibilidade retroativa)
export function getSavedUtms() {
  return {
    utm_source: localStorage.getItem('ifooty_session_source') || null,
    utm_medium: localStorage.getItem('ifooty_session_medium') || null,
    utm_campaign: localStorage.getItem('ifooty_session_campaign') || null,
    utm_content: localStorage.getItem('ifooty_session_content') || null,
    utm_term: localStorage.getItem('ifooty_session_term') || null,
  };
}

// Retorna todos os parâmetros de atribuição salvos na sessão
export function getSavedAttribution() {
  if (typeof window === 'undefined') return {};
  return {
    utm_source: localStorage.getItem('ifooty_session_source') || null,
    utm_medium: localStorage.getItem('ifooty_session_medium') || null,
    utm_campaign: localStorage.getItem('ifooty_session_campaign') || null,
    utm_content: localStorage.getItem('ifooty_session_content') || null,
    utm_term: localStorage.getItem('ifooty_session_term') || null,
    fbclid: localStorage.getItem('ifooty_session_fbclid') || null,
    gclid: localStorage.getItem('ifooty_session_gclid') || null,
    landing_page: localStorage.getItem('ifooty_session_landing_page') || null,
    referrer: localStorage.getItem('ifooty_session_referrer') || null,
    first_page: localStorage.getItem('ifooty_session_first_page') || null,
    device: localStorage.getItem('ifooty_session_device') || null,
    browser: localStorage.getItem('ifooty_session_browser') || null,
    country: localStorage.getItem('ifooty_session_country') || null,
    province: localStorage.getItem('ifooty_session_province') || null,
    city: localStorage.getItem('ifooty_session_city') || null
  };
}

// Dispara um evento de rastreamento de forma redundante (Pixel, CAPI e Banco de Dados Interno)
export async function trackEvent(eventName, customData = {}, userData = {}, eventId = null) {
  if (typeof window === 'undefined') return;

  const pixelId = (import.meta.env.VITE_META_PIXEL_ID || '').trim();
  const sessionId = localStorage.getItem(SESSION_KEY) || generateUUID();
  const attribution = getSavedAttribution();
  
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

    const eventPayload = {
      event_name: eventName,
      session_id: sessionId,
      user_id: userId,
      product_id: productId,
      page: page,
      metadata: {
        ...customData,
        fbclid: attribution.fbclid,
        gclid: attribution.gclid,
        landing_page: attribution.landing_page,
        referrer: attribution.referrer,
        first_page: attribution.first_page,
        device: attribution.device,
        browser: attribution.browser,
        country: attribution.country,
        province: attribution.province,
        city: attribution.city
      },
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      fbclid: attribution.fbclid,
      gclid: attribution.gclid,
      landing_page: attribution.landing_page,
      referrer: attribution.referrer,
      first_page: attribution.first_page,
      device: attribution.device,
      browser: attribution.browser,
      country: attribution.country,
      province: attribution.province,
      city: attribution.city
    };

    let { error } = await supabase.from('analytics_events').insert(eventPayload);

    if (error) {
      // Se der erro de coluna inexistente (código 42703), retenta apenas com as colunas legadas e novas no metadata
      if (error.code === '42703' || error.message?.includes('column')) {
        const fallbackPayload = {
          event_name: eventName,
          session_id: sessionId,
          user_id: userId,
          product_id: productId,
          page: page,
          metadata: eventPayload.metadata,
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.utm_campaign,
          utm_content: attribution.utm_content,
          utm_term: attribution.utm_term
        };
        const { error: fallbackError } = await supabase.from('analytics_events').insert(fallbackPayload);
        error = fallbackError;
      }
    }

    if (error) {
      console.debug('[Analytics DB] Não foi possível persistir evento:', error.message);
    } else {
      console.log(`[Analytics DB] Evento persistido no banco: ${eventName}`);
    }

    // Sincronização automática das UTMs e Atribuição com a tabela 'profiles' do cliente
    if (userId && !localStorage.getItem(`ifooty_profile_synced_${userId}`)) {
      localStorage.setItem(`ifooty_profile_synced_${userId}`, 'true');
      const profileData = {
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        session_id: sessionId,
        fbclid: attribution.fbclid,
        gclid: attribution.gclid,
        referrer: attribution.referrer,
        landing_page: attribution.landing_page
      };

      supabase.from('profiles').update(profileData).eq('id', userId)
        .then(({ error: profileErr }) => {
          if (profileErr) {
            // Caso falhe por falta de colunas estruturadas, sincroniza o mínimo compatível
            if (profileErr.code === '42703') {
              supabase.from('profiles').update({ session_id: sessionId }).eq('id', userId).catch(() => {});
            }
            console.debug('[Attribution Profile Sync] Failed:', profileErr.message);
          }
        })
        .catch(err => console.debug('[Attribution Profile Sync] Error:', err));
    }
  } catch (dbErr) {
    console.debug('[Analytics DB] Falha silenciosa:', dbErr);
  }
}

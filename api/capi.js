// api/capi.js
import axios from 'axios';
import crypto from 'crypto';

// Auxiliares de Hashing SHA-256 em conformidade com as regras da Meta
function sha256(val) {
  if (!val) return undefined;
  const clean = val.toString().trim().toLowerCase();
  return crypto.createHash('sha256').update(clean).digest('hex');
}

function sha256Phone(val) {
  if (!val) return undefined;
  // Remove todos os caracteres não numéricos
  const clean = val.toString().replace(/\D/g, '');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pixelId = (process.env.VITE_META_PIXEL_ID || process.env.META_PIXEL_ID || '').trim();
  const accessToken = (process.env.META_ACCESS_TOKEN || '').trim();

  // Se a configuração estiver ausente, silencia e retorna sucesso para evitar erros no console do cliente
  if (!pixelId || !accessToken) {
    console.warn('[CAPI Backend] Meta Pixel ID ou Access Token ausente. Ignorando disparo de CAPI.');
    return res.status(200).json({ success: true, message: 'Meta configuration missing' });
  }

  const { eventName, eventId, customData = {}, userData = {} } = req.body;

  if (!eventName || !eventId) {
    return res.status(400).json({ error: 'Missing eventName or eventId' });
  }

  // 1. Extrair e resolver o IP do cliente
  let clientIp = '';
  if (req.headers['x-forwarded-for']) {
    clientIp = req.headers['x-forwarded-for'].split(',')[0].trim();
  } else {
    clientIp = req.socket.remoteAddress || '';
  }

  // 2. Extrair o User Agent do cliente
  const clientUserAgent = userData.client_user_agent || req.headers['user-agent'] || '';

  // 3. Preparar dados criptografados do usuário (User Data)
  const hashedUserData = {
    client_ip_address: clientIp,
    client_user_agent: clientUserAgent,
  };

  if (userData.email) {
    hashedUserData.em = [sha256(userData.email)];
  }
  if (userData.phone) {
    hashedUserData.ph = [sha256Phone(userData.phone)];
  }
  if (userData.firstName) {
    hashedUserData.fn = [sha256(userData.firstName)];
  }
  if (userData.lastName) {
    hashedUserData.ln = [sha256(userData.lastName)];
  }

  // 4. Preparar payload oficial do Meta Conversions API
  const capiPayload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source: 'web',
        event_id: eventId,
        action_source: 'website',
        user_data: hashedUserData,
        custom_data: {
          value: customData.value || undefined,
          currency: customData.currency || 'CAD',
          content_name: customData.content_name || undefined,
          content_category: customData.content_category || undefined,
          content_ids: customData.content_ids || undefined,
          content_type: customData.content_type || undefined,
        },
      },
    ],
  };

  try {
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await axios.post(url, capiPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[CAPI Backend] Evento ${eventName} enviado com sucesso para Meta. ID:`, response.data.fb_trace_id);
    return res.status(200).json({ success: true, trace_id: response.data.fb_trace_id });
  } catch (error) {
    console.error(
      '[CAPI Backend] Erro ao enviar evento para Meta CAPI:',
      error.response?.data || error.message
    );
    // Retorna 200/sucesso mitigado para não quebrar a jornada do usuário no checkout
    return res.status(200).json({
      success: false,
      error: 'Failed to send event to Meta CAPI',
      details: error.response?.data || error.message,
    });
  }
}

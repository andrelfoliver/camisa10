// ─── JornadaCliente.jsx ────────────────────────────────────────────────────────
// Ferramenta de diagnóstico de conversão do iFooty
// Identifica onde clientes desistiram, motivo provável e oportunidades de conversão
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { Search, RefreshCw, ChevronDown, ChevronRight, X, TrendingUp, TrendingDown, Clock, ShoppingCart, Eye, DollarSign, Users, AlertCircle, CheckCircle, Zap } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const ADMIN_PATHS = ['/admin', '/rebrand/admin', '/configuracoes', '/dashboard', 'admin'];
const isAdminPath = (p) => p && ADMIN_PATHS.some(a => p.includes(a));

const FUNNEL_ORDER = ['pageview', 'viewcontent', 'addtocart', 'initiatecheckout', 'purchase'];
const FUNNEL_LABELS = {
  pageview: 'Home/Navegação',
  viewcontent: 'Produto',
  addtocart: 'Carrinho',
  initiatecheckout: 'Checkout',
  purchase: 'Compra'
};

// ─── Calgary time formatter ────────────────────────────────────────────────────
function fmtCalgary(isoStr) {
  if (!isoStr) return '';
  const norm = /[Zz]|[+-]\d{2}:?\d{2}$/.test(isoStr) ? isoStr : isoStr + 'Z';
  const ms = new Date(norm).getTime();
  if (isNaN(ms)) return '';
  const d = new Date(ms - 6 * 3600000);
  return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
}

function fmtDuration(seconds) {
  if (!seconds || seconds < 0) return '< 1s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return s > 0 ? `${m}m${s}s` : `${m}min`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60}min`;
}

function fmtPage(p) {
  if (!p) return 'Home';
  return p.replace(/^\//, '').replace(/\/produto\//, 'produto: ').replace(/\/colecao\//, 'cat: ').replace(/\/product\//, 'produto: ') || 'Home';
}

// ─── Source detection ──────────────────────────────────────────────────────────
function detectSource(s) {
  if (s.gclid) return { label: 'Google Ads', color: '#4285F4', bg: 'rgba(66,133,244,0.15)', icon: '🔵' };
  if (s.fbclid) return { label: 'Meta Ads', color: '#1877F2', bg: 'rgba(24,119,242,0.15)', icon: '🟦' };
  const src = (s.utm_source || '').toLowerCase();
  const med = (s.utm_medium || '').toLowerCase();
  const ref = (s.referrer || '').toLowerCase();
  if (src.includes('instagram') || ref.includes('instagram')) return { label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.15)', icon: '📸' };
  if (src.includes('facebook') || src.includes('fb') || ref.includes('facebook')) return { label: 'Facebook', color: '#1877F2', bg: 'rgba(24,119,242,0.15)', icon: '📘' };
  if (src.includes('google') || ref.includes('google')) return { label: 'Google', color: '#4285F4', bg: 'rgba(66,133,244,0.15)', icon: '🔍' };
  if (src.includes('email') || med.includes('email')) return { label: 'Email', color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: '📧' };
  if (src.includes('tiktok') || ref.includes('tiktok')) return { label: 'TikTok', color: '#FF0050', bg: 'rgba(255,0,80,0.15)', icon: '🎵' };
  if (src.includes('twitter') || src.includes('x.com') || ref.includes('x.com')) return { label: 'Twitter/X', color: '#1DA1F2', bg: 'rgba(29,161,242,0.15)', icon: '🐦' };
  if (src) return { label: src, color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', icon: '🔗' };
  if (ref && !ref.includes('ifooty')) {
    const domain = ref.replace(/https?:\/\//, '').split('/')[0].replace('www.', '');
    return { label: domain, color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', icon: '🔗' };
  }
  return { label: 'Direto', color: '#6B7280', bg: 'rgba(107,114,128,0.15)', icon: '⬇️' };
}

// ─── Status calculation ────────────────────────────────────────────────────────
function calcStatus(eventNames, lastEventTime, cartValue) {
  const now = Date.now();
  const lastMs = new Date(lastEventTime).getTime();
  const isRecent = !isNaN(lastMs) && (now - lastMs) < 5 * 60 * 1000;

  if (eventNames.has('purchase')) return { label: 'Comprou', icon: '🟢', color: '#22C55E', bg: 'rgba(34,197,94,0.15)', priority: 5 };
  if (isRecent) return { label: 'Navegando Agora', icon: '🟡', color: '#EAB308', bg: 'rgba(234,179,8,0.15)', priority: 4 };
  if (eventNames.has('initiatecheckout')) return { label: 'Abandonou no Checkout', icon: '🔴', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', priority: 3 };
  if (eventNames.has('addtocart')) return { label: 'Abandonou no Carrinho', icon: '🟠', color: '#F97316', bg: 'rgba(249,115,22,0.15)', priority: 3 };
  if (eventNames.has('viewcontent')) return { label: 'Visualizou Produto', icon: '🟠', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', priority: 2 };
  return { label: 'Abandonou na Home', icon: '🔴', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', priority: 1 };
}

// ─── Bottleneck calculation ────────────────────────────────────────────────────
function calcBottleneck(eventNames) {
  if (eventNames.has('purchase')) return null;
  if (eventNames.has('initiatecheckout')) return 'Pagamento';
  if (eventNames.has('addtocart')) return 'Checkout';
  if (eventNames.has('viewcontent')) return 'Carrinho';
  return 'Produto';
}

// ─── Probable reason ───────────────────────────────────────────────────────────
function calcReason(eventNames, duration, productDuration) {
  if (eventNames.has('purchase')) return null;
  if (duration < 30 && !eventNames.has('viewcontent')) return 'Landing page não converteu — tempo muito curto';
  if (eventNames.has('viewcontent') && !eventNames.has('addtocart')) {
    if (productDuration > 180) return 'Cliente comparando preços — tempo longo no produto';
    return 'Produto não converteu — sem adição ao carrinho';
  }
  if (eventNames.has('addtocart') && !eventNames.has('initiatecheckout')) return 'Possível dúvida sobre preço ou frete';
  if (eventNames.has('initiatecheckout') && !eventNames.has('purchase')) return 'Possível problema no método de pagamento';
  return 'Abandono sem causa identificada';
}

// ─── Smart summary ─────────────────────────────────────────────────────────────
function buildSummary(sess) {
  const { source, eventNames, productViews, cartAdds, hasCheckout, hasPurchase, duration, cartValue, bottleneck } = sess;
  const srcLabel = source.label;
  let parts = [];
  parts.push(`Visitante chegou através de ${srcLabel}.`);
  if (productViews > 0) parts.push(`Visualizou ${productViews} produto${productViews > 1 ? 's' : ''}.`);
  if (cartAdds > 0) parts.push(`Adicionou ${cartAdds} item${cartAdds > 1 ? 'ns' : ''} ao carrinho.`);
  if (hasCheckout) parts.push('Iniciou o checkout.');
  parts.push(`Permaneceu ${fmtDuration(duration)} no site.`);
  if (hasPurchase) {
    parts.push('Compra concluída com sucesso. ✅');
  } else {
    if (cartValue > 0) parts.push(`Valor potencial perdido: CAD $${cartValue.toFixed(2)}.`);
    if (bottleneck) parts.push(`Gargalo identificado: ${bottleneck}.`);
  }
  return parts.join(' ');
}

// ─── Session processor ─────────────────────────────────────────────────────────
function processSession(sessionId, events, userMap) {
  if (!events || events.length === 0) return null;
  const sorted = [...events].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const firstMs = new Date(first.created_at).getTime();
  const lastMs = new Date(last.created_at).getTime();
  const duration = isNaN(firstMs) || isNaN(lastMs) ? 0 : (lastMs - firstMs) / 1000;

  // Attribution (from any event that has it)
  const attrEvent = sorted.find(e => e.utm_source || e.fbclid || e.gclid) || first;
  const sessionAttrs = {
    utm_source: attrEvent.utm_source,
    utm_medium: attrEvent.utm_medium,
    utm_campaign: attrEvent.utm_campaign,
    utm_content: attrEvent.utm_content,
    utm_term: attrEvent.utm_term,
    fbclid: attrEvent.fbclid,
    gclid: attrEvent.gclid,
    referrer: attrEvent.referrer || attrEvent.metadata?.referrer,
    landing_page: attrEvent.landing_page || attrEvent.first_page || attrEvent.metadata?.landing_page,
    device: attrEvent.device || attrEvent.metadata?.device,
    browser: attrEvent.browser || attrEvent.metadata?.browser,
    country: attrEvent.country || attrEvent.metadata?.country,
    province: attrEvent.province || attrEvent.metadata?.province,
    city: attrEvent.city || attrEvent.metadata?.city,
  };

  const eventNames = new Set(sorted.map(e => (e.event_name || '').toLowerCase()));
  const userId = sorted.find(e => e.user_id)?.user_id || null;
  const userName = userId && userMap[userId] ? userMap[userId] : null;

  // Detect if admin session (if 50% or more is admin paths)
  const adminCount = sorted.filter(e => isAdminPath(e.page || e.metadata?.path || '')).length;
  const isAdminSession = adminCount > sorted.length * 0.5;

  // Pages and products
  const pageSet = new Set();
  const productNames = [];
  let cartValue = 0;
  let cartAdds = 0;
  let productViews = 0;

  // Time on product pages
  let productDuration = 0;
  let productStart = null;

  sorted.forEach((e, i) => {
    const pg = e.page || e.metadata?.path || '';
    if (pg && !isAdminPath(pg)) pageSet.add(pg);
    const name = (e.event_name || '').toLowerCase();
    if (name === 'viewcontent') {
      productViews++;
      const pname = e.metadata?.content_name || e.metadata?.name || '';
      if (pname && !productNames.includes(pname)) productNames.push(pname);
      productStart = new Date(e.created_at).getTime();
    }
    if (name === 'addtocart') {
      cartAdds++;
      const val = parseFloat(e.metadata?.value) || parseFloat(e.metadata?.price) || 0;
      cartValue += val;
      if (productStart) {
        productDuration += (new Date(e.created_at).getTime() - productStart) / 1000;
        productStart = null;
      }
    }
  });

  const source = detectSource(sessionAttrs);
  const status = calcStatus(eventNames, last.created_at, cartValue);
  const bottleneck = calcBottleneck(eventNames);
  const hasCheckout = eventNames.has('initiatecheckout');
  const hasPurchase = eventNames.has('purchase');
  const reason = calcReason(eventNames, duration, productDuration);

  const sess = {
    session_id: sessionId,
    userId,
    userName,
    isAdminSession,
    duration,
    source,
    status,
    bottleneck,
    reason,
    pageCount: pageSet.size,
    productViews,
    cartAdds,
    cartValue,
    hasCheckout,
    hasPurchase,
    productNames,
    eventNames,
    eventCount: sorted.length,
    firstEvent: first.created_at,
    lastEvent: last.created_at,
    ...sessionAttrs,
    events: sorted,
  };

  sess.summary = buildSummary(sess);
  return sess;
}

// ─── Event color ───────────────────────────────────────────────────────────────
function eventColor(name) {
  const n = (name || '').toLowerCase();
  if (n === 'pageview') return '#60A5FA';
  if (n === 'viewcontent') return '#A78BFA';
  if (n === 'addtocart') return '#FBBF24';
  if (n === 'initiatecheckout') return '#FB923C';
  if (n === 'purchase') return '#4ADE80';
  return '#6B7280';
}

function eventIcon(name) {
  const n = (name || '').toLowerCase();
  if (n === 'pageview') return '👁️';
  if (n === 'viewcontent') return '👕';
  if (n === 'addtocart') return '🛒';
  if (n === 'initiatecheckout') return '💳';
  if (n === 'purchase') return '✅';
  if (n === 'selecionou tamanho') return '📐';
  if (n === 'selecionou quantidade') return '🔢';
  return '•';
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: '#1A1D20', border: '1px solid #2A2D31', borderRadius: 12,
    padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6B7280', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: color || '#fff', lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{sub}</div>}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const JornadaCliente = ({ showToast }) => {
  const [period, setPeriod] = useState('1');
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState([]);
  const [adminSessions, setAdminSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState('clientes'); // 'clientes' | 'admin'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'cartValue' | 'duration'
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setSelectedSession(null);

    // Compute since date in Calgary midnight
    let sinceStr;
    if (period === '1') {
      const now = new Date();
      const calgaryMidnight = new Date(
        now.toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' }) + 'T00:00:00-06:00'
      );
      sinceStr = calgaryMidnight.toISOString();
    } else {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(period));
      sinceStr = since.toISOString();
    }

    // Fetch events
    const { data: evts, error } = await supabase
      .from('analytics_events')
      .select('event_name, session_id, page, metadata, user_id, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid, landing_page, referrer, first_page, device, browser, country, province, city, product_id')
      .gte('created_at', sinceStr)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      console.error('[JornadaCliente] Error loading data:', error);
      setLoading(false);
      return;
    }

    // Group by session
    const sessionMap = {};
    (evts || []).forEach(e => {
      if (!e.session_id) return;
      if (!sessionMap[e.session_id]) sessionMap[e.session_id] = [];
      sessionMap[e.session_id].push(e);
    });

    // Fetch user profiles
    const userIds = [...new Set(Object.values(sessionMap).flatMap(evs => evs.map(e => e.user_id).filter(Boolean)))];
    let userMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      if (profiles) profiles.forEach(p => { userMap[p.id] = p.full_name || p.email; });
    }

    // Process sessions
    const processed = Object.entries(sessionMap)
      .map(([sid, evs]) => processSession(sid, evs, userMap))
      .filter(Boolean);

    const clientSessions = processed.filter(s => !s.isAdminSession);
    const adminSess = processed.filter(s => s.isAdminSession);

    setSessions(clientSessions);
    setAdminSessions(adminSess);
    setLastRefresh(new Date());
    setLoading(false);
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtered + sorted sessions ───────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    let list = [...sessions];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.userName || '').toLowerCase().includes(q) ||
        (s.session_id || '').toLowerCase().includes(q) ||
        (s.utm_campaign || '').toLowerCase().includes(q) ||
        (s.source?.label || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.province || '').toLowerCase().includes(q) ||
        (s.status?.label || '').toLowerCase().includes(q) ||
        s.productNames.some(p => p.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'recent') list.sort((a, b) => new Date(b.lastEvent) - new Date(a.lastEvent));
    if (sortBy === 'cartValue') list.sort((a, b) => b.cartValue - a.cartValue);
    if (sortBy === 'duration') list.sort((a, b) => b.duration - a.duration);
    return list;
  }, [sessions, search, sortBy]);

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = sessions.length;
    const purchases = sessions.filter(s => s.hasPurchase).length;
    const abandoned = sessions.filter(s => !s.hasPurchase && s.eventNames.has('addtocart')).length;
    const totalCartValue = sessions.filter(s => !s.hasPurchase).reduce((a, s) => a + s.cartValue, 0);
    const avgDuration = total > 0 ? sessions.reduce((a, s) => a + s.duration, 0) / total : 0;
    const avgCart = abandoned > 0 ? sessions.filter(s => !s.hasPurchase && s.cartValue > 0).reduce((a, s) => a + s.cartValue, 0) / Math.max(1, sessions.filter(s => !s.hasPurchase && s.cartValue > 0).length) : 0;
    const convRate = total > 0 ? ((purchases / total) * 100).toFixed(1) : '0.0';

    // Biggest bottleneck
    const bottleneckCount = {};
    sessions.forEach(s => {
      if (s.bottleneck) bottleneckCount[s.bottleneck] = (bottleneckCount[s.bottleneck] || 0) + 1;
    });
    const topBottleneck = Object.entries(bottleneckCount).sort((a, b) => b[1] - a[1])[0];

    return { total, purchases, abandoned, totalCartValue, avgDuration, avgCart, convRate, topBottleneck };
  }, [sessions]);

  // ─── Insights ─────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const result = [];
    if (sessions.length === 0) return result;

    // Checkout abandonment rate
    const withCheckout = sessions.filter(s => s.hasCheckout).length;
    const checkoutAbandoned = sessions.filter(s => s.hasCheckout && !s.hasPurchase).length;
    if (withCheckout > 0 && checkoutAbandoned / withCheckout > 0.5) {
      result.push({ icon: '🚨', text: `Alta taxa de abandono no checkout: ${Math.round(checkoutAbandoned / withCheckout * 100)}% das sessões que chegaram ao checkout não converteram.`, color: '#EF4444' });
    }

    // Most viewed product without purchase
    const productPurchase = {};
    const productViewed = {};
    sessions.forEach(s => {
      s.productNames.forEach(p => {
        productViewed[p] = (productViewed[p] || 0) + 1;
        if (s.hasPurchase) productPurchase[p] = (productPurchase[p] || 0) + 1;
      });
    });
    const topProductViewed = Object.entries(productViewed).sort((a, b) => b[1] - a[1])[0];
    if (topProductViewed && topProductViewed[1] >= 3) {
      const buys = productPurchase[topProductViewed[0]] || 0;
      const viewConv = Math.round(buys / topProductViewed[1] * 100);
      if (viewConv < 20) {
        result.push({ icon: '👕', text: `"${topProductViewed[0]}" recebe ${topProductViewed[1]} visitas mas tem apenas ${viewConv}% de conversão — considere otimizar a página.`, color: '#FBBF24' });
      }
    }

    // Source comparison
    const sourceSessions = {};
    sessions.forEach(s => {
      const src = s.source.label;
      if (!sourceSessions[src]) sourceSessions[src] = { total: 0, purchases: 0 };
      sourceSessions[src].total++;
      if (s.hasPurchase) sourceSessions[src].purchases++;
    });
    const sourceConv = Object.entries(sourceSessions)
      .filter(([, v]) => v.total >= 3)
      .map(([src, v]) => ({ src, rate: v.purchases / v.total }))
      .sort((a, b) => b.rate - a.rate);
    if (sourceConv.length >= 2) {
      const best = sourceConv[0];
      const worst = sourceConv[sourceConv.length - 1];
      if (best.rate > worst.rate * 1.5) {
        result.push({ icon: '📊', text: `${best.src} converte ${Math.round(best.rate * 100)}% vs ${worst.src} com ${Math.round(worst.rate * 100)}% — concentre budget em ${best.src}.`, color: '#60A5FA' });
      }
    }

    // Mobile vs Desktop
    const mobileAbandon = sessions.filter(s => (s.device || '').toLowerCase().includes('mobile') && !s.hasPurchase).length;
    const mobileTotal = sessions.filter(s => (s.device || '').toLowerCase().includes('mobile')).length;
    if (mobileTotal > 5 && mobileAbandon / mobileTotal > 0.85) {
      result.push({ icon: '📱', text: `${Math.round(mobileAbandon / mobileTotal * 100)}% dos usuários mobile abandonam sem comprar — verifique a experiência mobile.`, color: '#F97316' });
    }

    // Lost revenue
    if (kpis.totalCartValue > 0) {
      result.push({ icon: '💰', text: `CAD $${kpis.totalCartValue.toFixed(2)} em valor potencial perdido neste período — ${kpis.abandoned} sessão(ões) com carrinho abandonado.`, color: '#4ADE80' });
    }

    return result.slice(0, 5);
  }, [sessions, kpis]);

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    container: { color: '#fff', fontFamily: "'Inter', sans-serif" },
    card: { background: '#1A1D20', border: '1px solid #2A2D31', borderRadius: 12, padding: '1.25rem' },
    title: { fontWeight: 700, fontSize: '0.85rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' },
    btn: (active) => ({
      background: active ? '#D6FF00' : 'transparent',
      color: active ? '#000' : '#9CA3AF',
      border: active ? 'none' : '1px solid #2A2D31',
      borderRadius: 8, padding: '0.4rem 0.9rem',
      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
    }),
    sessionCard: (selected) => ({
      background: selected ? '#2A2D31' : '#1A1D20',
      border: selected ? '1px solid #D6FF00' : '1px solid #2A2D31',
      borderRadius: 10, padding: '1rem',
      cursor: 'pointer', transition: 'all 0.15s',
      marginBottom: '0.5rem'
    }),
    badge: (color, bg) => ({
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      background: bg, color, borderRadius: 20,
      padding: '0.2rem 0.65rem', fontSize: '0.7rem', fontWeight: 700,
      whiteSpace: 'nowrap'
    }),
    input: {
      background: '#1A1D20', border: '1px solid #2A2D31', borderRadius: 8,
      color: '#fff', padding: '0.55rem 0.9rem 0.55rem 2.25rem',
      fontSize: '0.85rem', outline: 'none', width: '100%', boxSizing: 'border-box',
      fontFamily: 'inherit'
    },
  };

  // ─── Session Detail Panel ──────────────────────────────────────────────────
  const SessionDetail = ({ sess }) => {
    if (!sess) return null;
    const evts = sess.events || [];

    // Time between events
    const evtsWithDelta = evts.map((e, i) => {
      if (i === 0) return { ...e, delta: null };
      const prev = evts[i - 1];
      const delta = (new Date(e.created_at) - new Date(prev.created_at)) / 1000;
      return { ...e, delta };
    });

    return (
      <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '85vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: '0.3rem' }}>
              {sess.userName ? `👤 ${sess.userName}` : '🕶️ Visitante Anônimo'}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={S.badge(sess.status.color, sess.status.bg)}>{sess.status.icon} {sess.status.label}</span>
              <span style={S.badge(sess.source.color, sess.source.bg)}>{sess.source.icon} {sess.source.label}</span>
              {sess.utm_campaign && <span style={S.badge('#A78BFA', 'rgba(167,139,250,0.15)')}>📣 {sess.utm_campaign}</span>}
            </div>
          </div>
          <button onClick={() => setSelectedSession(null)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0 0 1rem' }}>×</button>
        </div>

        {/* Smart summary */}
        <div style={{ background: 'rgba(214,255,0,0.05)', border: '1px solid rgba(214,255,0,0.15)', borderRadius: 8, padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D6FF00', textTransform: 'uppercase', marginBottom: '0.4rem' }}>💡 Resumo Inteligente</div>
          <div style={{ fontSize: '0.83rem', color: '#D1D5DB', lineHeight: 1.6 }}>{sess.summary}</div>
        </div>

        {/* Probable reason */}
        {sess.reason && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', marginBottom: '0.3rem' }}>⚠️ Motivo Provável</div>
            <div style={{ fontSize: '0.82rem', color: '#FCA5A5' }}>{sess.reason}</div>
          </div>
        )}

        {/* Metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {[
            { label: 'Duração', value: fmtDuration(sess.duration) },
            { label: 'Páginas', value: sess.pageCount },
            { label: 'Produtos', value: sess.productViews },
            { label: 'Valor', value: sess.cartValue > 0 ? `$${sess.cartValue.toFixed(2)}` : '—', color: sess.cartValue > 0 ? '#4ADE80' : '#6B7280' },
          ].map(m => (
            <div key={m.label} style={{ background: '#121416', borderRadius: 8, padding: '0.6rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: m.color || '#fff' }}>{m.value}</div>
              <div style={{ fontSize: '0.65rem', color: '#6B7280', marginTop: '0.1rem' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Lost value highlight */}
        {sess.cartValue > 0 && !sess.hasPurchase && (
          <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 8, padding: '0.75rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>💸 Valor Potencial Perdido</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FCD34D' }}>CAD ${sess.cartValue.toFixed(2)}</div>
            {sess.productNames.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                {sess.productNames.slice(0, 2).join(' · ')}
              </div>
            )}
          </div>
        )}

        {/* Attribution */}
        <div>
          <div style={S.title}>🗺️ Atribuição</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
            {[
              ['Origem', sess.source.label],
              ['Mídia', sess.utm_medium],
              ['Campanha', sess.utm_campaign],
              ['Conjunto', sess.utm_content],
              ['Landing Page', fmtPage(sess.landing_page)],
              ['Referrer', sess.referrer ? sess.referrer.replace(/https?:\/\//, '').split('/')[0] : null],
              ['Dispositivo', sess.device],
              ['Localização', [sess.city, sess.province].filter(Boolean).join(', ')],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ background: '#121416', borderRadius: 6, padding: '0.4rem 0.65rem' }}>
                <div style={{ fontSize: '0.62rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontSize: '0.78rem', color: '#D1D5DB', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel visual */}
        {sess.bottleneck && (
          <div>
            <div style={S.title}>⚡ Gargalo Identificado</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
              {FUNNEL_ORDER.map((stage, i) => {
                const completed = sess.eventNames.has(stage);
                const isGap = !completed && FUNNEL_ORDER.slice(0, i).every(s => sess.eventNames.has(s));
                return (
                  <React.Fragment key={stage}>
                    {i > 0 && <span style={{ color: '#374151', fontSize: '0.8rem' }}>→</span>}
                    <span style={{
                      padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                      background: completed ? 'rgba(34,197,94,0.15)' : isGap ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
                      color: completed ? '#4ADE80' : isGap ? '#F87171' : '#4B5563',
                      border: isGap ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent'
                    }}>
                      {isGap && '🔴 '}{FUNNEL_LABELS[stage]}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#F87171', fontWeight: 600 }}>
              Gargalo: <strong>{sess.bottleneck}</strong>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div style={S.title}>📍 Jornada da Sessão ({evts.length} eventos)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {evtsWithDelta.map((e, i) => {
              const pg = e.page || e.metadata?.path || '';
              const color = eventColor(e.event_name);
              return (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {/* Timeline line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
                    {i < evtsWithDelta.length - 1 && <div style={{ width: 1, flex: 1, background: '#2A2D31', minHeight: 20, marginTop: 2 }} />}
                  </div>
                  {/* Content */}
                  <div style={{ paddingBottom: i < evtsWithDelta.length - 1 ? '0.6rem' : 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ color, fontSize: '0.78rem', fontWeight: 700 }}>{eventIcon(e.event_name)} {e.event_name}</span>
                        {e.metadata?.content_name && (
                          <div style={{ color: '#9CA3AF', fontSize: '0.7rem', marginTop: '0.1rem' }}>👕 {e.metadata.content_name}</div>
                        )}
                        {!e.metadata?.content_name && pg && (
                          <div style={{ color: '#6B7280', fontSize: '0.7rem', marginTop: '0.1rem' }}>{fmtPage(pg)}</div>
                        )}
                        {e.metadata?.value > 0 && (
                          <div style={{ color: '#4ADE80', fontSize: '0.7rem' }}>CAD ${parseFloat(e.metadata.value).toFixed(2)}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.5rem' }}>
                        <div style={{ color: '#4B5563', fontSize: '0.68rem' }}>{fmtCalgary(e.created_at)}</div>
                        {e.delta !== null && e.delta > 0 && (
                          <div style={{ color: '#374151', fontSize: '0.65rem' }}>+{fmtDuration(e.delta)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Session Card ──────────────────────────────────────────────────────────
  const SessionCard = ({ sess }) => {
    const isSelected = selectedSession?.session_id === sess.session_id;
    return (
      <div
        onClick={() => setSelectedSession(isSelected ? null : sess)}
        style={S.sessionCard(isSelected)}
      >
        {/* Row 1: Name + Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: sess.userName ? '#60A5FA' : '#D1D5DB', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>{sess.userName ? '👤' : '🕶️'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sess.userName || 'Visitante Anônimo'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#6B7280', marginTop: '0.1rem' }}>
              {fmtCalgary(sess.lastEvent)} · {fmtDuration(sess.duration)}
            </div>
          </div>
          <span style={S.badge(sess.status.color, sess.status.bg)}>
            {sess.status.icon} {sess.status.label}
          </span>
        </div>

        {/* Row 2: Source + Campaign */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <span style={S.badge(sess.source.color, sess.source.bg)}>{sess.source.icon} {sess.source.label}</span>
          {sess.utm_campaign && (
            <span style={S.badge('#A78BFA', 'rgba(167,139,250,0.15)')}>📣 {sess.utm_campaign.slice(0, 20)}</span>
          )}
          {sess.city && <span style={S.badge('#6B7280', 'rgba(107,114,128,0.1)')}>📍 {sess.city}</span>}
        </div>

        {/* Row 3: Metrics */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#9CA3AF' }}>
          <span>📄 {sess.pageCount} pgs</span>
          <span>👕 {sess.productViews} prod</span>
          {sess.cartValue > 0 && (
            <span style={{ color: sess.hasPurchase ? '#4ADE80' : '#FBBF24', fontWeight: 700 }}>
              🛒 ${sess.cartValue.toFixed(2)}
            </span>
          )}
          {sess.bottleneck && !sess.hasPurchase && (
            <span style={{ color: '#F87171' }}>⚡ {sess.bottleneck}</span>
          )}
        </div>

        {/* Landing page */}
        {sess.landing_page && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🔗 {fmtPage(sess.landing_page)}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.container}>
      <style>{`
        .jc-tab { cursor: pointer; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; transition: all 0.15s; border: none; }
        .jc-tab:hover { background: rgba(255,255,255,0.05); }
        .jc-search-wrap { position: relative; }
        .jc-search-wrap svg { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .jc-session-list { overflow-y: auto; max-height: 70vh; padding-right: 2px; }
        .jc-session-list::-webkit-scrollbar { width: 4px; }
        .jc-session-list::-webkit-scrollbar-track { background: transparent; }
        .jc-session-list::-webkit-scrollbar-thumb { background: #2A2D31; border-radius: 4px; }
      `}</style>

      {/* ── Period selector + refresh ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[['1', 'Hoje'], ['7', '7 dias'], ['30', '30 dias']].map(([v, l]) => (
            <button key={v} style={S.btn(period === v)} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {lastRefresh && <span style={{ fontSize: '0.7rem', color: '#4B5563' }}>atualizado {fmtCalgary(lastRefresh.toISOString())}</span>}
          <button onClick={loadData} disabled={loading} style={{ ...S.btn(false), display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* ── KPI Dashboard ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <KpiCard label="Sessões" value={kpis.total} icon={<Users size={12}/>} color="#60A5FA" />
        <KpiCard label="Compras" value={kpis.purchases} icon={<CheckCircle size={12}/>} color="#4ADE80" />
        <KpiCard label="Taxa Conversão" value={`${kpis.convRate}%`} icon={<TrendingUp size={12}/>} color={kpis.convRate > 2 ? '#4ADE80' : '#EF4444'} />
        <KpiCard label="Valor Perdido" value={kpis.totalCartValue > 0 ? `$${kpis.totalCartValue.toFixed(0)}` : '—'} icon={<DollarSign size={12}/>} color="#FBBF24" sub="CAD" />
        <KpiCard label="Tempo Médio" value={fmtDuration(kpis.avgDuration)} icon={<Clock size={12}/>} />
        <KpiCard label="Carrinho Médio" value={kpis.avgCart > 0 ? `$${kpis.avgCart.toFixed(0)}` : '—'} icon={<ShoppingCart size={12}/>} sub="CAD" />
        <KpiCard label="Maior Gargalo" value={kpis.topBottleneck ? kpis.topBottleneck[0] : '—'} icon={<AlertCircle size={12}/>} color="#F97316" sub={kpis.topBottleneck ? `${kpis.topBottleneck[1]} sessões` : null} />
        <KpiCard label="Carrinhos Abnd." value={kpis.abandoned} icon={<TrendingDown size={12}/>} color="#F97316" />
      </div>

      {/* ── Insights ── */}
      {insights.length > 0 && (
        <div style={{ ...S.card, marginBottom: '1.25rem' }}>
          <div style={S.title}>⚡ Insights Automáticos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', background: '#121416', borderRadius: 8, borderLeft: `3px solid ${ins.color}` }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ins.icon}</span>
                <span style={{ fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.5 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs: Clientes / Admin ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #2A2D31', paddingBottom: '0.75rem' }}>
        <button
          className="jc-tab"
          style={{ background: activeTab === 'clientes' ? '#D6FF00' : 'transparent', color: activeTab === 'clientes' ? '#000' : '#9CA3AF' }}
          onClick={() => { setActiveTab('clientes'); setSelectedSession(null); }}
        >
          👥 Clientes ({sessions.length})
        </button>
        <button
          className="jc-tab"
          style={{ background: activeTab === 'admin' ? '#374151' : 'transparent', color: activeTab === 'admin' ? '#fff' : '#4B5563' }}
          onClick={() => { setActiveTab('admin'); setSelectedSession(null); }}
        >
          🔧 Logs Admin ({adminSessions.length})
        </button>
      </div>

      {activeTab === 'clientes' && (
        <>
          {/* Search + Sort */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="jc-search-wrap" style={{ flex: 1, minWidth: 200 }}>
              <Search size={14} color="#6B7280" />
              <input
                style={S.input}
                placeholder="Buscar por nome, produto, campanha, cidade, status..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: '#1A1D20', border: '1px solid #2A2D31', borderRadius: 8, color: '#9CA3AF', padding: '0.5rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <option value="recent">Mais recentes</option>
              <option value="cartValue">Maior valor</option>
              <option value="duration">Mais tempo</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
              <div>Carregando sessões...</div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Nenhuma sessão de cliente encontrada</div>
              <div style={{ fontSize: '0.82rem' }}>{search ? 'Tente ajustar os filtros de busca' : 'Sem dados para o período selecionado'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '1fr 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
              {/* Session list */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                  {filteredSessions.length} sessão{filteredSessions.length !== 1 ? 'ões' : ''} {search && `para "${search}"`}
                </div>
                <div className="jc-session-list">
                  {filteredSessions.map(sess => (
                    <SessionCard key={sess.session_id} sess={sess} />
                  ))}
                </div>
              </div>

              {/* Session detail */}
              {selectedSession && (
                <div style={{ position: 'sticky', top: '1rem' }}>
                  <SessionDetail sess={selectedSession} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'admin' && (
        <div>
          <div style={{ fontSize: '0.78rem', color: '#4B5563', marginBottom: '1rem' }}>
            Sessões onde a maioria dos eventos foi em rotas administrativas. Não são contabilizadas nas métricas de clientes.
          </div>
          {adminSessions.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '2rem', color: '#6B7280' }}>Nenhum log administrativo no período.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {adminSessions.map(s => (
                <div key={s.session_id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#9CA3AF', fontWeight: 600 }}>{s.userName || '🔧 Admin'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#4B5563' }}>{fmtCalgary(s.firstEvent)} – {fmtCalgary(s.lastEvent)} · {s.eventCount} eventos</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: 'monospace' }}>{s.session_id.slice(0, 12)}…</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default JornadaCliente;

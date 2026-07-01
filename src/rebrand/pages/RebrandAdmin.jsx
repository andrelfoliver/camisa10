import React, { useState, useEffect, useCallback } from 'react';
import { useRebrandAuth } from '../../context/RebrandAuthContext';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Compass, Tag, Settings,
  LogOut, ExternalLink, ChevronUp, ChevronDown, Edit2, Trash2,
  Plus, Save, X, Check, AlertCircle, TrendingUp, Users, DollarSign, Upload,
  Clock, Search, RefreshCw, Eye, EyeOff, UserCircle, Award, MessageSquare, Star,
  Shirt, CreditCard, Globe, Activity, Truck, CheckCircle2, XCircle, Menu, MapPin
} from 'lucide-react';
import ProductMedia from '../../components/ProductMedia';
import TrackingModal from '../../components/TrackingModal';
import CanadaMap, { normalizeProvince } from '../../components/CanadaMap';

// ─── Constants ───────────────────────────────────────────────────────────────
const REBRAND_ADMIN_EMAIL = 'ifootyc@gmail.com';

const NBA_TEAMS = [
  'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls',
  'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons', 'Golden State Warriors',
  'Houston Rockets', 'Indiana Pacers', 'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies',
  'Miami Heat', 'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
  'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns', 'Portland Trail Blazers',
  'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors', 'Utah Jazz', 'Washington Wizards'
];

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'orders',      label: 'Pedidos',            icon: ShoppingBag },
  { id: 'products',    label: 'Produtos',           icon: Package },
  { id: 'visual',      label: 'Visual',             icon: Compass },
  { id: 'coupons',     label: 'Cupons',             icon: Tag },
  { id: 'clientes',    label: 'Clientes',           icon: UserCircle },
  { id: 'afiliados',   label: 'Afiliados',          icon: Award },
  { id: 'conversas',   label: 'Conversas IA',       icon: MessageSquare },
  { id: 'depoimentos', label: 'Depoimentos',        icon: Star },
  { id: 'financeiro',  label: 'Financeiro',         icon: TrendingUp },
  { id: 'cidades',     label: 'Cidades Atendidas',  icon: MapPin },
  { id: 'settings',    label: 'Configurações',      icon: Settings },
];

const STATUS_COLORS = {
  pending:    { bg: 'rgba(234,179,8,0.15)',   color: '#FBBF24', label: 'Pendente' },
  paid:       { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80', label: 'Pago' },
  processing: { bg: 'rgba(249,115,22,0.15)',  color: '#FB923C', label: 'Preparando' },
  shipped:    { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA', label: 'Enviado' },
  delivered:  { bg: 'rgba(168,85,247,0.15)', color: '#C084FC', label: 'Entregue' },
  cancelled:  { bg: 'rgba(239,68,68,0.15)',  color: '#F87171', label: 'Cancelado' },
};

const getStatusNameColor = (status) => {
  if (status === 'pending') return '#FBBF24';
  if (status === 'paid') return '#4ADE80';
  return '#FFFFFF';
};

const DEFAULT_SPOTLIGHT = [
  { sport: 'Baseball', badge: '⚾ Summer Collection', title: 'BLUE JAYS JERSEYS', price: '$49.90 CAD', btnText: 'Shop MLB', link: '/rebrand/colecao/baseball', img: '/assets/rebrand/blue_jays.jpg', featuredProducts: '' },
  { sport: 'Football', badge: '🏈 NFL Collection',    title: 'CHIEFS JERSEYS',    price: '$59.90 CAD', btnText: 'Shop NFL', link: '/rebrand/colecao/football', img: '/assets/rebrand/chiefs.jpg',    featuredProducts: '' },
  { sport: 'Hockey',   badge: '🏒 NHL Collection',    title: 'MAPLE LEAFS JERSEYS',price: '$59.90 CAD', btnText: 'Shop NHL', link: '/rebrand/colecao/hockey',   img: '/assets/rebrand/maple_leafs.jpg',featuredProducts: '' },
  { sport: 'Soccer',   badge: '⚽ Club Collection',   title: 'REAL MADRID JERSEYS',price: '$49.90 CAD', btnText: 'Shop Soccer',link: '/rebrand/colecao/soccer', img: '/assets/rebrand/real_madrid.jpg',featuredProducts: '' },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  layout:       { display: 'flex', minHeight: '100vh', background: '#0B0C0E', fontFamily: "'Inter', system-ui, sans-serif", color: '#FFFFFF' },
  sidebar:      { width: '240px', flexShrink: 0, background: '#0F1012', borderRight: '1px solid #1A1D20', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 },
  main:         { marginLeft: '240px', flex: 1, padding: '2.5rem', overflowY: 'auto', minHeight: '100vh' },
  card:         { background: '#121416', border: '1px solid #1A1D20', borderRadius: '12px', padding: '1.75rem' },
  input:        { width: '100%', padding: '0.75rem 1rem', background: '#0B0C0E', color: '#fff', border: '1px solid #2A2D30', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  label:        { display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  btnPrimary:   { padding: '0.65rem 1.5rem', background: '#D6FF00', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  btnSecondary: { padding: '0.65rem 1.5rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid #2A2D30', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' },
  btnDanger:    { padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#F87171', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  btnEdit:      { padding: '0.5rem 0.75rem', background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid #1A1D20' },
  td:           { padding: '0.9rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' },
  badge:        (status) => ({ display: 'inline-block', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: (STATUS_COLORS[status] || STATUS_COLORS.pending).bg, color: (STATUS_COLORS[status] || STATUS_COLORS.pending).color }),
  sectionTitle: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0', letterSpacing: '-0.3px' },
  sectionSub:   { fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', margin: 0 },
  modal:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  modalBox:     { background: '#121416', border: '1px solid #2A2D30', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' },
};

// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, background: type === 'success' ? '#1A2E1A' : '#2E1A1A', border: `1px solid ${type === 'success' ? '#4ADE80' : '#F87171'}`, borderRadius: '8px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: type === 'success' ? '#4ADE80' : '#F87171', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
    {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
    {message}
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '0.5rem' }}><X size={14} /></button>
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, icon: Icon, color, sub, compact }) => (
  <div style={{
    background: '#121416',
    border: '1px solid #1A1D20',
    borderRadius: '12px',
    padding: compact ? '1rem 1.15rem' : '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: compact ? '0.45rem' : '1rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: compact ? '0.72rem' : '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <div style={{ width: compact ? '32px' : '38px', height: compact ? '32px' : '38px', borderRadius: compact ? '8px' : '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={compact ? 15 : 18} color={color} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: compact ? '1.5rem' : '2rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      {sub && <div style={{ fontSize: compact ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: compact ? '0.15rem' : '0.25rem' }}>{sub}</div>}
    </div>
  </div>
);

// ─── Dashboard Section ────────────────────────────────────────────────────────
const DashboardSection = ({ showValues, setShowValues }) => {
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    profit: 0,
    jerseys: 0,
    costUSD: 0,
    costCAD: 0,
    commissionCAD: 0,
    countPending: 0,
    countPaid: 0,
    countProcessing: 0,
    countShipped: 0,
    countCompleted: 0,
    countCancelled: 0,
    users: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  const [allOrders, setAllOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [pricing, setPricing] = useState({});
  const [profilesCount, setProfilesCount] = useState(0);
  
  const getInitialMonthRange = () => {
    try {
      const nowStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Edmonton',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
      const parts = nowStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      return { start: startStr, end: endStr };
    } catch (e) {
      return { start: '', end: '' };
    }
  };

  const [dateRange, setDateRange] = useState(getInitialMonthRange());
  const [timePreset, setTimePreset] = useState('month');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const getPeriodLabel = () => {
    if (timePreset === 'all') return ' (Todo o Período)';
    if (timePreset === '7d') return ' (Últimos 7 Dias)';
    if (timePreset === 'month') {
      try {
        const nowStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Edmonton',
          year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
        const monthIdx = parseInt(nowStr.split('-')[1], 10) - 1;
        const months = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return ` (${months[monthIdx]})`;
      } catch (e) {
        return '';
      }
    }
    if (timePreset === 'last_month') {
      try {
        const nowStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Edmonton',
          year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
        let monthIdx = parseInt(nowStr.split('-')[1], 10) - 2;
        if (monthIdx < 0) monthIdx += 12;
        const months = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return ` (${months[monthIdx]})`;
      } catch (e) {
        return '';
      }
    }
    if (dateRange.start && dateRange.end) {
      try {
        const sParts = dateRange.start.split('-');
        const eParts = dateRange.end.split('-');
        const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2]);
        const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2]);
        const sMonth = sDate.toLocaleDateString('pt-BR', { month: 'short' });
        const eMonth = eDate.toLocaleDateString('pt-BR', { month: 'short' });
        if (sParts[1] === eParts[1]) {
          return ` (${sDate.toLocaleDateString('pt-BR', { month: 'long' })})`;
        }
        return ` (${sMonth} - ${eMonth})`;
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ data: orders }, { data: profiles }, { data: settings }, { data: dbCoupons }] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id'),
          supabase.from('store_settings').select('*'),
          supabase.from('coupons').select('*')
        ]);

        const validOrders = orders || [];
        const couponsData = dbCoupons || [];

        const defaultPricing = {
          nameNumber: 12,
          patch: 5,
          size2XL3XL: 7,
          size4XL: 10,
          discounts: [
            { qty: 2, percent: 4 },
            { qty: 3, percent: 7 },
            { qty: 5, percent: 10 },
            { qty: 10, percent: 15 }
          ],
          shippingCost: 0,
          freeShippingThreshold: 0,
          promoBasePrice: 47.90,
          exchangeRateFallback: 1.38,
          costFan: 9.00,
          costPlayer: 15.00,
          costRetro: 15.00,
          costLongSleeve: 12.00,
          costKids: 11.00,
          costBaby: 8.00,
          costTraining: 17.00,
          costShorts: 8.00,
          costNBA: 17.00,
          costNFL: 23.00,
          costAdd2XL: 1.00,
          costAdd3XL4XL: 2.00,
          costAddPatch: 1.00,
          costAddCustom: 3.00,
          surcharge1Item: 5.00,
          surcharge2Items: 4.00,
          surcharge3Items: 3.00,
          affiliateDriveLink: ""
        };

        let pricingData = defaultPricing;
        if (settings) {
          const pricingRecord = settings.find(s => s.key === 'pricing');
          if (pricingRecord) {
            try {
              pricingData = JSON.parse(pricingRecord.value);
            } catch (e) {
              console.error("Erro parsing pricing:", e);
            }
          }
        }

        setAllOrders(validOrders);
        setCoupons(couponsData);
        setProfilesCount(profiles?.length || 0);
        setPricing(pricingData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (allOrders.length === 0) return;

    const getCalgaryDateStrOnly = (dateInput) => {
      if (!dateInput) return '';
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Edmonton',
          year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date(dateInput));
      } catch (e) {
        return '';
      }
    };

    const getValidRevenue = (order) => {
      if (order?.payment_method === 'parceria') return 0;
      const gross = Number(order?.total_price || 0);
      if (order?.payment_method === 'paypal') {
        return gross - (gross * 0.029) - 0.30;
      }
      return gross;
    };

    const getCalgaryDateStr = (dateInput) => {
      if (!dateInput) return '';
      try {
        const d = new Date(dateInput);
        return new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Edmonton',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }).format(d).replace(',', ' às');
      } catch (e) {
        return '';
      }
    };

    const getOrderCommissionBreakdown = (order) => {
      if (!order || !order.referrer || order.payment_method === 'parceria') return null;
      const rawRef = order.referrer || 'Sem Indicação';
      const coupon = coupons.find(c => c.code === rawRef.toUpperCase());
      const agentName = coupon ? (coupon.agent_id || rawRef) : rawRef;
      if (!agentName || agentName === 'Sem Indicação') return null;

      const agentOrders = allOrders.filter(o => {
        const oRef = o.referrer || 'Sem Indicação';
        const oCoupon = coupons.find(c => c.code === oRef.toUpperCase());
        const oAgent = oCoupon ? (oCoupon.agent_id || oRef) : oRef;
        return oAgent === agentName;
      });

      const agentOrdersCount = agentOrders.length;
      let rate = 0.08;
      if (agentOrdersCount >= 51) rate = 0.15;
      else if (agentOrdersCount >= 26) rate = 0.12;
      else if (agentOrdersCount >= 11) rate = 0.10;

      const base = getValidRevenue(order) * rate;
      const orderDateStr = order.created_at ? getCalgaryDateStr(order.created_at) : '';
      const isCopaPeriod = orderDateStr >= '2026-06-11' && orderDateStr <= '2026-07-19';
      const seasonal = isCopaPeriod ? getValidRevenue(order) * 0.05 : 0;

      const sortedAgentOrders = [...agentOrders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const orderRank = sortedAgentOrders.findIndex(o => o.id === order.id) + 1;

      let performance = 0;
      if (orderRank === 1) performance = 5;
      if (orderRank === 5) performance = 10;
      if (orderRank === 10) performance = 15;

      return {
        agentName,
        base,
        seasonal,
        performance,
        total: base + seasonal + performance,
        rank: orderRank
      };
    };

    const calculateOrderCommission = (order) => {
      const breakdown = getOrderCommissionBreakdown(order);
      return breakdown ? breakdown.total : 0;
    };

    const calculateItemBaseCostUSD = (item) => {
      const name = (item.name || '').toLowerCase();
      const c = pricing;
      if (name.includes('nba')) return c.costNBA || 17;
      if (name.includes('nfl')) return c.costNFL || 23;
      if (name.includes('jogador') || name.includes('player')) return c.costPlayer || 15;
      if (name.includes('retrô') || name.includes('retro')) return c.costRetro || 15;
      if (name.includes('manga longa') || name.includes('long sleeve')) return c.costLongSleeve || 12;
      if (name.includes('kit infantil') || name.includes('kids')) return c.costKids || 11;
      if (name.includes('baby') || name.includes('body')) return c.costBaby || 8;
      if (name.includes('treino') || name.includes('training')) return c.costTraining || 17;
      if (name.includes('short') || name.includes('bermuda')) return c.costShorts || 8;
      return c.costFan || 9;
    };

    const calculateOrderCost = (order) => {
      if (!order || !order.items) return 0;
      const rate = order.usd_cad_rate || pricing.exchangeRateFallback || 1.38;
      
      const itemsCostUSD = order.items.reduce((acc, item) => {
        const baseUSD = calculateItemBaseCostUSD(item);
        let addonsUSD = 0;
        const size = item.size || 'M';
        if (size === '2XL') addonsUSD += (pricing.costAdd2XL || 1);
        if (['3XL', '4XL'].includes(size)) addonsUSD += (pricing.costAdd3XL4XL || 2);
        if (item.extras?.nameNumber) addonsUSD += (pricing.costAddCustom || 3);
        if (item.extras?.patch) addonsUSD += (pricing.costAddPatch || 1);
        return acc + ((baseUSD + addonsUSD) * (item.quantity || 1));
      }, 0);

      const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      let surchargeUSD = 0;
      if (totalItems === 1) surchargeUSD = pricing.surcharge1Item || 5;
      else if (totalItems === 2) surchargeUSD = pricing.surcharge2Items || 4;
      else if (totalItems === 3) surchargeUSD = pricing.surcharge3Items || 3;
      
      const baseCostCAD = (itemsCostUSD + surchargeUSD) * rate;
      const commissionCAD = calculateOrderCommission(order);
      return baseCostCAD + commissionCAD;
    };

    // Filter orders
    const filteredOrders = allOrders.filter(o => {
      const orderDate = getCalgaryDateStrOnly(o.created_at);
      const matchesStart = !dateRange.start || orderDate >= dateRange.start;
      const matchesEnd = !dateRange.end || orderDate <= dateRange.end;
      return matchesStart && matchesEnd;
    });

    const calculatedStats = filteredOrders.reduce((acc, order) => {
      const isCancelled = order.status === 'cancelled';
      const itemsCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
      
      if (order.status === 'shipped') acc.countShipped++;
      if (order.status === 'completed') acc.countCompleted++;
      if (order.status === 'cancelled') acc.countCancelled++;
      if (order.status === 'pending') acc.countPending++;
      if (order.status === 'paid') acc.countPaid++;
      if (order.status === 'processing') acc.countProcessing++;

      if (!isCancelled) {
        acc.totalRevenue += getValidRevenue(order);
        acc.totalJerseys += itemsCount;

        const orderCostCAD = calculateOrderCost(order);
        acc.totalCostCAD += orderCostCAD;
        acc.totalCommissionCAD += calculateOrderCommission(order);

        const itemsCostUSD = order.items?.reduce((sum, item) => {
          const base = calculateItemBaseCostUSD(item);
          let addons = 0;
          const size = item.size || 'M';
          if (size === '2XL') addons += (pricing.costAdd2XL || 1);
          if (['3XL', '4XL'].includes(size)) addons += (pricing.costAdd3XL4XL || 2);
          if (item.extras?.nameNumber) addons += (pricing.costAddCustom || 3);
          if (item.extras?.patch) addons += (pricing.costAddPatch || 1);
          return sum + ((base + addons) * (item.quantity || 1));
        }, 0) || 0;

        let surchargeUSD = 0;
        if (itemsCount === 1) surchargeUSD = pricing.surcharge1Item || 5;
        else if (itemsCount === 2) surchargeUSD = pricing.surcharge2Items || 4;
        else if (itemsCount === 3) surchargeUSD = pricing.surcharge3Items || 3;

        acc.totalCostUSD += (itemsCostUSD + surchargeUSD);
      }

      return acc;
    }, { 
      totalRevenue: 0, totalCostCAD: 0, totalCostUSD: 0, totalJerseys: 0,
      totalCommissionCAD: 0,
      countShipped: 0, countCompleted: 0, countCancelled: 0, countPending: 0, countPaid: 0, countProcessing: 0
    });

    const totalProfit = calculatedStats.totalRevenue - calculatedStats.totalCostCAD;

    setStats({
      orders: filteredOrders.length,
      revenue: calculatedStats.totalRevenue,
      profit: totalProfit,
      jerseys: calculatedStats.totalJerseys,
      costUSD: calculatedStats.totalCostUSD,
      costCAD: calculatedStats.totalCostCAD,
      commissionCAD: calculatedStats.totalCommissionCAD,
      countPending: calculatedStats.countPending,
      countPaid: calculatedStats.countPaid,
      countProcessing: calculatedStats.countProcessing,
      countShipped: calculatedStats.countShipped,
      countCompleted: calculatedStats.countCompleted,
      countCancelled: calculatedStats.countCancelled,
      users: profilesCount
    });

    setRecentOrders(filteredOrders.slice(0, 6));

    // Generate dates to show in the chart
    let chartDays = [];
    
    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    let startD;
    let endD = new Date();

    if (!dateRange.start && !dateRange.end) {
      if (allOrders.length > 0) {
        const oldestOrder = allOrders[allOrders.length - 1];
        startD = new Date(oldestOrder.created_at);
      } else {
        startD = new Date();
        startD.setDate(startD.getDate() - 7);
      }
    } else {
      startD = new Date(dateRange.start + 'T12:00:00');
      if (dateRange.end) {
        endD = new Date(dateRange.end + 'T12:00:00');
      }
    }

    const diffTime = Math.abs(endD - startD);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= diffDays; i++) {
      chartDays.push(getCalgaryDateStrOnly(addDays(startD, i)));
    }

    const dailyMap = {};
    chartDays.forEach(date => {
      dailyMap[date] = { revenue: 0, count: 0 };
    });

    filteredOrders.forEach(o => {
      const dateStr = getCalgaryDateStrOnly(o.created_at);
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr].count += 1;
        if (o.status !== 'cancelled') {
          dailyMap[dateStr].revenue += getValidRevenue(o);
        }
      }
    });

    setChartData(chartDays.map(date => {
      const parts = date.split('-');
      const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
      return {
        date: localDate.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        revenue: dailyMap[date].revenue,
        count: dailyMap[date].count
      };
    }));

  }, [allOrders, dateRange, pricing, coupons, profilesCount]);

  if (loading) return <Loader />;

  // Calculate SVG line chart coordinates
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);
  const chartHeight = 150;
  const chartWidth = 500;
  const padding = 30;

  const points = chartData.map((d, i) => {
    const x = padding + (i * (chartWidth - padding * 2)) / (chartData.length - 1);
    const y = chartHeight - padding - (d.revenue * (chartHeight - padding * 2)) / maxRevenue;
    return { x, y, data: d };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  // Calculate SVG bar chart coordinates
  const maxCount = Math.max(...chartData.map(d => d.count), 5);

  return (
    <div>
      <SectionHeader 
        title="Dashboard" 
        sub="Visão geral da sua loja iFooty Canada" 
        action={
          <button
            onClick={() => setShowValues(!showValues)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              color: '#D6FF00',
              cursor: 'pointer',
              border: '1px solid rgba(214, 255, 0, 0.25)',
              background: 'rgba(214, 255, 0, 0.04)',
              transition: 'all 0.2s',
              fontSize: '0.78rem'
            }}
          >
            {showValues ? <Eye size={14} /> : <Eye size={14} />}
            <span>{showValues ? "Ocultar Valores" : "Ver Valores"}</span>
          </button>
        }
      />

      {/* Date Filter Bar */}
      <div style={{
        background: '#121416',
        border: '1px solid #1A1D20',
        borderRadius: '12px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Presets */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Todo o Período' },
            { id: '7d', label: 'Últimos 7 Dias' },
            { id: 'month', label: 'Este Mês' },
            { id: 'last_month', label: 'Mês Passado' }
          ].map(p => {
            const isActive = timePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setTimePreset(p.id);
                  const getCalgaryDateStrOnly = (dateInput) => {
                    return new Intl.DateTimeFormat('en-CA', {
                      timeZone: 'America/Edmonton',
                      year: 'numeric', month: '2-digit', day: '2-digit'
                    }).format(new Date(dateInput));
                  };
                  if (p.id === 'all') {
                    setDateRange({ start: '', end: '' });
                  } else if (p.id === '7d') {
                    const start = new Date();
                    start.setDate(start.getDate() - 7);
                    setDateRange({ start: getCalgaryDateStrOnly(start), end: getCalgaryDateStrOnly(new Date()) });
                  } else if (p.id === 'month') {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    setDateRange({ start: getCalgaryDateStrOnly(start), end: getCalgaryDateStrOnly(end) });
                  } else if (p.id === 'last_month') {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const end = new Date(now.getFullYear(), now.getMonth(), 0);
                    setDateRange({ start: getCalgaryDateStrOnly(start), end: getCalgaryDateStrOnly(end) });
                  }
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '100px',
                  border: 'none',
                  background: isActive ? '#D6FF00' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Inputs */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>De:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => {
                setTimePreset('custom');
                setDateRange({ ...dateRange, start: e.target.value });
              }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1A1D20',
                borderRadius: '6px',
                padding: '0.3rem 0.5rem',
                color: '#fff',
                fontSize: '0.75rem',
                outline: 'none',
                colorScheme: 'dark'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Até:</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => {
                setTimePreset('custom');
                setDateRange({ ...dateRange, end: e.target.value });
              }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1A1D20',
                borderRadius: '6px',
                padding: '0.3rem 0.5rem',
                color: '#fff',
                fontSize: '0.75rem',
                outline: 'none',
                colorScheme: 'dark'
              }}
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => {
                setTimePreset('all');
                setDateRange({ start: '', end: '' });
              }}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.06)',
                color: '#EF4444',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>
      
      {/* KPIs Finanças e Custo */}
      <div className="kpi-grid">
        <KpiCard compact label="Vendas (CAD)"       value={showValues ? `$${stats.revenue.toFixed(2)}` : '****'}          icon={DollarSign}   color="#4ADE80" sub="Todos exceto cancelados" />
        <KpiCard compact label="Lucro Real"         value={showValues ? `$${stats.profit.toFixed(2)}` : '****'}           icon={TrendingUp}   color="#22C55E" sub="Receita menos Custo CAD" />
        <KpiCard compact label="Camisas Vendidas"   value={`${stats.jerseys} unid.`}                icon={Shirt}        color="#FFFFFF" />
        <KpiCard compact label="Custo (CAD)"        value={showValues ? `$${stats.costCAD.toFixed(2)}` : '****'}          icon={CreditCard}   color="#F59E0B" sub={showValues ? `Comissão: +$${stats.commissionCAD.toFixed(2)}` : 'Comissão: ****'} />
        <KpiCard compact label="Custo (USD)"        value={showValues ? `$${stats.costUSD.toFixed(2)}` : '****'}          icon={Globe}        color="#64748B" />
      </div>

      {/* KPIs Status dos Pedidos */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        <KpiCard compact label="Novos"              value={stats.countPending + stats.countPaid}    icon={Clock}        color="#FFB81C" sub="Aguardando confirmação/pagos" />
        <KpiCard compact label="Preparação"         value={stats.countProcessing}                   icon={Activity}     color="#3B82F6" />
        <KpiCard compact label="Enviados"           value={stats.countShipped}                      icon={Truck}        color="#10B981" />
        <KpiCard compact label="Finalizados"        value={stats.countCompleted}                    icon={CheckCircle2} color="#A855F7" />
        <KpiCard compact label="Cancelados"         value={stats.countCancelled}                    icon={XCircle}      color="#EF4444" />
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Line Chart */}
        <div style={S.card}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#4ADE80" /> Faturamento{getPeriodLabel()}
          </h3>
          <div style={{ position: 'relative', width: '100%', height: '180px' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D6FF00" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D6FF00" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              {[0, 0.5, 1].map((r, idx) => {
                const y = padding + r * (chartHeight - padding * 2);
                const val = (maxRevenue * (1 - r)).toFixed(0);
                return (
                  <g key={idx}>
                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                    <text x={padding - 5} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">{showValues ? `$${val}` : '****'}</text>
                  </g>
                );
              })}
              {/* Area Under Line */}
              {areaD && <path d={areaD} fill="url(#gradient)" />}
              {/* Line path */}
              {pathD && <path d={pathD} fill="none" stroke="#D6FF00" strokeWidth="2.5" strokeLinecap="round" />}
              {/* Highlight Points */}
              {points.map((p, idx) => (
                <g key={idx} className="chart-point-group" style={{ cursor: 'pointer' }}>
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={hoveredPoint?.data?.date === p.data.date ? "6" : "4"} 
                    fill={hoveredPoint?.data?.date === p.data.date ? "#D6FF00" : "#0B0C0E"} 
                    stroke="#D6FF00" 
                    strokeWidth="2" 
                  />
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="12" 
                    fill="transparent" 
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              ))}
            </svg>

            {/* Interactive HTML Tooltip */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                top: `${(hoveredPoint.y / chartHeight) * 100 - 15}%`,
                transform: 'translate(-50%, -100%)',
                background: '#1D2024',
                border: '1px solid #D6FF00',
                borderRadius: '6px',
                padding: '0.45rem 0.65rem',
                fontSize: '0.75rem',
                color: '#fff',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                fontFamily: "'Inter', sans-serif"
              }}>
                <div style={{ fontWeight: 800, color: '#D6FF00', fontSize: '0.82rem' }}>
                  {showValues ? `$${hoveredPoint.data.revenue.toFixed(2)}` : '****'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: 500 }}>
                  {hoveredPoint.data.date} ({hoveredPoint.data.count} ped.)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div style={S.card}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={16} color="#60A5FA" /> Volume de Pedidos Diários{getPeriodLabel()}
          </h3>
          <div style={{ position: 'relative', width: '100%', height: '180px' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              {[0, 0.5, 1].map((r, idx) => {
                const y = padding + r * (chartHeight - padding * 2);
                const val = Math.round(maxCount * (1 - r));
                return (
                  <g key={idx}>
                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                    <text x={padding - 5} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">{val}</text>
                  </g>
                );
              })}
              {/* Bars */}
              {chartData.map((d, idx) => {
                const barWidth = (chartWidth - padding * 2) / chartData.length;
                const x = padding + idx * barWidth;
                const barHeight = (d.count / maxCount) * (chartHeight - padding * 2);
                const y = chartHeight - padding - barHeight;
                const isHovered = hoveredBar?.date === d.date;

                const labelInterval = Math.ceil(chartData.length / 8);
                const showLabel = idx % labelInterval === 0 || idx === chartData.length - 1;

                return (
                  <g key={idx}>
                    {/* Bar Rect */}
                    <rect
                      x={x + barWidth * 0.15}
                      y={Math.min(y, chartHeight - padding - 2)}
                      width={Math.max(barWidth * 0.7, 1.5)}
                      height={Math.max(barHeight, 2)}
                      fill={isHovered ? "#60A5FA" : "url(#blue-gradient)"}
                      rx="1"
                    />
                    {/* Hover Trigger area */}
                    <rect
                      x={x}
                      y={padding}
                      width={barWidth}
                      height={chartHeight - padding * 2}
                      fill="transparent"
                      onMouseEnter={() => setHoveredBar(d)}
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{ cursor: 'pointer' }}
                    />
                    {/* X Axis Label */}
                    {showLabel && (
                      <text x={x + barWidth / 2} y={chartHeight - 5} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">
                        {d.date.split(' ')[0]}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Interactive HTML Tooltip for Bar Chart */}
            {hoveredBar && (
              <div style={{
                position: 'absolute',
                left: `${((padding + chartData.findIndex(d => d.date === hoveredBar.date) * ((chartWidth - padding * 2) / chartData.length) + ((chartWidth - padding * 2) / chartData.length) / 2) / chartWidth) * 100}%`,
                top: `${((chartHeight - padding - (hoveredBar.count / maxCount) * (chartHeight - padding * 2)) / chartHeight) * 100 - 10}%`,
                transform: 'translate(-50%, -100%)',
                background: '#1D2024',
                border: '1px solid #60A5FA',
                borderRadius: '6px',
                padding: '0.45rem 0.65rem',
                fontSize: '0.75rem',
                color: '#fff',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                fontFamily: "'Inter', sans-serif"
              }}>
                <div style={{ fontWeight: 800, color: '#60A5FA', fontSize: '0.82rem' }}>
                  {hoveredBar.count} {hoveredBar.count === 1 ? 'pedido' : 'pedidos'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: 500 }}>
                  {hoveredBar.date}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={S.card}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>Pedidos Recentes</h3>
        <div className="table-responsive">
          <table style={S.table}>
            <thead>
              <tr>
                {['ID', 'Cliente', 'Data', 'Total', 'Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>#{String(o.id).slice(-6)}</td>
                  <td style={{ ...S.td, color: getStatusNameColor(o.status), fontWeight: 600 }}>{o.customer_name || o.customer_email || '—'}</td>
                  <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: '#D6FF00' }}>${parseFloat(o.total || o.total_price || 0).toFixed(2)}</td>
                  <td style={S.td}><span style={S.badge(o.status)}>{STATUS_COLORS[o.status]?.label || o.status}</span></td>
                </tr>
              ))}
              {recentOrders.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Nenhum pedido encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Orders Section ───────────────────────────────────────────────────────────
// ─── Order Detail Modal ───────────────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose, onStatusChange, onTrackingChange, showToast, onOpenTracking, onDeleteOrder }) => {
  const [tracking, setTracking] = useState(order.tracking_number || '');
  const [savingTracking, setSavingTracking] = useState(false);
  const items = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch { return []; } })() : []);
  const addr = order.shipping_address || {};

  const handleSaveTracking = async () => {
    if (!tracking.trim()) return;
    setSavingTracking(true);
    const { error } = await supabase.from('orders').update({ tracking_number: tracking.trim() }).eq('id', order.id);
    setSavingTracking(false);
    if (error) { showToast('Erro ao salvar rastreio.', 'error'); return; }
    showToast('Código de rastreio salvo!', 'success');
    if (onTrackingChange) onTrackingChange(order.id, tracking.trim());
  };

  const Row = ({ label, value }) => value ? (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '1rem', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'start' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', paddingTop: '0.1rem' }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: '#fff', wordBreak: 'break-word', lineHeight: '1.4' }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth: '850px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.25rem' }}>Pedido</div>
            <h3 style={{ margin: 0, fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>#{order.id}</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {onDeleteOrder && (
              <button 
                onClick={() => onDeleteOrder(order.id)} 
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginRight: '0.5rem'
                }}
              >
                <Trash2 size={12} /> Excluir Pedido
              </button>
            )}
            <span style={S.badge(order.status)}>{STATUS_COLORS[order.status]?.label || order.status}</span>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="admin-grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Cliente */}
          <div style={{ ...S.card, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D6FF00', marginBottom: '0.75rem' }}>👤 Cliente</div>
            <Row label="Nome" value={order.customer_name} />
            <Row label="Email" value={order.customer_email} />
            <Row label="Telefone" value={order.customer_phone} />
            <Row label="Data" value={new Date(order.created_at).toLocaleString('pt-BR')} />
            <Row label="Pagamento" value={order.payment_method} />
            {order.coupon_code && <Row label="Cupom" value={`${order.coupon_code} (-$${parseFloat(order.coupon_discount || 0).toFixed(2)})`} />}
          </div>

          {/* Endereço */}
          <div style={{ ...S.card, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D6FF00', marginBottom: '0.75rem' }}>📍 Endereço</div>
            {addr.method === 'pickup' ? (
              <div style={{ color: '#60A5FA', fontWeight: 600, fontSize: '0.875rem' }}>🏪 Retirada no Local</div>
            ) : (
              <>
                <Row label="Rua" value={[addr.street, addr.number].filter(Boolean).join(', ')} />
                <Row label="Bairro" value={addr.district} />
                <Row label="Apto" value={addr.apartment} />
                <Row label="Cidade" value={addr.city} />
                <Row label="Província" value={addr.province} />
                <Row label="Postal" value={addr.postalCode} />
                <Row label="País" value={addr.country} />
                {addr.instructions && <Row label="Instruções" value={addr.instructions} />}
              </>
            )}
          </div>
        </div>

        {/* Itens do Pedido */}
        <div style={{ ...S.card, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D6FF00', marginBottom: '1rem' }}>🛍️ Itens ({items.length})</div>
          {items.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>Nenhum item registrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  {item.image && <div style={{ width: '50px', height: '50px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid #2A2D30' }}><ProductMedia src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>Tamanho: {item.size} · Qtd: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#D6FF00', whiteSpace: 'nowrap' }}>${parseFloat(item.price || 0).toFixed(2)}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, fontSize: '1rem' }}>
                Total: <span style={{ color: '#D6FF00', marginLeft: '1rem' }}>${parseFloat(order.total || order.total_price || 0).toFixed(2)} CAD</span>
              </div>
            </div>
          )}
        </div>

        {/* Tracking + Status */}
        <div className="admin-grid-2 admin-gap-1">
          <div style={{ ...S.card, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D6FF00', marginBottom: '0.75rem' }}>📦 Rastreio</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input style={{ ...S.input, flex: 1 }} value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Ex: 1Z999AA10123456784" />
              <button style={{ ...S.btnPrimary, flexShrink: 0 }} onClick={handleSaveTracking} disabled={savingTracking}><Save size={14} /></button>
            </div>
            {order.tracking_number && (() => {
              const trackingCodes = order.tracking_number.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
              return trackingCodes.map((code, idx) => (
                <button
                  key={code}
                  onClick={() => onOpenTracking && onOpenTracking(code)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(214,255,0,0.1)',
                    border: '1px solid #D6FF00',
                    color: '#D6FF00',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Package size={14} /> Testar Rastreio {trackingCodes.length > 1 ? `#${idx + 1}` : ''} ({code})
                </button>
              ));
            })()}
          </div>
          <div style={{ ...S.card, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D6FF00', marginBottom: '0.75rem' }}>⚙️ Mudar Status</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select style={S.input} value={order.status} onChange={e => onStatusChange(order.id, e.target.value)}>
                {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button 
                onClick={() => {
                  const templates = {
                    pending: `Olá *${order.customer_name}*, tudo bem? Passando para avisar que recebemos seu pedido **#${order.id.slice(0, 8)}** na iFooty! 👕 Em breve te passamos as instruções para o Interac e-Transfer.`,
                    processing: `Olá *${order.customer_name}*, seu pedido **#${order.id.slice(0, 8)}** já entrou em preparação! 👕 Estamos conferindo cada detalhe para que chegue perfeito para você.`,
                    shipped: `Grande notícia, *${order.customer_name}*! 🚀 Seu pedido **#${order.id.slice(0, 8)}** acaba de ser despachado. Logo você estará com seu novo manto em mãos!`,
                    completed: `Olá *${order.customer_name}*, o sistema indica que seu pedido **#${order.id.slice(0, 8)}** foi entregue! 📦 Esperamos que goste da qualidade. Se puder, tira uma foto e marca a gente no Instagram @ifooty.ca! 🔥`,
                    cancelled: `Olá *${order.customer_name}*, infelizmente seu pedido **#${order.id.slice(0, 8)}** precisou ser cancelado. :( Caso tenha alguma dúvida, estamos à disposição aqui no WhatsApp.`
                  };
                  const message = templates[order.status] || templates.pending;
                  const phone = order.customer_phone ? order.customer_phone.replace(/\D/g, '') : '';
                  const formattedPhone = (phone.length === 10) ? `1${phone}` : phone;
                  if (formattedPhone) {
                    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }
                }}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '6px',
                  background: 'rgba(37, 211, 102, 0.1)',
                  border: '1px solid #25D366',
                  color: '#25D366',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flexShrink: 0
                }}
                title="Re-enviar Notificação WhatsApp"
              >
                <MessageSquare size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Orders Section ───────────────────────────────────────────────────────────
const OrdersSection = ({ showToast, onOpenTracking }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este pedido? Esta ação não poderá ser desfeita.")) return;
    
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) {
      showToast('Erro ao excluir pedido.', 'error');
      return;
    }
    showToast('Pedido excluído com sucesso!', 'success');
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setSelectedOrder(null);
  };

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    // 1. Update status in database
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { showToast('Erro ao atualizar status.', 'error'); return; }

    // 2. Automatic Inventory Sync
    const itemsList = Array.isArray(orderToUpdate.items) ? orderToUpdate.items : (typeof orderToUpdate.items === 'string' ? (() => { try { return JSON.parse(orderToUpdate.items); } catch { return []; } })() : []);
    if (itemsList.length > 0) {
      const previousStatus = orderToUpdate.status;
      const shouldAddStock = previousStatus !== 'cancelled' && newStatus === 'cancelled';
      const shouldSubtractStock = previousStatus === 'cancelled' && newStatus !== 'cancelled';

      if (shouldAddStock || shouldSubtractStock) {
        for (const item of itemsList) {
          try {
            const { data: product, error: fetchError } = await supabase
              .from('products')
              .select('inventory')
              .eq('id', item.id || item.product_id)
              .single();

            if (!fetchError && product && product.inventory) {
              const currentStock = product.inventory[item.size] || 0;
              const qtyChange = (item.quantity || 1);
              const newStock = shouldAddStock 
                ? currentStock + qtyChange 
                : Math.max(0, currentStock - qtyChange);
              
              if (currentStock !== newStock) {
                const updatedInventory = { ...product.inventory, [item.size]: newStock };
                await supabase
                  .from('products')
                  .update({ inventory: updatedInventory })
                  .eq('id', item.id || item.product_id);
              }
            }
          } catch (err) {
            console.error(`Erro ao sincronizar estoque do item ${item.id}:`, err);
          }
        }
      }
    }

    // 3. Send email notifications in the background
    if (['processing', 'shipped', 'completed', 'cancelled'].includes(newStatus)) {
      fetch('/api/send-status-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: { ...orderToUpdate, status: newStatus },
          newStatus: newStatus
        })
      }).catch(err => console.error("Erro ao enviar email de status:", err));
    }

    // 4. Fire WhatsApp status template notification
    const templates = {
      pending: `Olá *${orderToUpdate.customer_name}*, tudo bem? Passando para avisar que recebemos seu pedido **#${orderToUpdate.id.slice(0, 8)}** na iFooty! 👕 Em breve te passamos as instruções para o Interac e-Transfer.`,
      processing: `Olá *${orderToUpdate.customer_name}*, seu pedido **#${orderToUpdate.id.slice(0, 8)}** já entrou em preparação! 👕 Estamos conferindo cada detalhe para que chegue perfeito para você.`,
      shipped: `Grande notícia, *${orderToUpdate.customer_name}*! 🚀 Seu pedido **#${orderToUpdate.id.slice(0, 8)}** acaba de ser despachado. Logo você estará com seu novo manto em mãos!`,
      completed: `Olá *${orderToUpdate.customer_name}*, o sistema indica que seu pedido **#${orderToUpdate.id.slice(0, 8)}** foi entregue! 📦 Esperamos que goste da qualidade. Se puder, tira uma foto e marca a gente no Instagram @ifooty.ca! 🔥`,
      cancelled: `Olá *${orderToUpdate.customer_name}*, infelizmente seu pedido **#${orderToUpdate.id.slice(0, 8)}** precisou ser cancelado. :( Caso tenha alguma dúvida, estamos à disposição aqui no WhatsApp.`
    };

    const message = templates[newStatus] || templates.pending;
    const phone = orderToUpdate.customer_phone ? orderToUpdate.customer_phone.replace(/\D/g, '') : '';
    const formattedPhone = (phone.length === 10) ? `1${phone}` : phone;
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }

    showToast('Status atualizado e e-mail enviado!', 'success');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (o.customer_name || '').toLowerCase().includes(q) || (o.customer_email || '').toLowerCase().includes(q) || String(o.id).includes(q);
    return matchFilter && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ORDERS_PER_PAGE);
  const paginatedOrders = filtered.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  return (
    <div>
      <SectionHeader 
        title="Pedidos" 
        sub={`${orders.length} pedidos no total`} 
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={S.btnPrimary} onClick={() => onOpenTracking && onOpenTracking('')}>
              <Package size={14} /> Rastrear Envio
            </button>
            <button style={S.btnSecondary} onClick={load}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        } 
      />
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
          <input style={{ ...S.input, paddingLeft: '2.5rem' }} placeholder="Buscar por nome, email ou ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: filter === s ? '#D6FF00' : 'rgba(255,255,255,0.06)', color: filter === s ? '#000' : 'rgba(255,255,255,0.6)' }}>
              {s === 'all' ? 'Todos' : STATUS_COLORS[s]?.label || s}
            </button>
          ))}
        </div>
      </div>
      <div style={S.card}>
        {loading ? <Loader /> : (
          <>
            <div className="table-responsive">
              <table style={S.table}>
                <thead>
                  <tr>{['ID', 'Cliente', 'Data', 'Total', 'Status', 'Ações'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {paginatedOrders.map(o => (
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                      <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontFamily: 'monospace' }}>#{String(o.id).slice(-8)}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: getStatusNameColor(o.status) }}>{o.customer_name || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{o.customer_email || ''}</div>
                      </td>
                      <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ ...S.td, fontWeight: 700, color: '#D6FF00', whiteSpace: 'nowrap' }}>${parseFloat(o.total || o.total_price || 0).toFixed(2)}</td>
                      <td style={S.td}><span style={S.badge(o.status)}>{STATUS_COLORS[o.status]?.label || o.status}</span></td>
                      <td style={{ ...S.td }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button style={S.btnEdit} onClick={() => setSelectedOrder(o)}><Eye size={14} /></button>
                          <select
                            value={o.status}
                            onChange={e => { e.stopPropagation(); handleStatusChange(o.id, e.target.value); }}
                            style={{ ...S.input, width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhum pedido encontrado.</td></tr>}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0.5rem 1rem 0 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                  Mostrando {((currentPage - 1) * ORDERS_PER_PAGE) + 1} a {Math.min(currentPage * ORDERS_PER_PAGE, filtered.length)} de {filtered.length} pedidos
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      transition: 'all 0.2s'
                    }}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, padding: '0 0.5rem' }}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      transition: 'all 0.2s'
                    }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onTrackingChange={(id, track) => setOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_number: track } : o))}
          showToast={showToast}
          onOpenTracking={onOpenTracking}
          onDeleteOrder={handleDeleteOrder}
        />
      )}
    </div>
  );
};

// ─── Image Upload Utility ─────────────────────────────────────────────────────
const compressToWebP = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > 1200) { height = Math.round(height * 1200 / width); width = 1200; }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => resolve(blob || file), 'image/webp', 0.82);
    };
    img.onerror = () => resolve(file);
    img.src = e.target.result;
  };
  reader.onerror = () => resolve(file);
  reader.readAsDataURL(file);
});

const uploadImageToSupabase = async (file) => {
  const blob = await compressToWebP(file);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { error } = await supabase.storage.from('product-images').upload(filename, blob, { cacheControl: '31536000', upsert: true, contentType: 'image/webp' });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('product-images').getPublicUrl(filename);
  return data.publicUrl;
};

// ─── Products Section ─────────────────────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  'Brasileirão',
  'Seleções',
  'Internacionais',
  'Retrô',
  'NBA',
  'Baseball',
  'Football',
  'Hockey',
  'Tênis',
  'Lançamentos',
  'Streetwear'
];

const getProductSport = (p) => {
  const cat = (p.category || '').toLowerCase();
  const pName = (p.name || '').toLowerCase();
  const pLeague = (p.league || '').toLowerCase();

  const isStreetwear = cat === 'streetwear' || cat === 'camisetas' || pName.includes('streetwear') || pName.includes('camiseta');
  const isTenis = (cat === 'tênis' || cat === 'tenis' || cat === 'shoes' || pName.includes('tênis') || pName.includes('tenis') || pName.includes('sneaker')) && !isStreetwear;
  const isNba = (cat === 'nba' || cat === 'basquete' || pLeague === 'nba' || pName.includes('nba') || pName.includes('basquete') || pName.includes('basketball') || pName.includes('jersey nba')) && !isStreetwear;
  
  const isBaseball = cat === 'baseball' || pLeague === 'mlb' || pName.includes('blue jays') || pName.includes('baseball') || pName.includes('mlb') || pName.includes('dodgers');
  const isFootball = cat === 'football' || pLeague === 'nfl' || pName.includes('chiefs') || pName.includes('football') || pName.includes('nfl') || pName.includes('cowboys');
  const isHockey = cat === 'hockey' || pLeague === 'nhl' || pName.includes('maple leafs') || pName.includes('hockey') || pName.includes('nhl') || pName.includes('oilers');

  if (isStreetwear) return 'Streetwear';
  if (isTenis) return 'Tênis';
  if (isNba) return 'Basketball';
  if (isBaseball) return 'Baseball';
  if (isFootball) return 'Football';
  if (isHockey) return 'Hockey';
  
  return 'Soccer';
};

const getSoccerSubdivision = (p) => {
  const cat = (p.category || '').toLowerCase();
  const pName = (p.name || '').toLowerCase();
  const pLeague = p.league || '';
  const pVersion = (p.version || '').toLowerCase();

  const isRetro = cat === 'retrô' || cat.includes('retro') || pVersion.includes('retrô') || pName.includes('retrô') || pName.includes('retro');
  if (isRetro) return 'Retro Collection';

  const isNew = p.is_new || cat === 'lançamentos' || cat.includes('lançament');
  if (isNew) return 'New Arrivals';

  const isSelecao = cat === 'seleções' || cat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || pLeague === 'Seleções' || pName.includes('brasil') || pName.includes('argentina') || pName.includes('portugal') || pName.includes('frança') || pName.includes('itália') || pName.includes('espanha');
  if (isSelecao) return 'National Teams';

  if (pLeague === 'Liga Profesional') return 'Argentine League';
  if (pLeague === 'Brasileirão') return 'Brazilian League';
  if (pLeague === 'Bundesliga') return 'Bundesliga';
  if (pLeague === 'La Liga') return 'La Liga';
  if (pLeague === 'Ligue 1') return 'Ligue 1';
  if (pLeague === 'MLS') return 'MLS';
  if (pLeague === 'Premier League') return 'Premier League';
  if (pLeague === 'Saudi Pro League') return 'Saudi Pro League';
  if (pLeague === 'Serie A') return 'Serie A';
  
  return 'Other Leagues';
};

const SOCCER_SUB_MAPPING = {
  'Argentine League': { category: 'Internacionais', league: 'Liga Profesional' },
  'Brazilian League': { category: 'Brasileirão', league: 'Brasileirão' },
  'Bundesliga': { category: 'Internacionais', league: 'Bundesliga' },
  'La Liga': { category: 'Internacionais', league: 'La Liga' },
  'Ligue 1': { category: 'Internacionais', league: 'Ligue 1' },
  'MLS': { category: 'Internacionais', league: 'MLS' },
  'National Teams': { category: 'Seleções', league: 'Seleções' },
  'New Arrivals': { category: 'Lançamentos', league: 'Lançamentos' },
  'Premier League': { category: 'Internacionais', league: 'Premier League' },
  'Retro Collection': { category: 'Retrô', league: 'Retrô' },
  'Saudi Pro League': { category: 'Internacionais', league: 'Saudi Pro League' },
  'Serie A': { category: 'Internacionais', league: 'Serie A' },
  'Other Leagues': { category: 'Internacionais', league: 'Other' }
};

const ProductsSection = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedSubdivision, setSelectedSubdivision] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const generateAIDescription = async () => {
    if (!form.name) {
      showToast('Por favor, insira o nome do produto primeiro.', 'error');
      return;
    }
    setGeneratingDescription(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate-description',
          productName: form.name,
          category: form.mainCategory || 'Soccer'
        })
      });
      const data = await response.json();
      if (data.description) {
        setForm(prev => ({ ...prev, description: data.description }));
        showToast('Descrição gerada com sucesso!', 'success');
      } else {
        showToast(data.error || 'Erro ao gerar descrição.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao gerar descrição.', 'error');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (product) => {
    setEditingProduct(product);
    setImageFile(null);
    setImagePreview(product.image || null);
    
    const defaultInventory = { S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0 };
    const currentInventory = product.inventory ? { ...defaultInventory, ...product.inventory } : defaultInventory;

    const mainCat = product.id === 'NEW' ? '' : getProductSport(product);
    const subCat = (product.id === 'NEW' || mainCat !== 'Soccer') ? '' : getSoccerSubdivision(product);

    setForm({
      name: product.name || '',
      price: product.price || '',
      category: product.category || '',
      league: product.league || '',
      mainCategory: mainCat,
      subCategory: subCat,
      team: product.team || '',
      is_new: product.is_new || false,
      is_bestseller: product.is_bestseller || false,
      is_sale: product.is_sale || false,
      is_trending: product.is_trending || false,
      image: product.image || '',
      gallery: product.gallery || [],
      description: product.description || '',
      inventory: currentInventory
    });
  };

  const handleMainCategoryChange = (val) => {
    let cat = val;
    if (val === 'Basketball') cat = 'NBA';
    else if (val === 'Soccer') cat = ''; // Define upon subcategory selection
    
    setForm(prev => ({
      ...prev,
      mainCategory: val,
      subCategory: val === 'Soccer' ? '' : prev.subCategory,
      category: cat
    }));
  };

  const handleSubCategoryChange = (val) => {
    const mapped = SOCCER_SUB_MAPPING[val] || { category: 'Internacionais', league: 'Other' };
    setForm(prev => ({
      ...prev,
      subCategory: val,
      category: mapped.category,
      league: mapped.league
    }));
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    try {
      showToast('Enviando imagens para a galeria...', 'success');
      const uploadedUrls = [];
      for (const file of files) {
        const url = await uploadImageToSupabase(file);
        uploadedUrls.push(url);
      }
      setForm(prev => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...uploadedUrls]
      }));
      showToast('Galeria atualizada!', 'success');
    } catch (err) {
      showToast('Erro no upload das imagens: ' + err.message, 'error');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSizeStockChange = (size, val) => {
    setForm(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [size]: Math.max(0, parseInt(val) || 0)
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let imageUrl = form.image;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadImageToSupabase(imageFile);
      } catch (err) {
        showToast('Erro no upload da imagem: ' + err.message, 'error');
        setSaving(false); setUploading(false); return;
      }
      setUploading(false);
    }
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      league: form.league || null,
      team: form.team || null,
      is_new: form.is_new || form.subCategory === 'New Arrivals',
      is_bestseller: !!form.is_bestseller,
      is_sale: !!form.is_sale,
      is_trending: !!form.is_trending,
      image: imageUrl,
      gallery: form.gallery || [],
      description: form.description,
      inventory: form.inventory
    };
    const { error } = editingProduct.id === 'NEW'
      ? await supabase.from('products').insert([payload])
      : await supabase.from('products').update(payload).eq('id', editingProduct.id);
    setSaving(false);
    if (error) { showToast('Erro ao salvar produto.', 'error'); return; }
    showToast(editingProduct.id === 'NEW' ? 'Produto criado!' : 'Produto atualizado!', 'success');
    setEditingProduct(null);
    load();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('products').delete().eq('id', confirmDelete);
    if (error) { showToast('Erro ao deletar.', 'error'); } else { showToast('Produto removido!', 'success'); load(); }
    setConfirmDelete(null);
  };

  const getProductTotalStock = (p) => {
    if (!p.inventory) return 0;
    return Object.values(p.inventory).reduce((acc, qty) => acc + (parseInt(qty) || 0), 0);
  };

  const filtered = products.filter(p => {
    const sport = getProductSport(p);
    const matchesSport = selectedSport === 'all' || sport === selectedSport;
    
    let matchesSubdivision = true;
    if (selectedSport === 'Soccer' && selectedSubdivision !== 'all') {
      const pName = (p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pVersion = (p.version || '').toLowerCase();

      if (selectedSubdivision === 'Seleções') {
        matchesSubdivision = pCat === 'seleções' || pCat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || p.league === 'Seleções' || pName.includes('brasil') || pName.includes('argentina') || pName.includes('portugal') || pName.includes('frança') || pName.includes('itália') || pName.includes('espanha');
      } else if (selectedSubdivision === 'Retrô') {
        matchesSubdivision = pCat === 'retrô' || pCat.includes('retro') || pVersion.includes('retrô') || pName.includes('retrô') || pName.includes('retro');
      } else if (selectedSubdivision === 'Other') {
        const mainLeagues = ['Brasileirão', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS', 'Saudi Pro League', 'Liga Profesional'];
        const isSelecao = pCat === 'seleções' || pCat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || p.league === 'Seleções' || pName.includes('brasil') || pName.includes('argentina') || pName.includes('portugal') || pName.includes('frança') || pName.includes('itália') || pName.includes('espanha');
        const isRetro = pCat === 'retrô' || pCat.includes('retro') || pVersion.includes('retrô') || pName.includes('retrô') || pName.includes('retro');
        matchesSubdivision = !mainLeagues.includes(p.league) && !isSelecao && !isRetro;
      } else {
        matchesSubdivision = p.league === selectedSubdivision;
      }
    }

    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSubdivision && matchesSearch;
  });

  const SPORTS = ['all', 'Soccer', 'Basketball', 'Football', 'Baseball', 'Hockey', 'Tênis', 'Streetwear'];
  const SUBDIVISIONS = ['all', 'Liga Profesional', 'Brasileirão', 'Bundesliga', 'La Liga', 'Ligue 1', 'MLS', 'Seleções', 'Premier League', 'Retrô', 'Saudi Pro League', 'Serie A', 'Other'];

  return (
    <div>
      <SectionHeader title="Produtos" sub={`${products.length} produtos cadastrados`} action={<button style={S.btnPrimary} onClick={() => openEdit({ id: 'NEW' })}><Plus size={14} /> Novo Produto</button>} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '340px' }}>
          <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
          <input style={{ ...S.input, paddingLeft: '2.5rem' }} placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        {/* Esportes / Categorias Principais */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {SPORTS.map(sport => (
            <button
              key={sport}
              onClick={() => {
                setSelectedSport(sport);
                setSelectedSubdivision('all');
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: selectedSport === sport ? '#D6FF00' : 'rgba(255,255,255,0.06)',
                color: selectedSport === sport ? '#000' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s'
              }}
            >
              {sport === 'all' ? 'Todos' : sport}
            </button>
          ))}
        </div>

        {/* Subdivisões do Soccer */}
        {selectedSport === 'Soccer' && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', overflowX: 'auto', padding: '0.65rem 0.75rem', background: 'rgba(214,255,0,0.02)', borderRadius: '6px', border: '1px solid rgba(214,255,0,0.08)', animation: 'slideUp 0.25s ease' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D6FF00', marginRight: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚽ Soccer Ligas:</span>
            {SUBDIVISIONS.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubdivision(sub)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: selectedSubdivision === sub ? 'rgba(214,255,0,0.2)' : 'rgba(255,255,255,0.03)',
                  color: selectedSubdivision === sub ? '#D6FF00' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.1s'
                }}
              >
                {sub === 'all' ? 'Todas' : sub === 'Other' ? 'Outras' : sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? <Loader /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{['Imagem', 'Nome', 'Preço', 'Categoria', 'Estoque Total', 'Ações'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ ...S.td, width: '70px' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '6px', overflow: 'hidden', background: '#0B0C0E', border: '1px solid #2A2D30' }}>
                      {p.image && <ProductMedia src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                  </td>
                  <td style={S.td}><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                  <td style={{ ...S.td, color: '#D6FF00', fontWeight: 700 }}>${parseFloat(p.price || 0).toFixed(2)}</td>
                  <td style={S.td}><span style={{ padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', fontSize: '0.78rem', textTransform: 'capitalize' }}>{p.category || '—'}</span></td>
                  <td style={S.td}>
                    <span style={{ 
                      padding: '0.2rem 0.6rem', 
                      background: getProductTotalStock(p) > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                      color: getProductTotalStock(p) > 0 ? '#4ADE80' : '#F87171',
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      {getProductTotalStock(p)} unid.
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={S.btnEdit} onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                      <button style={S.btnDanger} onClick={() => setConfirmDelete(p.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhum produto encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Create Modal */}
      {editingProduct && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setEditingProduct(null)}>
          <div style={S.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>{editingProduct.id === 'NEW' ? 'Novo Produto' : 'Editar Produto'}</h3>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={() => setEditingProduct(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={S.label}>Nome do Produto</label>
                  <input style={S.input} required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Maple Leafs Home Jersey" />
                </div>
                <div>
                  <label style={S.label}>Preço (CAD)</label>
                  <input style={S.input} type="number" step="0.01" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Ex: 49.90" />
                </div>
                <div>
                  <label style={S.label}>Categoria Principal</label>
                  <select 
                    style={S.input} 
                    required 
                    value={form.mainCategory || ''} 
                    onChange={e => handleMainCategoryChange(e.target.value)}
                  >
                    <option value="">Selecionar...</option>
                    <option value="Soccer">Soccer (Futebol)</option>
                    <option value="Basketball">Basketball (NBA)</option>
                    <option value="Football">Football (NFL)</option>
                    <option value="Baseball">Baseball (MLB)</option>
                    <option value="Hockey">Hockey (NHL)</option>
                    <option value="Tênis">Tênis</option>
                    <option value="Lançamentos">Lançamentos</option>
                    <option value="Streetwear">Streetwear</option>
                  </select>
                </div>
                {form.mainCategory && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={S.label}>Time / Franquia</label>
                    {form.mainCategory === 'Basketball' ? (
                      <select
                        style={S.input}
                        value={form.team || ''}
                        onChange={e => setForm({ ...form, team: e.target.value })}
                      >
                        <option value="">Selecionar Time...</option>
                        {NBA_TEAMS.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        style={S.input}
                        value={form.team || ''}
                        onChange={e => setForm({ ...form, team: e.target.value })}
                        placeholder="Ex: Real Madrid, Flamengo..."
                      />
                    )}
                  </div>
                )}
                 {form.mainCategory === 'Soccer' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={S.label}>Subcategoria Soccer (Liga/Coleção)</label>
                    <select 
                      style={S.input} 
                      required 
                      value={form.subCategory || ''} 
                      onChange={e => handleSubCategoryChange(e.target.value)}
                    >
                      <option value="">Selecionar...</option>
                      <option value="Argentine League">Argentine League</option>
                      <option value="Brazilian League">Brazilian League</option>
                      <option value="Bundesliga">Bundesliga</option>
                      <option value="La Liga">La Liga</option>
                      <option value="Ligue 1">Ligue 1</option>
                      <option value="MLS">MLS</option>
                      <option value="National Teams">National Teams</option>
                      <option value="New Arrivals">New Arrivals</option>
                      <option value="Premier League">Premier League</option>
                      <option value="Retro Collection">Retro Collection</option>
                      <option value="Saudi Pro League">Saudi Pro League</option>
                      <option value="Serie A">Serie A</option>
                      <option value="Other Leagues">Other Leagues</option>
                    </select>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', margin: '0.5rem 0', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={!!form.is_new} 
                      onChange={e => setForm({ ...form, is_new: e.target.checked })} 
                      style={{ cursor: 'pointer' }}
                    />
                    🔥 Lançamento (New Arrival)
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={!!form.is_bestseller} 
                      onChange={e => setForm({ ...form, is_bestseller: e.target.checked })} 
                      style={{ cursor: 'pointer' }}
                    />
                    ⭐ Mais Vendido (Best Seller)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={!!form.is_sale} 
                      onChange={e => setForm({ ...form, is_sale: e.target.checked })} 
                      style={{ cursor: 'pointer' }}
                    />
                    🏷️ Promoção (On Sale)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={!!form.is_trending} 
                      onChange={e => setForm({ ...form, is_trending: e.target.checked })} 
                      style={{ cursor: 'pointer' }}
                    />
                    ⚡ Trending Fan Gear
                  </label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={S.label}>Imagem do Produto</label>
                  {imagePreview && (
                    <div style={{ marginBottom: '0.75rem', borderRadius: '8px', overflow: 'hidden', height: '140px', border: '1px solid #2A2D30', background: '#0B0C0E', position: 'relative' }}>
                      <ProductMedia src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setForm({...form, image: ''}); }} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#F87171', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: '#0B0C0E', border: '1px dashed #2A2D30', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                    📁 {imageFile ? imageFile.name : 'Clique para enviar imagem (comprimida para WebP)'}
                  </label>
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', margin: '0.4rem 0' }}>— ou —</div>
                  <input style={S.input} value={form.image} onChange={e => { setForm({...form, image: e.target.value}); if (e.target.value) setImagePreview(e.target.value); }} placeholder="Cole uma URL direta: https://..." />
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <label style={S.label}>Outras Imagens (Galeria)</label>
                  {form.gallery && form.gallery.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {form.gallery.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #2A2D30', background: '#0B0C0E' }}>
                          <ProductMedia src={img} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newGallery = [...form.gallery];
                              newGallery.splice(idx, 1);
                              setForm({ ...form, gallery: newGallery });
                            }} 
                            style={{ 
                              position: 'absolute', top: '2px', right: '2px', 
                              background: 'rgba(0,0,0,0.8)', border: 'none', color: '#F87171', 
                              borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' 
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#0B0C0E', border: '1px dashed #2A2D30', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleGalleryUpload} />
                      📸 Clique para enviar fotos para a galeria
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        id="new-gallery-url"
                        style={{ ...S.input, flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem' }} 
                        placeholder="Adicionar por URL direta..." 
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), val] }));
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        style={{ ...S.btnPrimary, padding: '0.6rem 1rem' }}
                        onClick={() => {
                          const input = document.getElementById('new-gallery-url');
                          if (input && input.value.trim()) {
                            setForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), input.value.trim()] }));
                            input.value = '';
                          }
                        }}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Inventory / Stock Section */}
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ ...S.label, color: '#D6FF00' }}>Estoque por Tamanho</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(size => (
                      <div key={size} style={{ display: 'flex', alignItems: 'center', background: '#0B0C0E', border: '1px solid #2A2D30', borderRadius: '6px', overflow: 'hidden' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '0.75rem', minWidth: '45px', textAlign: 'center', borderRight: '1px solid #2A2D30' }}>
                          {size}
                        </span>
                        <input 
                          type="number" 
                          min="0"
                          style={{ ...S.input, border: 'none', background: 'transparent', textAlign: 'center', padding: '0.5rem' }} 
                          value={form.inventory?.[size] ?? 0}
                          onChange={e => handleSizeStockChange(size, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ ...S.label, marginBottom: 0 }}>Descrição</label>
                    <button 
                      type="button" 
                      onClick={generateAIDescription}
                      disabled={generatingDescription}
                      style={{
                        background: 'rgba(214,255,0,0.1)',
                        border: '1px solid rgba(214,255,0,0.3)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#D6FF00',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(214,255,0,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(214,255,0,0.1)'}
                    >
                      ✨ {generatingDescription ? 'Gerando...' : 'Gerar por IA'}
                    </button>
                  </div>
                  <textarea style={{ ...S.input, minHeight: '90px', resize: 'vertical' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrição do produto..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" style={S.btnSecondary} onClick={() => setEditingProduct(null)}>Cancelar</button>
                <button type="submit" style={S.btnPrimary} disabled={saving}><Save size={14} />{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ ...S.modalBox, maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.75rem', fontWeight: 700 }}>Confirmar Exclusão</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2rem' }}>Esta ação é irreversível. O produto será removido permanentemente.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button style={S.btnSecondary} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button style={{ ...S.btnPrimary, background: '#F87171', color: '#fff' }} onClick={handleDelete}>Sim, Deletar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Season Spotlight Section ─────────────────────────────────────────────────
const SpotlightSection = ({ showToast }) => {
  const [slides, setSlides] = useState(DEFAULT_SPOTLIGHT);
  const [editingIdx, setEditingIdx] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'season_spotlight').single();
      if (data?.value) { try { const p = JSON.parse(data.value); if (Array.isArray(p) && p.length > 0) setSlides(p); } catch {} }
    }
    load();
  }, []);

  const move = (index, dir) => {
    const s = [...slides];
    if (dir === 'up' && index > 0) [s[index], s[index-1]] = [s[index-1], s[index]];
    if (dir === 'down' && index < s.length-1) [s[index], s[index+1]] = [s[index+1], s[index]];
    setSlides(s);
  };

  const remove = (index) => { if (window.confirm('Remover este slide?')) setSlides(slides.filter((_, i) => i !== index)); };

  const openEdit = (index) => {
    setEditingIdx(index);
    setForm(index === -1 ? { sport:'', badge:'', title:'', price:'', btnText:'', link:'', img:'', featuredProducts:'' } : { ...slides[index] });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadImageToSupabase(file);
      setForm(prev => ({ ...prev, img: url }));
      showToast('Imagem carregada com sucesso!', 'success');
    } catch (err) {
      showToast('Erro no upload: ' + err.message, 'error');
    } finally {
      setUploadingImg(false);
    }
  };

  const saveForm = (e) => {
    e.preventDefault();
    const s = [...slides];
    if (editingIdx === -1) s.push({ ...form }); else s[editingIdx] = { ...form };
    setSlides(s);
    setEditingIdx(null);
  };

  const saveToDb = async () => {
    setLoading(true);
    const { error } = await supabase.from('store_settings').upsert({ key: 'season_spotlight', value: JSON.stringify(slides) }, { onConflict: 'key' });
    setLoading(false);
    if (error) { showToast('Erro ao salvar no banco.', 'error'); } else { showToast('Season Spotlight salvo!', 'success'); }
  };

  const inputStyle = { ...S.input };

  return (
    <div>
      <SectionHeader title="Season Spotlight" sub="Gerencie os slides do carrossel da Home" action={<button style={S.btnPrimary} onClick={saveToDb} disabled={loading}><Save size={14} />{loading ? 'Salvando...' : 'Salvar no Banco'}</button>} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {slides.map((slide, index) => (
          <div key={index} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(214,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#D6FF00', fontSize: '0.85rem', flexShrink: 0 }}>{index+1}</div>
            <div style={{ width: '80px', height: '55px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #2A2D30' }}>
              <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{slide.title}</div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                <span>Sport: <strong style={{ color: '#fff' }}>{slide.sport}</strong></span>
                <span>Badge: <strong style={{ color: '#fff' }}>{slide.badge}</strong></span>
                <span>Preço: <strong style={{ color: '#D6FF00' }}>{slide.price}</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button style={{ ...S.btnSecondary, padding: '0.45rem' }} disabled={index === 0} onClick={() => move(index, 'up')}><ChevronUp size={14} /></button>
              <button style={{ ...S.btnSecondary, padding: '0.45rem' }} disabled={index === slides.length-1} onClick={() => move(index, 'down')}><ChevronDown size={14} /></button>
              <button style={S.btnEdit} onClick={() => openEdit(index)}><Edit2 size={14} /></button>
              <button style={S.btnDanger} onClick={() => remove(index)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {slides.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #2A2D30', borderRadius: '8px', color: 'rgba(255,255,255,0.3)' }}>Nenhum slide. Clique em "+ Adicionar Slide".</div>}
      </div>

      <button style={{ ...S.btnSecondary, width: '100%', justifyContent: 'center', padding: '1rem', border: '1px dashed #2A2D30' }} onClick={() => openEdit(-1)}>
        <Plus size={15} /> Adicionar Slide
      </button>

      {/* Slide Form Modal */}
      {editingIdx !== null && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setEditingIdx(null)}>
          <div style={S.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>{editingIdx === -1 ? 'Novo Slide' : `Editar Slide #${editingIdx + 1}`}</h3>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={() => setEditingIdx(null)}><X size={20} /></button>
            </div>
            <form onSubmit={saveForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {[
                  { key: 'sport', label: 'Esporte', placeholder: 'Ex: Baseball', full: false },
                  { key: 'badge', label: 'Badge', placeholder: '⚾ Summer Collection', full: false },
                  { key: 'title', label: 'Título', placeholder: 'BLUE JAYS JERSEYS', full: true },
                  { key: 'price', label: 'Preço', placeholder: '$49.90 CAD', full: false },
                  { key: 'btnText', label: 'Texto do Botão', placeholder: 'Shop MLB', full: false },
                  { key: 'link', label: 'Link do Botão', placeholder: '/rebrand/colecao/baseball', full: true },
                  { key: 'img', label: 'Imagem do Slide', placeholder: '/assets/rebrand/blue_jays.jpg', full: true },
                  { key: 'featuredProducts', label: 'IDs de Produtos Destacados', placeholder: 'mock-3, mock-4', full: true },
                ].map(f => {
                  if (f.key === 'img') {
                    return (
                      <div key={f.key} style={{ gridColumn: '1 / -1' }}>
                        <label style={S.label}>{f.label}</label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <input style={inputStyle} value={form.img || ''} onChange={e => setForm({...form, img: e.target.value})} placeholder={f.placeholder} required />
                          <label style={{ ...S.btnSecondary, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Upload size={14} />
                            {uploadingImg ? 'Enviando...' : 'Fazer Upload'}
                            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={uploadingImg} />
                          </label>
                        </div>
                        {form.img && (
                          <div style={{ marginTop: '0.5rem', borderRadius: '6px', overflow: 'hidden', height: '100px', border: '1px solid #2A2D30', background: '#0B0C0E', display: 'inline-block' }}>
                            <img src={form.img} alt="Preview" style={{ height: '100%', objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                      <label style={S.label}>{f.label}</label>
                      <input style={inputStyle} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} required={f.key !== 'featuredProducts'} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" style={S.btnSecondary} onClick={() => setEditingIdx(null)}>Cancelar</button>
                <button type="submit" style={S.btnPrimary} disabled={uploadingImg}><Check size={14} /> Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Visual Section (Hero & Season Spotlight) ───────────────────────────────
const VisualSection = ({ showToast }) => {
  const [presets, setPresets] = useState([
    {
      id: 'preset-1',
      title: 'WEAR YOUR TEAM.',
      subtitle: 'THE HOME OF SPORTS JERSEYS.',
      img: '/assets/rebrand/locker_room_hero.jpg',
      active: true
    },
    {
      id: 'preset-2',
      title: 'SUMMER SEASON OFFERS',
      subtitle: 'Get free shipping storewide across Canada.',
      img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200',
      active: false
    },
    {
      id: 'preset-3',
      title: 'NEW ARRIVALS IN HOCKEY',
      subtitle: 'Explore the maple leafs collection now.',
      img: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=1200',
      active: false
    },
    {
      id: 'preset-4',
      title: 'NFL GAMEDAY COLLECTION',
      subtitle: 'Premium stitched NFL jerseys with priority shipping.',
      img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1200',
      active: false
    }
  ]);
  const [selectedId, setSelectedId] = useState('preset-1');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    async function loadHeroPresets() {
      try {
        const { data } = await supabase.from('store_settings').select('value').eq('key', 'rebrand_hero_presets').single();
        if (data?.value) {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPresets(parsed);
            const activePreset = parsed.find(p => p.active);
            if (activePreset) setSelectedId(activePreset.id);
          }
        }
      } catch (err) {
        console.warn("Could not load hero presets:", err);
      }
    }
    loadHeroPresets();
  }, []);

  const currentPreset = presets.find(p => p.id === selectedId) || presets[0];

  const updateCurrentPreset = (fields) => {
    setPresets(prev => prev.map(p => p.id === selectedId ? { ...p, ...fields } : p));
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const url = await uploadImageToSupabase(file);
      updateCurrentPreset({ img: url });
      showToast('Imagem do preset carregada! Clique em Salvar e Publicar.', 'success');
    } catch (err) {
      showToast('Erro no upload: ' + err.message, 'error');
    } finally {
      setUploadingHero(false);
    }
  };

  const handlePublishPreset = (id) => {
    setPresets(prev => prev.map(p => ({ ...p, active: p.id === id })));
    showToast('Layout definido para publicação! Clique em Salvar e Publicar para confirmar.', 'success');
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    try {
      const activePreset = presets.find(p => p.active) || presets[0];
      
      await supabase.from('store_settings').upsert({ key: 'rebrand_hero_presets', value: JSON.stringify(presets) }, { onConflict: 'key' });
      
      await supabase.from('store_settings').upsert({ key: 'rebrand_hero_image', value: activePreset.img }, { onConflict: 'key' });
      await supabase.from('store_settings').upsert({ key: 'rebrand_hero_title', value: activePreset.title }, { onConflict: 'key' });
      await supabase.from('store_settings').upsert({ key: 'rebrand_hero_subtitle', value: activePreset.subtitle }, { onConflict: 'key' });
      
      showToast('Biblioteca de banners salva e publicada com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao salvar biblioteca do Hero: ' + err.message, 'error');
    } finally {
      setSavingHero(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Bloco 1: Hero Banner Presets */}
      <div style={{ ...S.card, padding: '2rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>Hero Banner Principal</h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
          Gerencie e selecione entre 4 layouts pré-configurados para o banner principal da Home
        </p>

        {/* Grade de 2x2 para os 4 Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          {presets.map((p, idx) => {
            const isSelected = p.id === selectedId;
            return (
              <div 
                key={p.id} 
                onClick={() => setSelectedId(p.id)}
                style={{ 
                  flex: 1, 
                  background: '#16191C', 
                  border: isSelected ? '2px solid var(--rebrand-volt)' : '1px solid #2A2D30', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 0 12px rgba(214,255,0,0.1)' : 'none'
                }}
              >
                <div style={{ width: '60px', height: '45px', borderRadius: '4px', overflow: 'hidden', background: '#0B0C0E', flexShrink: 0 }}>
                  <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Layout {idx + 1}: {p.title || 'Sem título'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                    {p.active ? '🟢 Ativo no Site' : '⚪ Rascunho'}
                  </div>
                </div>

                {!p.active && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePublishPreset(p.id); }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '0.65rem',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Publicar
                  </button>
                )}
                {p.active && (
                  <span style={{
                    background: 'rgba(214,255,0,0.15)',
                    color: '#D6FF00',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    No Ar
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Editor do Preset Selecionado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', borderTop: '1px dashed #2A2D30', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              Editando Layout {presets.findIndex(p => p.id === selectedId) + 1}
            </h4>
            <div>
              <label style={S.label}>Título do Hero</label>
              <input style={S.input} value={currentPreset.title} onChange={e => updateCurrentPreset({ title: e.target.value })} placeholder="WEAR YOUR TEAM." />
            </div>
            <div>
              <label style={S.label}>Subtítulo/Descrição</label>
              <input style={S.input} value={currentPreset.subtitle} onChange={e => updateCurrentPreset({ subtitle: e.target.value })} placeholder="THE HOME OF SPORTS JERSEYS." />
            </div>
            <div>
              <label style={S.label}>Imagem de Fundo (Locker Room)</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input style={S.input} value={currentPreset.img} onChange={e => updateCurrentPreset({ img: e.target.value })} placeholder="URL da imagem" />
                <label style={{ ...S.btnSecondary, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Upload size={14} />
                  {uploadingHero ? 'Enviando...' : 'Fazer Upload'}
                  <input type="file" accept="image/*" onChange={handleHeroImageUpload} style={{ display: 'none' }} disabled={uploadingHero} />
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={S.label}>Visualização do Banner</label>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: '180px', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              background: '#0B0C0E',
              border: '1px solid #2A2D30'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundImage: `url(${currentPreset.img})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                filter: 'brightness(0.65)' 
              }} />
              <div style={{ position: 'relative', zIndex: 2, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <h4 style={{ color: '#fff', margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                  {currentPreset.title}
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 0.75rem 0', fontSize: '0.75rem' }}>
                  {currentPreset.subtitle}
                </p>
                <button style={{ alignSelf: 'flex-start', background: '#D6FF00', color: '#000', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                  SHOP JERSEYS
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {!currentPreset.active && (
            <button 
              type="button" 
              style={{ ...S.btnSecondary }}
              onClick={() => handlePublishPreset(currentPreset.id)}
            >
              Definir como Ativo
            </button>
          )}
          <button style={S.btnPrimary} onClick={handleSaveHero} disabled={savingHero || uploadingHero}>
            <Save size={14} />
            {savingHero ? 'Salvando...' : 'Salvar e Publicar no Site'}
          </button>
        </div>
      </div>

      {/* Bloco 2: Season Spotlight */}
      <SpotlightSection showToast={showToast} />
    </div>
  );
};

// ─── Coupons Section ──────────────────────────────────────────────────────────
const CouponsSection = ({ showToast }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', discount_percent: '', agent_id: '', id: null });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_percent: parseFloat(form.discount_percent),
      agent_id: form.agent_id ? form.agent_id.trim() : null,
      is_active: true,
    };

    let error;
    if (editingCoupon) {
      const { error: err } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('coupons').insert([payload]);
      error = err;
    }

    setSaving(false);
    if (error) { 
      showToast('Erro ao salvar cupom: ' + error.message, 'error'); 
      return; 
    }
    showToast(editingCoupon ? 'Cupom atualizado!' : 'Cupom criado!', 'success');
    setForm({ code: '', discount_percent: '', agent_id: '', id: null });
    setShowForm(false);
    setEditingCoupon(null);
    load();
  };

  const handleEditClick = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      agent_id: coupon.agent_id || '',
      id: coupon.id
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { data, error } = await supabase.from('coupons').delete().eq('id', confirmDelete).select();
    setConfirmDelete(null);
    if (error) { 
      showToast('Erro ao deletar: ' + error.message, 'error'); 
    } else if (!data || data.length === 0) {
      showToast('Erro RLS: Você não tem permissão para excluir este cupom.', 'error');
    } else { 
      showToast('Cupom removido!', 'success'); 
      load(); 
    }
  };

  return (
    <div>
      <SectionHeader title="Cupons de Desconto" sub={`${coupons.length} cupons ativos`} action={<button style={S.btnPrimary} onClick={() => { setEditingCoupon(null); setForm({ code: '', discount_percent: '', agent_id: '', id: null }); setShowForm(v => !v); }}><Plus size={14} /> Novo Cupom</button>} />

      {showForm && (
        <div style={{ ...S.card, marginBottom: '1.5rem', border: '1px solid rgba(214,255,0,0.2)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, color: '#D6FF00', fontSize: '1rem' }}>
            {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </h3>
          <form onSubmit={handleCreateOrUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={S.label}>Código</label>
                <input style={S.input} required value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="SUMMER20" />
              </div>
              <div>
                <label style={S.label}>Desconto (%)</label>
                <input style={S.input} type="number" min="1" max="100" required value={form.discount_percent} onChange={e => setForm({...form, discount_percent: e.target.value})} placeholder="20" />
              </div>
              <div>
                <label style={S.label}>Afiliado / Agent ID (Opcional)</label>
                <input style={S.input} value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value})} placeholder="Ex: BEAVER" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" style={S.btnSecondary} onClick={() => { setShowForm(false); setEditingCoupon(null); }}>Cancelar</button>
              <button type="submit" style={S.btnPrimary} disabled={saving}><Save size={14} />{saving ? 'Salvando...' : (editingCoupon ? 'Atualizar Cupom' : 'Criar Cupom')}</button>
            </div>
          </form>
        </div>
      )}

      <div style={S.card}>
        {loading ? <Loader /> : (
          <table style={S.table}>
            <thead>
              <tr>{['Código', 'Desconto', 'Afiliado / Agent', 'Status', 'Ações'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td style={S.td}><code style={{ background: 'rgba(214,255,0,0.1)', color: '#D6FF00', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>{c.code}</code></td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{c.discount_percent}% OFF</td>
                  <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)' }}>{c.agent_id || '—'}</td>
                  <td style={S.td}>
                    <span style={{ padding: '0.2rem 0.6rem', background: c.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: c.is_active ? '#4ADE80' : 'rgba(255,255,255,0.3)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {c.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={S.btnEdit} onClick={() => handleEditClick(c)}><Edit2 size={14} /></button>
                      <button style={S.btnDanger} onClick={() => setConfirmDelete(c.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhum cupom cadastrado.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ ...S.modalBox, maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.75rem', fontWeight: 700 }}>Confirmar Exclusão</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2rem', fontSize: '0.9rem' }}>
              Esta ação é irreversível. O cupom será removido permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button style={S.btnSecondary} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button style={{ ...S.btnPrimary, background: '#F87171', color: '#fff' }} onClick={handleDelete}>Sim, Deletar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Settings Section ─────────────────────────────────────────────────────────
const SettingsSection = ({ showToast }) => {
  const [settings, setSettings] = useState({ whatsapp: '', supplier_email: '', pricing: { cost: '', markup: '' } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('store_settings').select('*').in('key', ['whatsapp_number', 'supplier_email', 'pricing']);
      const map = {};
      (data || []).forEach(r => { map[r.key] = r.value; });
      const pricing = map.pricing ? (() => { try { return JSON.parse(map.pricing); } catch { return {}; } })() : {};
      setSettings({ whatsapp: map.whatsapp_number || '', supplier_email: map.supplier_email || '', pricing: { cost: pricing.cost || '', markup: pricing.markup || '' } });
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const rows = [
      { key: 'whatsapp_number', value: settings.whatsapp.trim() },
      { key: 'supplier_email', value: settings.supplier_email.trim() },
      { key: 'pricing', value: JSON.stringify(settings.pricing) },
    ];
    const { error } = await supabase.from('store_settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (error) { showToast('Erro ao salvar configurações.', 'error'); } else { showToast('Configurações salvas!', 'success'); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <SectionHeader title="Configurações" sub="Configurações gerais da loja" action={<button style={S.btnPrimary} onClick={handleSave} disabled={saving}><Save size={14} />{saving ? 'Salvando...' : 'Salvar Tudo'}</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem' }}>📱 WhatsApp</h3>
          <label style={S.label}>Número do WhatsApp</label>
          <input style={S.input} value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} placeholder="+15197531359" />
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.5rem' }}>Formato internacional. Ex: +15197531359</p>
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem' }}>📧 Email do Fornecedor</h3>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" value={settings.supplier_email} onChange={e => setSettings({...settings, supplier_email: e.target.value})} placeholder="supplier@example.com" />
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.5rem' }}>Email que recebe notificações de pedidos.</p>
        </div>

        <div style={{ ...S.card, gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem' }}>💰 Precificação</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={S.label}>Custo Base ($)</label>
              <input style={S.input} type="number" step="0.01" value={settings.pricing.cost} onChange={e => setSettings({...settings, pricing: {...settings.pricing, cost: e.target.value}})} placeholder="Ex: 25.00" />
            </div>
            <div>
              <label style={S.label}>Markup (%)</label>
              <input style={S.input} type="number" step="0.01" value={settings.pricing.markup} onChange={e => setSettings({...settings, pricing: {...settings.pricing, markup: e.target.value}})} placeholder="Ex: 80" />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.75rem' }}>Estes valores são usados para calcular margens no painel de produção.</p>
        </div>
      </div>
    </div>
  );
};

// ─── Financeiro Section ──────────────────────────────────────────────────────
const FinanceiroSection = ({ showToast }) => {
  const [orders, setOrders] = useState([]);
  const [pricing, setPricing] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ data: dbOrders }, { data: settings }, { data: dbCoupons }] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('store_settings').select('*'),
          supabase.from('coupons').select('*')
        ]);
        setOrders(dbOrders || []);
        setCoupons(dbCoupons || []);

        const defaultPricing = {
          exchangeRateFallback: 1.38,
          costFan: 9.00,
          costPlayer: 15.00,
          costRetro: 15.00,
          costLongSleeve: 12.00,
          costKids: 11.00,
          costBaby: 8.00,
          costTraining: 17.00,
          costShorts: 8.00,
          costNBA: 17.00,
          costNFL: 23.00,
          costAdd2XL: 1.00,
          costAdd3XL4XL: 2.00,
          costAddPatch: 1.00,
          costAddCustom: 3.00,
          surcharge1Item: 5.00,
          surcharge2Items: 4.00,
          surcharge3Items: 3.00
        };

        let pricingData = defaultPricing;
        if (settings) {
          const pricingRecord = settings.find(s => s.key === 'pricing');
          if (pricingRecord) {
            try {
              pricingData = JSON.parse(pricingRecord.value);
            } catch (e) {
              console.error(e);
            }
          }
        }
        setPricing(pricingData);
      } catch (e) {
        console.error(e);
        showToast('Erro ao carregar dados financeiros.', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const calculateItemBaseCostUSD = (item) => {
    const name = (item.name || '').toLowerCase();
    const c = pricing;
    if (name.includes('nba')) return c.costNBA || 17;
    if (name.includes('nfl')) return c.costNFL || 23;
    if (name.includes('jogador') || name.includes('player')) return c.costPlayer || 15;
    if (name.includes('retrô') || name.includes('retro')) return c.costRetro || 15;
    if (name.includes('manga longa') || name.includes('long sleeve')) return c.costLongSleeve || 12;
    if (name.includes('kit infantil') || name.includes('kids')) return c.costKids || 11;
    if (name.includes('baby') || name.includes('body')) return c.costBaby || 8;
    if (name.includes('treino') || name.includes('training')) return c.costTraining || 17;
    if (name.includes('short') || name.includes('bermuda')) return c.costShorts || 8;
    return c.costFan || 9;
  };

  const getValidRevenue = (order) => {
    if (order?.payment_method === 'parceria') return 0;
    const gross = Number(order?.total_price || order?.total || 0);
    if (order?.payment_method === 'paypal') {
      return gross - (gross * 0.029) - 0.30;
    }
    return gross;
  };

  const getCalgaryDateStr = (dateInput) => {
    if (!dateInput) return '';
    try {
      const d = new Date(dateInput);
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Edmonton',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d).replace(',', ' às');
    } catch (e) {
      return '';
    }
  };

  const getOrderCommissionBreakdown = (order) => {
    if (!order || !order.referrer || order.payment_method === 'parceria') return null;
    const rawRef = order.referrer || 'Sem Indicação';
    const coupon = coupons.find(c => c.code === rawRef.toUpperCase());
    const agentName = coupon ? (coupon.agent_id || rawRef) : rawRef;
    if (!agentName || agentName === 'Sem Indicação') return null;

    const agentOrders = orders.filter(o => {
      const oRef = o.referrer || 'Sem Indicação';
      const oCoupon = coupons.find(c => c.code === oRef.toUpperCase());
      const oAgent = oCoupon ? (oCoupon.agent_id || oRef) : oRef;
      return oAgent === agentName;
    });

    const agentOrdersCount = agentOrders.length;
    let rate = 0.08;
    if (agentOrdersCount >= 51) rate = 0.15;
    else if (agentOrdersCount >= 26) rate = 0.12;
    else if (agentOrdersCount >= 11) rate = 0.10;

    const base = getValidRevenue(order) * rate;
    const orderDateStr = order.created_at ? getCalgaryDateStr(order.created_at) : '';
    const isCopaPeriod = orderDateStr >= '2026-06-11' && orderDateStr <= '2026-07-19';
    const seasonal = isCopaPeriod ? getValidRevenue(order) * 0.05 : 0;

    const sortedAgentOrders = [...agentOrders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const orderRank = sortedAgentOrders.findIndex(o => o.id === order.id) + 1;

    let performance = 0;
    if (orderRank === 1) performance = 5;
    if (orderRank === 5) performance = 10;
    if (orderRank === 10) performance = 15;

    return {
      agentName,
      base,
      seasonal,
      performance,
      total: base + seasonal + performance,
      rank: orderRank
    };
  };

  const calculateOrderCommission = (order) => {
    const breakdown = getOrderCommissionBreakdown(order);
    return breakdown ? breakdown.total : 0;
  };

  const calculateOrderCost = (order) => {
    if (!order) return 0;
    const parsedItems = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch { return []; } })() : []);
    const rate = order.usd_cad_rate || pricing.exchangeRateFallback || 1.38;
    
    const itemsCostUSD = parsedItems.reduce((acc, item) => {
      const baseUSD = calculateItemBaseCostUSD(item);
      let addonsUSD = 0;
      const size = item.size || 'M';
      if (size === '2XL') addonsUSD += (pricing.costAdd2XL || 1);
      if (['3XL', '4XL'].includes(size)) addonsUSD += (pricing.costAdd3XL4XL || 2);
      if (item.extras?.nameNumber) addonsUSD += (pricing.costAddCustom || 3);
      if (item.extras?.patch) addonsUSD += (pricing.costAddPatch || 1);
      return acc + ((baseUSD + addonsUSD) * (item.quantity || 1));
    }, 0);

    const totalItems = parsedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    let surchargeUSD = 0;
    if (totalItems === 1) surchargeUSD = pricing.surcharge1Item || 5;
    else if (totalItems === 2) surchargeUSD = pricing.surcharge2Items || 4;
    else if (totalItems === 3) surchargeUSD = pricing.surcharge3Items || 3;
    
    const baseCostCAD = (itemsCostUSD + surchargeUSD) * rate;
    const commissionCAD = calculateOrderCommission(order);
    return baseCostCAD + commissionCAD;
  };

  if (loading) return <Loader />;

  const monthlyStats = orders.reduce((acc, order) => {
    const dateStr = order.created_at;
    if (!dateStr) return acc;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return acc;
    
    const calgaryDateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' });
    const [cYear, cMonth] = calgaryDateStr.split('-').map(Number);
    const key = `${cMonth}-${cYear}`;
    const monthLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Edmonton' });
    const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    
    if (!acc[key]) {
      acc[key] = {
        key,
        label: capitalizedLabel,
        orderCount: 0,
        shirtCount: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        paypalVolume: 0,
        transferVolume: 0,
        partnerVolume: 0,
        year: cYear
      };
    }
    
    const isCancelled = order.status === 'cancelled';
    if (!isCancelled) {
      acc[key].orderCount++;
      const parsedItems = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items); } catch { return []; } })() : []);
      const itemsCount = parsedItems.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
      acc[key].shirtCount += itemsCount;

      const revenue = getValidRevenue(order);
      const cost = calculateOrderCost(order);
      const profit = revenue - cost;
      
      acc[key].revenue += revenue;
      acc[key].cost += cost;
      acc[key].profit += profit;
      
      if (order.payment_method === 'paypal') {
        acc[key].paypalVolume += revenue;
      } else if (order.payment_method === 'parceria') {
        acc[key].partnerVolume += revenue;
      } else {
        acc[key].transferVolume += revenue;
      }
    }
    
    return acc;
  }, {});

  const sortedMonths = Object.values(monthlyStats).sort((a, b) => {
    const [aMonth, aYear] = a.key.split('-').map(Number);
    const [bMonth, bYear] = b.key.split('-').map(Number);
    if (aYear !== bYear) return bYear - aYear;
    return bMonth - aMonth;
  });

  const totals = sortedMonths.reduce((t, m) => {
    t.revenue += m.revenue;
    t.cost += m.cost;
    t.profit += m.profit;
    t.shirtCount += m.shirtCount;
    t.orderCount += m.orderCount;
    t.paypalVolume += m.paypalVolume;
    t.transferVolume += m.transferVolume;
    return t;
  }, { revenue: 0, cost: 0, profit: 0, shirtCount: 0, orderCount: 0, paypalVolume: 0, transferVolume: 0 });

  const averageMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  const averageTicket = totals.orderCount > 0 ? totals.revenue / totals.orderCount : 0;

  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
  const fallbackLabelRaw = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const fallbackLabel = fallbackLabelRaw.charAt(0).toUpperCase() + fallbackLabelRaw.slice(1);
  const currentMonthData = monthlyStats[currentMonthKey] || { shirtCount: 0, label: fallbackLabel };
  const currentMonthShirts = currentMonthData.shirtCount;
  const targetGoal = 90;
  const realPercent = (currentMonthShirts / targetGoal) * 100;
  const goalPercent = Math.min(100, realPercent);

  return (
    <div>
      <SectionHeader 
        title="DRE & Faturamento Executivo" 
        sub="Visão geral de faturamento, custos e margem líquida" 
        action={
          <button style={S.btnSecondary} onClick={() => setShowValues(!showValues)}>
            {showValues ? <EyeOff size={14} /> : <Eye size={14} />} {showValues ? 'Ocultar Valores' : 'Mostrar Valores'}
          </button>
        } 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <KpiCard label="Receita Bruta" value={showValues ? `$${totals.revenue.toFixed(2)}` : '****'} icon={DollarSign} color="#D6FF00" sub="Receita líquida após taxas PayPal" />
        <KpiCard label="Custo Operacional" value={showValues ? `$${totals.cost.toFixed(2)}` : '****'} icon={Package} color="#F87171" sub="Custos de fabricação + frete" />
        <KpiCard label="Lucro Líquido Real" value={showValues ? `$${totals.profit.toFixed(2)}` : '****'} icon={TrendingUp} color="#4ADE80" sub={showValues ? `${averageMargin.toFixed(1)}% de margem média` : '****'} />
        <KpiCard 
          label={`Meta Mensal (${currentMonthData.label})`} 
          value={`${currentMonthShirts} / ${targetGoal} camisas`} 
          icon={Shirt} 
          color="#FB923C" 
          sub={
            <div style={{ width: '100%' }}>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
                <div style={{ width: `${goalPercent}%`, height: '100%', background: '#FB923C', borderRadius: '2px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginTop: '0.2rem', color: 'rgba(255,255,255,0.45)' }}>
                <span>Progresso: {realPercent.toFixed(0)}%</span>
                <span>{currentMonthShirts >= targetGoal ? 'Meta batida! 🎉' : `Faltam ${targetGoal - currentMonthShirts}`}</span>
              </div>
            </div>
          } 
        />
      </div>

      <div style={{ ...S.card, marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 700, fontSize: '1rem', color: '#D6FF00' }}>Histórico Mensal Consolidado</h3>
        <div className="table-responsive">
          <table style={S.table}>
            <thead>
              <tr>
                {['Mês / Ano', 'Pedidos', 'Camisas', 'Faturamento', 'Custos', 'Lucro Líquido', 'Margem'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortedMonths.map(m => {
                const margin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
                return (
                  <tr key={m.key}>
                    <td style={{ ...S.td, fontWeight: 700 }}>{m.label}</td>
                    <td style={S.td}>{m.orderCount}</td>
                    <td style={S.td}>{m.shirtCount}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: '#D6FF00' }}>{showValues ? `$${m.revenue.toFixed(2)}` : '****'}</td>
                    <td style={S.td}>{showValues ? `$${m.cost.toFixed(2)}` : '****'}</td>
                    <td style={{ ...S.td, color: '#4ADE80', fontWeight: 700 }}>{showValues ? `$${m.profit.toFixed(2)}` : '****'}</td>
                    <td style={{ ...S.td, color: '#4ADE80', fontWeight: 700 }}>{showValues ? `${margin.toFixed(1)}%` : '****'}</td>
                  </tr>
                );
              })}
              {sortedMonths.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhum faturamento registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 700, fontSize: '1rem', color: '#D6FF00' }}>Meios de Pagamento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>Interac e-Transfer</span>
                <span style={{ fontWeight: 700 }}>{showValues ? `$${totals.transferVolume.toFixed(2)}` : '****'} ({totals.revenue > 0 ? ((totals.transferVolume / totals.revenue) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#D6FF00', width: `${totals.revenue > 0 ? (totals.transferVolume / totals.revenue) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>PayPal</span>
                <span style={{ fontWeight: 700 }}>{showValues ? `$${totals.paypalVolume.toFixed(2)}` : '****'} ({totals.revenue > 0 ? ((totals.paypalVolume / totals.revenue) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#60A5FA', width: `${totals.revenue > 0 ? (totals.paypalVolume / totals.revenue) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Cidades Atendidas Section ───────────────────────────────────────────────
const CidadesSection = ({ showToast }) => {
  const [orders, setOrders] = useState([]);
  const [trackingCaches, setTrackingCaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProvinces, setExpandedProvinces] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ data: dbOrders }, { data: dbCaches }] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('tracking_cache').select('*')
        ]);
        setOrders(dbOrders || []);
        setTrackingCaches(dbCaches || []);
      } catch (e) {
        console.error(e);
        showToast('Erro ao carregar dados geográficos.', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const normalizeCity = (c) => {
    let city = (c || 'N/A').split('(')[0].split('/')[0].trim();
    if (city.toUpperCase() === 'N') return 'Winnipeg';
    if (city.toLowerCase().includes('calgary')) return 'Calgary';
    if (city.toLowerCase().includes('charlottetown')) return 'Charlottetown';
    if (city.toLowerCase() === 'mont-royal' || city.toLowerCase() === 'mont royal' || city.toLowerCase() === 'montreal' || city.toLowerCase() === 'montréal') {
      return 'Montréal';
    }
    return city;
  };

  const ALL_REGION_ALIASES = {
    'AB': 'AB', 'ALBERTA': 'AB',
    'BC': 'BC', 'BRITISH COLUMBIA': 'BC',
    'MB': 'MB', 'MANITOBA': 'MB',
    'NB': 'NB', 'NEW BRUNSWICK': 'NB',
    'NL': 'NL', 'NEWFOUNDLAND': 'NL', 'NEWFOUNDLAND AND LABRADOR': 'NL', 'NEWFOUNDLAND & LABRADOR': 'NL',
    'NS': 'NS', 'NOVA SCOTIA': 'NS',
    'NT': 'NT', 'NORTHWEST TERRITORIES': 'NT',
    'NU': 'NU', 'NUNAVUT': 'NU',
    'ON': 'ON', 'ONTARIO': 'ON',
    'PE': 'PE', 'PRINCE EDWARD ISLAND': 'PE', 'PEI': 'PE',
    'QC': 'QC', 'QUEBEC': 'QC', 'QUÉBEC': 'QC',
    'SK': 'SK', 'SASKATCHEWAN': 'SK',
    'YT': 'YT', 'YUKON': 'YT'
  };

  const normalizeProvinceOrState = (p) => {
    if (!p) return '';
    const upper = p.trim().toUpperCase();
    return ALL_REGION_ALIASES[upper] || p.trim();
  };

  const getDaysDiff = (startStr, endStr) => {
    if (!startStr || !endStr) return null;
    const parseDatePart = (str) => {
      if (!str) return null;
      return str.includes(' às ') ? str.split(' às ')[0] : str.split(' ')[0];
    };
    const startPart = parseDatePart(startStr);
    const endPart = parseDatePart(endStr);
    if (!startPart || !endPart) return null;
    const startParts = startPart.split('-');
    const endParts = endPart.split('-');
    if (startParts.length !== 3 || endParts.length !== 3) return null;
    const dStart = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10));
    const dEnd = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10));
    if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime())) return null;
    const diffTime = dEnd - dStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const activeTrackingCodes = React.useMemo(() => {
    const codes = new Set();
    orders.forEach(o => {
      if (o.tracking_number && o.status !== 'cancelled') {
        o.tracking_number.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean).forEach(c => {
          codes.add(c.toUpperCase());
        });
      }
    });
    return Array.from(codes);
  }, [orders]);

  const missingCachesCount = React.useMemo(() => {
    const cachedSet = new Set(trackingCaches.map(tc => tc.tracking_number?.trim().toUpperCase()).filter(Boolean));
    return activeTrackingCodes.filter(c => !cachedSet.has(c)).length;
  }, [activeTrackingCodes, trackingCaches]);

  const handleSyncTracking = async () => {
    if (syncing) return;
    setSyncing(true);
    const cachedSet = new Set(trackingCaches.map(tc => tc.tracking_number?.trim().toUpperCase()).filter(Boolean));
    const toSync = activeTrackingCodes.filter(c => !cachedSet.has(c));
    setSyncTotal(toSync.length);
    setSyncProgress(0);

    let newCaches = [...trackingCaches];

    for (let i = 0; i < toSync.length; i++) {
      const code = toSync[i];
      try {
        const { data, error } = await supabase.functions.invoke('track-package', {
          body: { trackingNumber: code, forceRefresh: false }
        });
        
        if (!error && data) {
          const newCacheEntry = {
            tracking_number: code,
            status_data: data,
            last_updated: new Date().toISOString()
          };
          newCaches = [newCacheEntry, ...newCaches];
          setTrackingCaches(newCaches);
        }
      } catch (err) {
        console.warn(`Erro ao sincronizar código ${code}:`, err);
      }
      setSyncProgress(i + 1);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setSyncing(false);
    showToast('Sincronização concluída com sucesso!', 'success');
  };

  if (loading) return <Loader />;

  const cityStats = orders.reduce((acc, order) => {
    if (order.status === 'cancelled') return acc;
    const rawCity = order.shipping_address?.city || 'N/A';
    const city = normalizeCity(rawCity);
    let province = normalizeProvinceOrState(order.shipping_address?.province || '');
    if (province.toUpperCase() === 'N/A') province = '';
    
    if (city === 'Winnipeg' && (!province || province.trim() === '')) {
      province = 'MB';
    }
    if (city === 'Charlottetown' && (!province || province.trim() === '' || province.trim() === 'N/A')) {
      province = 'PE';
    }
    if (city === 'Montréal' && (!province || province.trim() === '' || province.trim() === 'N/A')) {
      province = 'QC';
    }
    const key = `${city}${province ? `, ${province}` : ''}`;
    if (!acc[key]) acc[key] = { count: 0, revenue: 0, deliveryTimes: [], shirts: 0, customerEmails: new Set(), customers: [] };
    acc[key].count++;
    acc[key].revenue += Number(order.total_price || order.total || 0);
    const itemCount = Array.isArray(order.items) 
      ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      : (typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0); } catch { return 1; } })() : 1);
    acc[key].shirts += itemCount;
    
    if (order.customer_email) {
      acc[key].customerEmails.add(order.customer_email.trim().toLowerCase());
    } else if (order.customer_name) {
      acc[key].customerEmails.add(order.customer_name.trim().toLowerCase());
    } else {
      acc[key].customerEmails.add(order.id);
    }

    const customerName = order.customer_name ? order.customer_name.trim() : (order.customer_email ? order.customer_email.trim() : 'N/A');
    if (!acc[key].customers.includes(customerName)) {
      acc[key].customers.push(customerName);
    }

    if (order.tracking_number) {
      const codes = order.tracking_number.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean);
      codes.forEach(code => {
        const cache = trackingCaches.find(tc => tc.tracking_number?.trim().toUpperCase() === code.toUpperCase());
        if (cache && cache.status_data) {
          const statusData = cache.status_data;
          const history = statusData.history || [];
          const trackingData = statusData.trackingData;

          let deliveredEvent = history.find(item => {
            const status = (item.status || '').toLowerCase();
            return status.includes('entregue') || status.includes('assinado') || status.includes('delivered');
          });

          if (!deliveredEvent && order.status === 'completed' && history.length > 0) {
            deliveredEvent = history[0];
          }

          if (deliveredEvent) {
            const startDate = trackingData?.date || (history.length > 0 ? (history[history.length - 1].date || history[history.length - 1].rawDate) : null);
            const endDate = deliveredEvent.date || deliveredEvent.rawDate;
            if (startDate && endDate) {
              const days = getDaysDiff(startDate, endDate);
              if (days !== null) {
                acc[key].deliveryTimes.push(days);
              }
            }
          }
        }
      });
    }

    return acc;
  }, {});

  const sortedCities = Object.entries(cityStats).sort((a, b) => b[1].count - a[1].count);

  const allTimes = [];
  Object.values(cityStats).forEach(data => {
    if (data.deliveryTimes) {
      allTimes.push(...data.deliveryTimes);
    }
  });
  const globalAvgDays = allTimes.length > 0
    ? allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length
    : null;

  const canadianProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'];
  const uniqueProvinces = new Set(
    Object.keys(cityStats)
      .map(k => k.split(',')[1]?.trim()?.toUpperCase())
      .filter(p => p && canadianProvinces.includes(p))
  );
  const totalCities = Object.keys(cityStats).length;
  const totalProvinces = uniqueProvinces.size;
  const totalShirtsCA = Object.values(cityStats).reduce((sum, d) => sum + d.shirts, 0);

  const canadaProvincesMap = {
    'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia', 'ON': 'Ontario',
    'PE': 'Prince Edward Island', 'QC': 'Quebec', 'SK': 'Saskatchewan',
    'YT': 'Yukon', 'NT': 'Northwest Territories', 'NU': 'Nunavut'
  };

  const usStatesMap = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'US': 'United States'
  };

  const grouped = { canada: {}, usa: {}, other: {} };
  sortedCities.forEach(([key, data]) => {
    const parts = key.split(', ');
    const cityName = parts[0];
    const provinceAbbr = parts[1] ? parts[1].trim().toUpperCase() : 'N/A';
    const cityInfo = { cityName, provinceAbbr, key, ...data };
    if (canadaProvincesMap[provinceAbbr]) {
      if (!grouped.canada[provinceAbbr]) {
        grouped.canada[provinceAbbr] = { name: canadaProvincesMap[provinceAbbr], cities: [], totalShirts: 0, customerEmails: new Set() };
      }
      grouped.canada[provinceAbbr].cities.push(cityInfo);
      grouped.canada[provinceAbbr].totalShirts += data.shirts;
      if (data.customerEmails) {
        data.customerEmails.forEach(email => grouped.canada[provinceAbbr].customerEmails.add(email));
      }
    } else if (usStatesMap[provinceAbbr] || provinceAbbr === 'US') {
      const stateName = usStatesMap[provinceAbbr] || 'United States';
      if (!grouped.usa[provinceAbbr]) {
        grouped.usa[provinceAbbr] = { name: stateName, cities: [], totalShirts: 0, customerEmails: new Set() };
      }
      grouped.usa[provinceAbbr].cities.push(cityInfo);
      grouped.usa[provinceAbbr].totalShirts += data.shirts;
      if (data.customerEmails) {
        data.customerEmails.forEach(email => grouped.usa[provinceAbbr].customerEmails.add(email));
      }
    } else {
      if (!grouped.other[provinceAbbr]) {
        grouped.other[provinceAbbr] = { name: provinceAbbr === 'N/A' ? 'Outros / Sem Província' : provinceAbbr, cities: [], totalShirts: 0, customerEmails: new Set() };
      }
      grouped.other[provinceAbbr].cities.push(cityInfo);
      grouped.other[provinceAbbr].totalShirts += data.shirts;
      if (data.customerEmails) {
        data.customerEmails.forEach(email => grouped.other[provinceAbbr].customerEmails.add(email));
      }
    }
  });

  const sortedCanada = Object.entries(grouped.canada).sort((a, b) => b[1].totalShirts - a[1].totalShirts);
  const sortedUsa = Object.entries(grouped.usa).sort((a, b) => b[1].totalShirts - a[1].totalShirts);
  const sortedOther = Object.entries(grouped.other).sort((a, b) => b[1].totalShirts - a[1].totalShirts);

  const provCounts = {};
  orders.forEach(o => {
    if (o.status === 'cancelled') return;
    const prov = normalizeProvince(o.shipping_address?.province);
    if (prov) {
      const itemCount = Array.isArray(o.items) 
        ? o.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
        : (typeof o.items === 'string' ? (() => { try { return JSON.parse(o.items).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0); } catch { return 1; } })() : 1);
      provCounts[prov] = (provCounts[prov] || 0) + itemCount;
    }
  });

  return (
    <div>
      <SectionHeader title="Onde suas camisas estão?" sub="Mapeamento e distribuição de pedidos por cidades atendidas" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ ...S.card, borderLeft: '4px solid #D6FF00', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>Cidades Atendidas</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(214,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={16} color="#D6FF00" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{totalCities}</div>
        </div>

        <div style={{ ...S.card, borderLeft: '4px solid #4ADE80', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>Total Camisas</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shirt size={16} color="#4ADE80" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{totalShirtsCA}</div>
        </div>

        <div style={{ ...S.card, borderLeft: '4px solid #A855F7', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>Prazo Médio Global</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={16} color="#A855F7" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{globalAvgDays !== null ? `${globalAvgDays.toFixed(1)} dias` : 'N/A'}</div>
        </div>
      </div>

      <div style={{ ...S.card, borderLeft: '4px solid #3B82F6', padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>Províncias Atendidas</span>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={16} color="#3B82F6" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{totalProvinces} / 10</div>
          
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'].map(prov => {
              const isActive = uniqueProvinces.has(prov);
              const fullName = canadaProvincesMap[prov] || prov;
              const count = provCounts[prov] || 0;
              return (
                <div 
                  key={prov} 
                  onMouseEnter={() => setActiveTooltip({ prov, name: fullName, count })}
                  onMouseLeave={() => setActiveTooltip(null)}
                  style={{ position: 'relative' }}
                >
                  <div 
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#4ADE80' : 'rgba(255, 255, 255, 0.25)',
                      border: `1px solid ${isActive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                      transition: 'all 0.2s',
                      cursor: 'default'
                    }}
                  >
                    {prov}
                  </div>
                  {activeTooltip && activeTooltip.prov === prov && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: '100%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        background: '#0a0a0a',
                        border: '2px solid #D6FF00',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 999,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 900, color: '#D6FF00', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>
                        {activeTooltip.name}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                        {activeTooltip.count} {activeTooltip.count === 1 ? 'camisa' : 'camisas'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {missingCachesCount > 0 && (
        <div style={{
          background: 'rgba(214, 255, 0, 0.04)',
          border: '1px solid rgba(214, 255, 0, 0.15)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '0.95rem', color: '#D6FF00' }}>
              ℹ️ Códigos de rastreio pendentes
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
              Existem {missingCachesCount} códigos de rastreio de pedidos ativos que ainda não foram consultados pelo sistema. Sincronize-os para obter a média de dias de entrega de todas as cidades.
            </p>
          </div>
          <button 
            style={syncing ? S.btnSecondary : S.btnPrimary} 
            onClick={handleSyncTracking} 
            disabled={syncing}
          >
            {syncing ? `Sincronizando (${syncProgress}/${syncTotal})` : 'Sincronizar Rastreios'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', marginBottom: '2.5rem' }} className="admin-grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {sortedCanada.length > 0 && (
            <div>
              <h4 style={{ color: '#D6FF00', fontSize: '1.1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1A1D20', paddingBottom: '0.5rem' }}>
                🇨🇦 Canadá
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedCanada.map(([provCode, data]) => {
                  const isExpanded = !!expandedProvinces[provCode];
                  return (
                    <div key={provCode} style={{ background: '#121416', border: '1px solid #1A1D20', borderRadius: '12px', overflow: 'hidden' }}>
                      <button 
                        onClick={() => setExpandedProvinces(prev => ({ ...prev, [provCode]: !prev[provCode] }))}
                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: 700 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1rem', color: '#fff' }}>{data.name} ({provCode})</span>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'normal' }}>
                            • {data.cities.length} {data.cities.length === 1 ? 'cidade' : 'cidades'} • {data.customerEmails.size} {data.customerEmails.size === 1 ? 'cliente' : 'clientes'} ({data.totalShirts} {data.totalShirts === 1 ? 'camisa' : 'camisas'})
                          </span>
                        </div>
                        <span style={{ color: '#D6FF00', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▼</span>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: '1.25rem', background: '#0F1012', borderTop: '1px solid #1A1D20', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                          {data.cities.map(cityInfo => {
                            const avgDeliveryTime = cityInfo.deliveryTimes && cityInfo.deliveryTimes.length > 0
                              ? cityInfo.deliveryTimes.reduce((sum, t) => sum + t, 0) / cityInfo.deliveryTimes.length
                              : null;
                            return (
                              <div key={cityInfo.key} style={{ background: '#121416', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1A1D20', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>{cityInfo.cityName}</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                                  {cityInfo.customerEmails.size} {cityInfo.customerEmails.size === 1 ? 'cliente' : 'clientes'} • {cityInfo.shirts} {cityInfo.shirts === 1 ? 'camisa' : 'camisas'}
                                </p>
                                {cityInfo.customers && cityInfo.customers.length > 0 && (
                                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', wordBreak: 'break-word' }}>
                                    <strong>Clientes:</strong> {cityInfo.customers.join(', ')}
                                  </p>
                                )}
                                {avgDeliveryTime !== null ? (
                                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Truck size={12} /> Média de entrega: {avgDeliveryTime.toFixed(1)} dias
                                  </p>
                                ) : (
                                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Truck size={12} /> Sem dados de entrega
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sortedUsa.length > 0 && (
            <div>
              <h4 style={{ color: '#60A5FA', fontSize: '1.1rem', margin: '1.5rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1A1D20', paddingBottom: '0.5rem' }}>
                🇺🇸 Estados Unidos
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedUsa.map(([provCode, data]) => {
                  const isExpanded = !!expandedProvinces[provCode];
                  return (
                    <div key={provCode} style={{ background: '#121416', border: '1px solid #1A1D20', borderRadius: '12px', overflow: 'hidden' }}>
                      <button 
                        onClick={() => setExpandedProvinces(prev => ({ ...prev, [provCode]: !prev[provCode] }))}
                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: 700 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1rem', color: '#fff' }}>{data.name} ({provCode})</span>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'normal' }}>
                            • {data.cities.length} {data.cities.length === 1 ? 'cidade' : 'cidades'} • {data.customerEmails.size} {data.customerEmails.size === 1 ? 'cliente' : 'clientes'} ({data.totalShirts} {data.totalShirts === 1 ? 'camisa' : 'camisas'})
                          </span>
                        </div>
                        <span style={{ color: '#D6FF00', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▼</span>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: '1.25rem', background: '#0F1012', borderTop: '1px solid #1A1D20', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                          {data.cities.map(cityInfo => {
                            const avgDeliveryTime = cityInfo.deliveryTimes && cityInfo.deliveryTimes.length > 0
                              ? cityInfo.deliveryTimes.reduce((sum, t) => sum + t, 0) / cityInfo.deliveryTimes.length
                              : null;
                            return (
                              <div key={cityInfo.key} style={{ background: '#121416', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1A1D20', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>{cityInfo.cityName}</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                                  {cityInfo.customerEmails.size} {cityInfo.customerEmails.size === 1 ? 'cliente' : 'clientes'} • {cityInfo.shirts} {cityInfo.shirts === 1 ? 'camisa' : 'camisas'}
                                </p>
                                {cityInfo.customers && cityInfo.customers.length > 0 && (
                                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', wordBreak: 'break-word' }}>
                                    <strong>Clientes:</strong> {cityInfo.customers.join(', ')}
                                  </p>
                                )}
                                {avgDeliveryTime !== null ? (
                                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Truck size={12} /> Média de entrega: {avgDeliveryTime.toFixed(1)} dias
                                  </p>
                                ) : (
                                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Truck size={12} /> Sem dados de entrega
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 700, fontSize: '1rem', color: '#D6FF00', textAlign: 'center' }}>Distribuição Geográfica</h3>
          <div style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
            <CanadaMap provinceCounts={provCounts} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Clientes Section ────────────────────────────────────────────────────────
const ClientesSection = ({ showToast }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [diagInfo, setDiagInfo] = useState({ profiles: 0, orders: 0, pError: null, oError: null });
  const itemsPerPage = 10;
  const [expandedClient, setExpandedClient] = useState(null);
  const [sentRecoveryEmails, setSentRecoveryEmails] = useState({});
  const [sentRecoveryEmails2, setSentRecoveryEmails2] = useState({});
  const [filterSegment, setFilterSegment] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      // Fetch both sources in parallel
      const [{ data: profiles, error: pError }, { data: orders, error: oError }, { data: settings }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, customer_email, customer_name, customer_phone, total_price, status, created_at'),
        supabase.from('store_settings').select('*').in('key', ['sent_recovery_emails', 'sent_recovery_emails_2'])
      ]);

      if (cancelled) return;
      
      setDiagInfo({
        profiles: profiles?.length || 0,
        orders: orders?.length || 0,
        pError: pError?.message || null,
        oError: oError?.message || null
      });

      if (settings) {
        settings.forEach(s => {
          if (s.key === 'sent_recovery_emails') {
            try { setSentRecoveryEmails(JSON.parse(s.value)); } catch(e){}
          }
          if (s.key === 'sent_recovery_emails_2') {
            try { setSentRecoveryEmails2(JSON.parse(s.value)); } catch(e){}
          }
        });
      }

      if (pError) console.error('[Clientes] Error fetching profiles:', pError.message);
      if (oError) console.error('[Clientes] Error fetching orders:', oError.message);

      // Build order stats map keyed by email
      const orderMap = {};
      (orders || []).forEach(o => {
        const key = (o.customer_email || '').toLowerCase().trim();
        if (!key) return;
        if (!orderMap[key]) orderMap[key] = { count: 0, spent: 0, lastOrder: null, phone: o.customer_phone || '' };
        orderMap[key].count += 1;
        // Sum all orders except cancelled ones
        const isNotCancelled = o.status !== 'cancelled';
        if (isNotCancelled) orderMap[key].spent += parseFloat(o.total_price || 0);
        if (!orderMap[key].lastOrder || o.created_at > orderMap[key].lastOrder) {
          orderMap[key].lastOrder = o.created_at;
          if (o.customer_phone) orderMap[key].phone = o.customer_phone;
        }
      });

      // Use profiles as primary source (all registered users)
      const profileList = (profiles || []).map(p => {
        const emailKey = (p.email || '').toLowerCase().trim();
        const stats = orderMap[emailKey] || { count: 0, spent: 0, lastOrder: null, phone: '' };
        return {
          id: p.id,
          name: p.full_name || p.name || '',
          email: p.email || '',
          phone: p.phone || stats.phone || '',
          avatar_url: p.avatar_url || '',
          orders: stats.count,
          spent: stats.spent,
          lastOrder: stats.lastOrder || p.created_at,
          registeredAt: p.created_at,
          source: 'profile',
          cart: p.cart || [],
          street: p.street || '',
          apartment: p.apartment || '',
          city: p.city || '',
          province: p.province || '',
          postal_code: p.postal_code || ''
        };
      });

      // Also add order-only customers (not in profiles) — guests who checked out
      const profileEmails = new Set((profiles || []).map(p => (p.email || '').toLowerCase().trim()));
      (orders || []).forEach(o => {
        const emailKey = (o.customer_email || '').toLowerCase().trim();
        if (!emailKey || profileEmails.has(emailKey)) return;
        profileEmails.add(emailKey); // prevent duplicates
        const stats = orderMap[emailKey];
        if (stats) {
          profileList.push({
            id: 'order-' + emailKey,
            name: o.customer_name || '',
            email: o.customer_email || '',
            phone: stats.phone || '',
            avatar_url: '',
            orders: stats.count,
            spent: stats.spent,
            lastOrder: stats.lastOrder,
            registeredAt: null,
            source: 'order',
            cart: [],
            street: '',
            apartment: '',
            city: '',
            province: '',
            postal_code: ''
          });
        }
      });

      profileList.sort((a, b) => new Date(b.lastOrder || b.registeredAt || 0) - new Date(a.lastOrder || a.registeredAt || 0));
      setClientes(profileList);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSegment, sortBy]);

  const filtered = clientes
    .filter(c => {
      // Text search
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Segment filter
      const hasCart = c.cart && c.cart.length > 0;
      const sentAt1 = sentRecoveryEmails[c.id];
      const sentAt2 = sentRecoveryEmails2[c.id];
      if (filterSegment === 'cart')        return hasCart;
      if (filterSegment === 'no_email')    return hasCart && !sentAt1 && !sentAt2;
      if (filterSegment === 'buyers')      return c.orders > 0;
      if (filterSegment === 'no_orders')   return c.orders === 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent')   return new Date(b.lastOrder || b.registeredAt || 0) - new Date(a.lastOrder || a.registeredAt || 0);
      if (sortBy === 'oldest')   return new Date(a.lastOrder || a.registeredAt || 0) - new Date(b.lastOrder || b.registeredAt || 0);
      if (sortBy === 'spent_hi') return b.spent - a.spent;
      if (sortBy === 'spent_lo') return a.spent - b.spent;
      if (sortBy === 'orders')   return b.orders - a.orders;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const saveSentRecoveryEmailsToDb = async (newSent, step = 1) => {
    try {
      await supabase.from('store_settings').upsert({
        key: step === 2 ? 'sent_recovery_emails_2' : 'sent_recovery_emails',
        value: JSON.stringify(newSent)
      }, { onConflict: 'key' });
    } catch (err) {
      console.error(`Erro ao salvar sent_recovery_emails_${step}:`, err);
    }
  };

  const getCalgaryDateStr = (dateInput) => {
    if (!dateInput) return '';
    try {
      const d = new Date(dateInput);
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Edmonton',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d).replace(',', ' às');
    } catch (e) {
      return '';
    }
  };

  const formatCartItemDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d).replace(',', ' às');
    } catch (e) {
      return '';
    }
  };

  const handleSendAbandonedCartEmail = async (customer, step = 1) => {
    if (!customer.email || !customer.cart || customer.cart.length === 0) {
      if (showToast) showToast("Cliente não possui e-mail ou sacola ativa.", "error");
      return;
    }
    const discountText = step === 2 ? ' + 5% OFF' : '';
    if (showToast) showToast(`Disparando ${step}º E-mail de Recuperação${discountText} para ${customer.email}...`, "success");
    
    setTimeout(async () => {
      const nowStr = getCalgaryDateStr(new Date());
      if (step === 2) {
        const newSent = { ...sentRecoveryEmails2, [customer.id]: nowStr };
        setSentRecoveryEmails2(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 2);
      } else {
        const newSent = { ...sentRecoveryEmails, [customer.id]: nowStr };
        setSentRecoveryEmails(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 1);
      }
      if (showToast) showToast(`E-mail enviado e status atualizado!`, "success");
    }, 1000);
  };

  const toggleRecoveryEmailStatus = async (customer, step = 1) => {
    if (step === 2) {
      if (sentRecoveryEmails2[customer.id]) {
        const newSent = { ...sentRecoveryEmails2 };
        delete newSent[customer.id];
        setSentRecoveryEmails2(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 2);
      } else {
        const nowStr = getCalgaryDateStr(new Date());
        const newSent = { ...sentRecoveryEmails2, [customer.id]: nowStr };
        setSentRecoveryEmails2(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 2);
      }
    } else {
      if (sentRecoveryEmails[customer.id]) {
        const newSent = { ...sentRecoveryEmails };
        delete newSent[customer.id];
        setSentRecoveryEmails(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 1);
      } else {
        const nowStr = getCalgaryDateStr(new Date());
        const newSent = { ...sentRecoveryEmails, [customer.id]: nowStr };
        setSentRecoveryEmails(newSent);
        await saveSentRecoveryEmailsToDb(newSent, 1);
      }
    }
  };

  const handlePrintInvoice = (title, clientInfo, items) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (showToast) showToast("Pop-up bloqueado. Permita pop-ups para gerar invoice.", "error");
      return;
    }

    const itemsHtml = items && items.length > 0 ? items.map(item => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #111827;">${item.name || 'Produto'}</div>
          ${item.size ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Size: ${item.size}</div>` : ''}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 13px; color: #4b5563;">
            ${item.extras?.nameNumber ? `Custom: ${item.extras.customName} #${item.extras.customNumber}` : ''}
            ${item.extras?.extraCustomization ? `<br/>Extra: ${item.extras.customExtraName}` : ''}
            ${!item.extras?.nameNumber && !item.extras?.extraCustomization ? 'Standard' : ''}
          </div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity || 1}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">$${Number(item.price || 0).toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">$${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">No items</td></tr>`;

    const subtotal = items && items.length > 0 ? items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0) : 0;
    const total = clientInfo.total || subtotal;
    const diff = subtotal - total;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 40px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">iFooty.</h1>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">123 Sports Ave, Suite 100<br/>Calgary, AB T2P 1A1<br/>contact@ifooty.ca</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: 1px;">INVOICE</h2>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">#${clientInfo.invoiceNo || 'DRAFT'}<br/>Date: ${clientInfo.date || getCalgaryDateStr(new Date())}</p>
          </div>
        </div>
        <table style="margin-bottom: 40px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px;">Billed To:</h3>
              <div style="font-size: 14px; color: #111827; font-weight: 500;">
                ${clientInfo.name}<br/>
                ${clientInfo.street}<br/>
                ${clientInfo.cityProvince}<br/>
                ${clientInfo.country}<br/>
                ${clientInfo.email}
              </div>
            </td>
          </tr>
        </table>
        <table>
          <thead>
            <tr>
              <th style="width: 25%; padding: 12px 10px;">Item</th>
              <th style="width: 40%; padding: 12px 10px;">Description</th>
              <th style="width: 10%; padding: 12px 10px; text-align: center;">Quantity</th>
              <th style="width: 12%; padding: 12px 10px; text-align: right;">Unit Cost</th>
              <th style="width: 13%; padding: 12px 10px; text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <table style="width: 40%; margin-left: auto; margin-top: 40px;">
          <tr style="background-color: #e5e7eb; font-weight: bold; border-top: 2px solid #d1d5db;">
            <td style="padding: 12px 10px; text-transform: uppercase; font-size: 13px; color: #111827;">Total</td>
            <td style="padding: 12px 10px; text-align: right; font-size: 16px; color: #111827;">$${total.toFixed(2)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintCartInvoice = (customer) => {
    const clientInfo = {
      name: customer.name || 'Cliente',
      street: `${customer.street || ''}${customer.apartment ? `, Apt ${customer.apartment}` : ''}`,
      cityProvince: `${customer.city || ''}, ${customer.province || ''} ${customer.postal_code || ''}`,
      country: 'Canada',
      email: customer.email || '',
      invoiceNo: 'CART-' + (customer.id || 'N/A').toString().substring(0, 6).toUpperCase(),
      date: getCalgaryDateStr(new Date()),
      total: customer.cart.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0)
    };
    handlePrintInvoice('CART INVOICE', clientInfo, customer.cart);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === 2 || i === totalPages - 1) {
        pages.push('...');
      }
    }

    const uniquePages = pages.filter((page, index) => {
      return page !== '...' || pages[index - 1] !== '...';
    });

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
          Mostrando <span style={{ color: '#fff', fontWeight: 600 }}>{indexOfFirstItem + 1}</span> a <span style={{ color: '#fff', fontWeight: 600 }}>{Math.min(indexOfLastItem, filtered.length)}</span> de <span style={{ color: '#fff', fontWeight: 600 }}>{filtered.length}</span> clientes
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.4rem 0.75rem',
              background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Anterior
          </button>
          
          {uniquePages.map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`dots-${idx}`} style={{ color: 'rgba(255,255,255,0.3)', padding: '0 0.25rem', fontSize: '0.85rem' }}>
                  ...
                </span>
              );
            }
            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: '30px',
                  height: '30px',
                  background: currentPage === pageNum ? '#D6FF00' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  color: currentPage === pageNum ? '#000' : '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.4rem 0.75rem',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Próximo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <SectionHeader
        title="Clientes"
        sub={`${clientes.length} clientes cadastrados`}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2D30', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
            <Search size={14} color="rgba(255,255,255,0.4)" />
            <input
              style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', width: '200px' }}
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {/* Filter Bar */}
      {!loading && (() => {
        const segments = [
          { id: 'all',       label: 'Todos',           count: clientes.length },
          { id: 'cart',      label: '🛒 Sacola Ativa',  count: clientes.filter(c => c.cart && c.cart.length > 0).length },
          { id: 'no_email',  label: '⏳ Não Contatados', count: clientes.filter(c => c.cart && c.cart.length > 0 && !sentRecoveryEmails[c.id] && !sentRecoveryEmails2[c.id]).length },
          { id: 'buyers',    label: '✅ Compradores',    count: clientes.filter(c => c.orders > 0).length },
          { id: 'no_orders', label: '👤 Sem Pedidos',    count: clientes.filter(c => c.orders === 0).length },
        ];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', justifyContent: 'space-between' }}>
            {/* Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {segments.map(seg => (
                <button
                  key={seg.id}
                  onClick={() => setFilterSegment(seg.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '100px',
                    border: filterSegment === seg.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: filterSegment === seg.id ? '#D6FF00' : 'rgba(255,255,255,0.04)',
                    color: filterSegment === seg.id ? '#000' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.78rem',
                    fontWeight: filterSegment === seg.id ? 800 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {seg.label}
                  <span style={{
                    background: filterSegment === seg.id ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    padding: '0 5px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}>{seg.count}</span>
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                padding: '0.35rem 0.6rem',
                fontSize: '0.78rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="recent"   style={{ background: '#1A1D20' }}>↓ Mais Recentes</option>
              <option value="oldest"   style={{ background: '#1A1D20' }}>↑ Mais Antigos</option>
              <option value="spent_hi" style={{ background: '#1A1D20' }}>$ Maior Gasto</option>
              <option value="spent_lo" style={{ background: '#1A1D20' }}>$ Menor Gasto</option>
              <option value="orders"   style={{ background: '#1A1D20' }}># Mais Pedidos</option>
            </select>
          </div>
        );
      })()}

      {/* Subtle diagnostic log on UI */}
      {(diagInfo.pError || diagInfo.profiles === 0) && (
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.05)', marginBottom: '1rem', fontFamily: 'monospace' }}>
          💡 Diag: Profiles={diagInfo.profiles} (Error: {diagInfo.pError || 'None'}), Orders={diagInfo.orders} (Error: {diagInfo.oError || 'None'})
        </div>
      )}

      {loading ? <Loader /> : (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Cliente</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Telefone</th>
                  <th style={S.th}>Pedidos</th>
                  <th style={S.th}>Total Gasto</th>
                  <th style={S.th}>Último Pedido</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((c, idx) => {
                  const isExpanded = expandedClient === c.id;
                  const hasCart = c.cart && c.cart.length > 0;
                  const sentAt1 = sentRecoveryEmails[c.id];
                  const sentAt2 = sentRecoveryEmails2[c.id];

                  return (
                    <React.Fragment key={c.id || idx}>
                      <tr
                        onClick={() => setExpandedClient(isExpanded ? null : c.id)}
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid #1A1D20',
                          background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                          transition: 'background 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {c.avatar_url && c.avatar_url.trim() !== '' && !c.avatar_url.includes('placeholder.com') ? (
                              <img src={c.avatar_url} alt={c.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.orders > 0 ? 'rgba(214,255,0,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem', fontWeight: 700, color: c.orders > 0 ? '#D6FF00' : 'rgba(255,255,255,0.3)' }}>
                                {(c.name || c.email || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name || 'Sem nome'}</span>
                                {hasCart && (
                                  <span style={{ fontSize: '0.62rem', background: 'rgba(239,68,68,0.15)', color: '#FF4D4D', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                    Sacola Ativa ({c.cart.reduce((s, item) => s + (item.quantity || 1), 0)})
                                  </span>
                                )}
                                {hasCart && sentAt2 && <span style={{ fontSize: '0.62rem', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>📧 2º Enviado</span>}
                                {hasCart && sentAt1 && !sentAt2 && <span style={{ fontSize: '0.62rem', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>📧 1º Enviado</span>}
                                {hasCart && !sentAt1 && !sentAt2 && <span style={{ fontSize: '0.62rem', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>⏳ Não Enviado</span>}
                              </div>
                              {c.orders === 0 && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>Sem pedidos</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...S.td, color: 'rgba(255,255,255,0.65)' }}>{c.email || '—'}</td>
                        <td style={{ ...S.td, color: 'rgba(255,255,255,0.65)' }}>{c.phone || '—'}</td>
                        <td style={S.td}>
                          {c.orders > 0 ? (
                            <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(96,165,250,0.1)', color: '#60A5FA', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{c.orders}</span>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ ...S.td, fontWeight: 700, color: c.spent > 0 ? '#4ADE80' : 'rgba(255,255,255,0.25)' }}>
                          ${c.spent.toFixed(2)}
                        </td>
                        <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span>{c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('pt-BR') : '—'}</span>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(214,255,0,0.15)' }}>
                          <td colSpan={6} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

                              {/* Endereço */}
                              <div style={{ flex: '1', minWidth: '220px' }}>
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Endereço Registrado</p>
                                {c.street ? (
                                  <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: '1.6' }}>
                                    <div>{c.street}{c.apartment ? `, Apt ${c.apartment}` : ''}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)' }}>{c.city}, {c.province} {c.postal_code}</div>
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Nenhum endereço cadastrado.</p>
                                )}
                              </div>

                              {/* Sacola */}
                              <div style={{ flex: '2', minWidth: '320px' }}>
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Sacola / Carrinho Ativo</p>
                                {hasCart ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {c.cart.map((item, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                          <img src={item.image || '/camisas/placeholder.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.onerror = null; e.target.src = '/camisas/placeholder.png'; }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{item.name}</div>
                                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                            Tam: <span style={{ color: '#D6FF00', fontWeight: 700 }}>{item.size}</span> | Qtd: {item.quantity || 1} | Preço: ${Number(item.price || 0).toFixed(2)}
                                            {item.addedAt && ` | Adicionado em: ${formatCartItemDate(item.addedAt)}`}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Nenhum produto no carrinho atualmente.</p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                              {hasCart && (
                                <>
                                  {/* 1st Email group */}
                                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleRecoveryEmailStatus(c, 1); }} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.65rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                      {sentAt1 ? 'Desmarcar 1º' : 'Marcar 1º'}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleSendAbandonedCartEmail(c, 1); }} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: sentAt1 ? 'rgba(16,185,129,0.1)' : '#D6FF00', color: sentAt1 ? '#10B981' : '#000', border: sentAt1 ? '1px solid rgba(16,185,129,0.3)' : 'none', padding: '0.4rem 0.9rem', borderRadius: '5px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>
                                      {sentAt1 ? '✓' : '✉'} {sentAt1 ? `1º Enviado (${sentAt1.split(' às ')[0]})` : 'Enviar 1º E-mail'}
                                    </button>
                                  </div>

                                  {/* 2nd Email group */}
                                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleRecoveryEmailStatus(c, 2); }} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.65rem', borderRadius: '5px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                      {sentAt2 ? 'Desmarcar 2º' : 'Marcar 2º'}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleSendAbandonedCartEmail(c, 2); }} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: sentAt2 ? 'rgba(59,130,246,0.1)' : '#3B82F6', color: sentAt2 ? '#3B82F6' : '#fff', border: sentAt2 ? '1px solid rgba(59,130,246,0.3)' : 'none', padding: '0.4rem 0.9rem', borderRadius: '5px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>
                                      {sentAt2 ? '✓' : '✉'} {sentAt2 ? `2º Enviado (${sentAt2.split(' às ')[0]})` : 'Enviar 2º (5% OFF)'}
                                    </button>
                                  </div>

                                  <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />

                                  <button onClick={(e) => { e.stopPropagation(); handlePrintCartInvoice(c); }} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.9rem', borderRadius: '5px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                                    🖨 Gerar Invoice
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhum cliente encontrado.</td></tr>
                )}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Afiliados Section ────────────────────────────────────────────────────────

const AfiliadosSection = ({ showToast }) => {
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', agent_id: '', commission_percent: '10' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .not('agent_id', 'is', null)
      .order('created_at', { ascending: false });

    const agentCodes = (coupons || []).map(c => c.code);
    let usageMap = {};
    if (agentCodes.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('coupon_code, total')
        .in('coupon_code', agentCodes);
      (orders || []).forEach(o => {
        if (!usageMap[o.coupon_code]) usageMap[o.coupon_code] = { count: 0, revenue: 0 };
        usageMap[o.coupon_code].count += 1;
        usageMap[o.coupon_code].revenue += parseFloat(o.total || 0);
      });
    }
    setAfiliados((coupons || []).map(c => ({ ...c, usage: usageMap[c.code] || { count: 0, revenue: 0 } })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.agent_id.trim() || !form.name.trim()) {
      showToast('Preencha o nome e o código do afiliado.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      code: form.agent_id.trim().toUpperCase(),
      discount_percent: parseFloat(form.commission_percent) || 10,
      agent_id: form.agent_id.trim().toUpperCase(),
      is_active: true,
    };
    const { error } = editing
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert([payload]);
    setSaving(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }
    showToast(editing ? 'Afiliado atualizado!' : 'Afiliado criado!', 'success');
    setShowForm(false); setEditing(null);
    setForm({ name: '', email: '', agent_id: '', commission_percent: '10' });
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { data, error } = await supabase.from('coupons').delete().eq('id', confirmDelete).select();
    setConfirmDelete(null);
    if (error) {
      showToast('Erro ao deletar: ' + error.message, 'error');
    } else if (!data || data.length === 0) {
      showToast('Erro RLS: Sem permissão para remover afiliado no banco.', 'error');
    } else {
      showToast('Afiliado removido.', 'success');
      load();
    }
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ name: a.agent_id, email: '', agent_id: a.agent_id, commission_percent: String(a.discount_percent) });
    setShowForm(true);
  };

  return (
    <div>
      <SectionHeader
        title="Afiliados"
        sub="Gerencie influenciadores e seus cupons de desconto"
        action={
          <button style={S.btnPrimary} onClick={() => { setEditing(null); setForm({ name: '', email: '', agent_id: '', commission_percent: '10' }); setShowForm(true); }}>
            <Plus size={15} /> Novo Afiliado
          </button>
        }
      />

      {showForm && (
        <div style={{ ...S.card, marginBottom: '1.5rem', border: '1px solid rgba(214,255,0,0.2)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem' }}>{editing ? 'Editar Afiliado' : 'Novo Afiliado'}</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={S.label}>Nome do Afiliado</label>
                <input style={S.input} placeholder="Ex: João Silva" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label style={S.label}>Código (Cupom)</label>
                <input style={S.input} placeholder="Ex: JOAO10" value={form.agent_id} onChange={e => setForm({...form, agent_id: e.target.value.toUpperCase()})} required />
              </div>
              <div>
                <label style={S.label}>Email (opcional)</label>
                <input style={S.input} type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label style={S.label}>Desconto para o cliente (%)</label>
                <input style={S.input} type="number" min="1" max="100" value={form.commission_percent} onChange={e => setForm({...form, commission_percent: e.target.value})} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" style={S.btnPrimary} disabled={saving}>
                <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" style={S.btnSecondary} onClick={() => setShowForm(false)}>
                <X size={14} /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <Loader /> : (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Afiliado / Código</th>
                  <th style={S.th}>Desconto</th>
                  <th style={S.th}>Vendas</th>
                  <th style={S.th}>Receita Gerada</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {afiliados.map(a => (
                  <tr key={a.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(214,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Award size={16} color="#D6FF00" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'monospace', letterSpacing: '0.05em', color: '#D6FF00' }}>{a.code}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>ID: {String(a.id).slice(0,8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...S.td, fontWeight: 700, color: '#4ADE80' }}>{a.discount_percent}% OFF</td>
                    <td style={S.td}>{a.usage.count} pedidos</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>${a.usage.revenue.toFixed(2)}</td>
                    <td style={S.td}>
                      <span style={{ padding: '0.2rem 0.6rem', background: a.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: a.is_active ? '#4ADE80' : 'rgba(255,255,255,0.3)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {a.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={S.btnEdit} onClick={() => openEdit(a)}><Edit2 size={14} /></button>
                        <button style={S.btnDanger} onClick={() => setConfirmDelete(a.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {afiliados.length === 0 && (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhum afiliado cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ ...S.modalBox, maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.75rem', fontWeight: 700 }}>Remover Afiliado</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 2rem', fontSize: '0.9rem' }}>
              Esta ação é irreversível. O afiliado será removido permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button style={S.btnSecondary} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button style={{ ...S.btnPrimary, background: '#F87171', color: '#fff' }} onClick={handleDelete}>Sim, Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Conversas IA Section ─────────────────────────────────────────────────────
const ConversasSection = () => {
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);
    if (!error) setConversas(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    const { error } = await supabase.from('ai_conversations').delete().eq('id', id);
    if (!error) {
      setConversas(prev => prev.filter(c => c.id !== id));
      if (selected?.id === id) setSelected(null);
    }
    setDeletingId(null);
    setConfirmDelete(null);
  };

  const filtered = conversas.filter(c => {
    const name = c.user_name || 'Visitante Anônimo';
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || (c.user_ip || '').includes(q);
  });

  return (
    <div>
      <SectionHeader
        title="Conversas IA"
        sub={`${conversas.length} conversas registradas`}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={load} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center' }} title="Atualizar">
              ↻
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2D30', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input
                style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', width: '180px' }}
                placeholder="Buscar por nome ou IP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        }
      />

      {/* Detail Modal */}
      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={{ ...S.modalBox, maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{selected.user_name || 'Visitante Anônimo'}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                  IP: {selected.user_ip || 'N/I'} · {new Date(selected.updated_at || selected.created_at).toLocaleString('pt-BR')}
                  {selected.user_email && ` · ${selected.user_email}`}
                </p>
              </div>
              <button style={S.btnSecondary} onClick={() => setSelected(null)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '62vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {(selected.messages || []).map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '78%', padding: '0.75rem 1rem',
                    background: msg.role === 'user' ? 'rgba(214,255,0,0.12)' : 'rgba(255,255,255,0.06)',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: '0.875rem', lineHeight: 1.5,
                    color: msg.role === 'user' ? '#D6FF00' : 'rgba(255,255,255,0.9)',
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {msg.role === 'user' ? (selected.user_name || 'Cliente') : 'Mister Oliver'}
                    </div>
                    {msg.content}
                  </div>
                </div>
              ))}
              {(!selected.messages || selected.messages.length === 0) && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem' }}>
                  {selected.summary || selected.last_message || 'Sem mensagens detalhadas.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? <Loader /> : conversas.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>
          <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>Nenhuma conversa registrada</div>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Usuário</th>
                  <th style={S.th}>IP</th>
                  <th style={S.th}>Última mensagem</th>
                  <th style={S.th}>Msgs</th>
                  <th style={S.th}>Data</th>
                  <th style={S.th}>Ver</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const msgCount = Array.isArray(c.messages) ? c.messages.length : 0;
                  const lastMsg = msgCount > 0 ? c.messages[msgCount - 1] : null;
                  const lastText = lastMsg?.content || c.summary || c.last_message || '—';
                  const name = c.user_name || 'Visitante Anônimo';
                  const dateStr = new Date(c.updated_at || c.created_at).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <tr key={c.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: name === 'Visitante Anônimo' ? 'rgba(255,255,255,0.05)' : 'rgba(214,255,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem', fontWeight: 700, color: name === 'Visitante Anônimo' ? 'rgba(255,255,255,0.3)' : '#D6FF00' }}>
                            {name[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{name}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                        {c.user_ip || 'N/I'}
                      </td>
                      <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastText}
                      </td>
                      <td style={S.td}>
                        <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(96,165,250,0.1)', color: '#60A5FA', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {msgCount}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{dateStr}</td>
                      <td style={{ ...S.td, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelected(c)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', color: '#60A5FA', cursor: 'pointer', padding: '0.35rem 0.65rem', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Ver
                        </button>
                        {confirmDelete === c.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '5px', color: '#FF4D4D', cursor: 'pointer', padding: '0.35rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}
                            >
                              {deletingId === c.id ? '...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(c.id)}
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                            title="Excluir conversa"
                          >
                            🗑
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhuma conversa encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Depoimentos Section ──────────────────────────────────────────────────────
const DepoimentosSection = ({ showToast }) => {
  const [depoimentos, setDepoimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', content: '', rating: '5', location: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });
    setDepoimentos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) {
      showToast('Preencha o nome e o depoimento.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      content: form.content.trim(),
      rating: parseInt(form.rating) || 5,
      location: form.location.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    };
    const { error } = editing
      ? await supabase.from('testimonials').update(payload).eq('id', editing.id)
      : await supabase.from('testimonials').insert([payload]);
    setSaving(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }
    showToast(editing ? 'Depoimento atualizado!' : 'Depoimento criado!', 'success');
    setShowForm(false); setEditing(null);
    setForm({ name: '', content: '', rating: '5', location: '', avatar_url: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover depoimento?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    showToast('Depoimento removido.', 'success');
    load();
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name || '', content: d.content || '', rating: String(d.rating || 5), location: d.location || '', avatar_url: d.avatar_url || '' });
    setShowForm(true);
  };

  const handleToggleStatus = async (d) => {
    const newStatus = d.status === 'approved' ? 'pending' : 'approved';
    const { error } = await supabase.from('testimonials').update({ status: newStatus }).eq('id', d.id);
    if (error) {
      showToast('Erro ao alterar visibilidade: ' + error.message, 'error');
      return;
    }
    showToast(newStatus === 'approved' ? 'Depoimento publicado com sucesso!' : 'Depoimento ocultado do site!', 'success');
    load();
  };

  return (
    <div>
      <SectionHeader
        title="Depoimentos"
        sub="Gerencie avaliações e testemunhos exibidos no site"
        action={
          <button style={S.btnPrimary} onClick={() => { setEditing(null); setForm({ name: '', content: '', rating: '5', location: '', avatar_url: '' }); setShowForm(true); }}>
            <Plus size={15} /> Novo Depoimento
          </button>
        }
      />

      {showForm && (
        <div style={{ ...S.card, marginBottom: '1.5rem', border: '1px solid rgba(214,255,0,0.2)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem' }}>{editing ? 'Editar Depoimento' : 'Novo Depoimento'}</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={S.label}>Nome</label>
                <input style={S.input} placeholder="Ex: Carlos M." value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label style={S.label}>Cargo / Cidade</label>
                <input style={S.input} placeholder="Ex: Toronto, ON" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div>
                <label style={S.label}>Nota ({form.rating} estrelas)</label>
                <input style={S.input} type="range" min="1" max="5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} />
                <div style={{ display: 'flex', gap: '3px', marginTop: '0.35rem' }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} fill={s <= parseInt(form.rating) ? '#FBBF24' : 'none'} color={s <= parseInt(form.rating) ? '#FBBF24' : 'rgba(255,255,255,0.2)'} />
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>URL do Avatar (opcional)</label>
                <input style={S.input} placeholder="https://..." value={form.avatar_url} onChange={e => setForm({...form, avatar_url: e.target.value})} />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Depoimento</label>
              <textarea
                style={{ ...S.input, minHeight: '90px', resize: 'vertical' }}
                placeholder="Digite o depoimento do cliente..."
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" style={S.btnPrimary} disabled={saving}>
                <Save size={14} />{saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" style={S.btnSecondary} onClick={() => setShowForm(false)}>
                <X size={14} /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <Loader /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {depoimentos.map(d => (
            <div key={d.id} style={{ ...S.card, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => handleToggleStatus(d)}
                  style={{
                    ...S.btnEdit,
                    background: d.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: d.status === 'approved' ? '#4ADE80' : 'rgba(255, 255, 255, 0.4)',
                    borderColor: d.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                  }}
                  title={d.status === 'approved' ? 'Ocultar do Site' : 'Publicar no Site'}
                >
                  {d.status === 'approved' ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button style={S.btnEdit} onClick={() => openEdit(d)}><Edit2 size={13} /></button>
                <button style={S.btnDanger} onClick={() => handleDelete(d.id)}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                {d.avatar_url ? (
                  <img src={d.avatar_url} alt={d.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(214,255,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D6FF00' }}>{(d.name || '?')[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{d.name}</span>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: d.status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.06)',
                      color: d.status === 'approved' ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                      border: d.status === 'approved' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {d.status === 'approved' ? 'Publicado' : 'Oculto'}
                    </span>
                  </div>
                  {d.location && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{d.location}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '0.65rem' }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={13} fill={s <= (d.rating || 5) ? '#FBBF24' : 'none'} color={s <= (d.rating || 5) ? '#FBBF24' : 'rgba(255,255,255,0.2)'} />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>"{d.content}"</p>
            </div>
          ))}
          {depoimentos.length === 0 && (
            <div style={{ ...S.card, textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)', gridColumn: '1 / -1' }}>
              <Star size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>Nenhum depoimento cadastrado</div>
              <div style={{ fontSize: '0.85rem' }}>Crie depoimentos para exibir na página inicial do site.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(214,255,0,0.2)', borderTopColor: '#D6FF00', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
    <div>
      <h2 style={S.sectionTitle}>{title}</h2>
      {sub && <p style={S.sectionSub}>{sub}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const RebrandAdmin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useRebrandAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [showValues, setShowValues] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackingCodeToView, setTrackingCodeToView] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/rebrand/auth');
  };

  if (authLoading) {
    return (
      <div style={{ background: '#0B0C0E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ background: '#0B0C0E', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2 style={{ color: '#fff', margin: 0 }}>Acesso Restrito</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Apenas o gestor do iFooty Canada pode acessar este painel.</p>
        <button onClick={() => navigate('/rebrand')} style={{ ...S.btnPrimary }}>Voltar ao Site</button>
      </div>
    );
  }

  const sections = {
    dashboard:   <DashboardSection showValues={showValues} setShowValues={setShowValues} />,
    orders:      <OrdersSection showToast={showToast} onOpenTracking={(code) => { setTrackingCodeToView(code); setIsTrackModalOpen(true); }} />,
    products:    <ProductsSection showToast={showToast} />,
    visual:      <VisualSection showToast={showToast} />,
    coupons:     <CouponsSection showToast={showToast} />,
    clientes:    <ClientesSection showToast={showToast} />,
    afiliados:   <AfiliadosSection showToast={showToast} />,
    conversas:   <ConversasSection />,
    depoimentos: <DepoimentosSection showToast={showToast} />,
    financeiro:  <FinanceiroSection showToast={showToast} />,
    cidades:     <CidadesSection showToast={showToast} />,
    settings:    <SettingsSection showToast={showToast} />,
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        select option { background: #1A1D20; color: #fff; }

        .admin-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .admin-gap-1 {
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .admin-grid-2 {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 640px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 3.5fr 2.5fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      {/* Mobile Top Header */}
      {isMobile && (
        <header style={{
          background: '#0F1012',
          borderBottom: '1px solid #1A1D20',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          height: '56px'
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontSize: '1.2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
            <span style={{ color: '#D6FF00' }}>i</span>
            <span style={{ color: '#fff' }}>Footy</span>
            <span style={{ color: '#D6FF00' }}>.</span>
          </div>
          <div style={{ width: '22px' }} />
        </header>
      )}

      {/* Mobile Sidebar Backdrop overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      <div style={S.layout}>
        {/* Sidebar */}
        <aside style={{
          ...S.sidebar,
          ...(isMobile ? {
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            boxShadow: sidebarOpen ? '0 0 24px rgba(0,0,0,0.8)' : 'none',
            zIndex: 1000
          } : {})
        }}>
          {/* Mobile close button inside sidebar header */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 0.75rem 0 0' }}>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Logo */}
          <div style={{ padding: isMobile ? '0.75rem 1.5rem 1.75rem 1.5rem' : '1.75rem 1.5rem', borderBottom: '1px solid #1A1D20' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontSize: '1.4rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
              <span style={{ color: '#D6FF00' }}>i</span>
              <span style={{ color: '#fff' }}>Footy</span>
              <span style={{ color: '#D6FF00' }}>.</span>
            </div>
            <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)' }}>Admin Panel</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.7rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgba(214,255,0,0.1)' : 'transparent',
                    color: isActive ? '#D6FF00' : 'rgba(255,255,255,0.55)',
                    fontWeight: isActive ? 700 : 500, fontSize: '0.875rem', marginBottom: '0.2rem',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
                >
                  <Icon size={16} />
                  {item.label}
                  {isActive && <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: '#D6FF00' }} />}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #1A1D20' }}>
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.15rem' }}>Logado como</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button
              onClick={() => navigate('/rebrand')}
              style={{ ...S.btnSecondary, width: '100%', justifyContent: 'center', fontSize: '0.8rem', marginBottom: '0.5rem' }}
            >
              <ExternalLink size={13} /> Ver Site
            </button>
            <button
              onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.08)', color: '#F87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              <LogOut size={13} /> Sair
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          ...S.main,
          ...(isMobile ? {
            marginLeft: 0,
            padding: '1.25rem'
          } : {})
        }}>
          {sections[activeTab]}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isTrackModalOpen && (
        <TrackingModal
          isOpen={isTrackModalOpen}
          onClose={() => setIsTrackModalOpen(false)}
          initialTrackingNumber={trackingCodeToView}
        />
      )}
    </>
  );
};

export default RebrandAdmin;

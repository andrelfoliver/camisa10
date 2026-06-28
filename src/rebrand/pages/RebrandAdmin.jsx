import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Compass, Tag, Settings,
  LogOut, ExternalLink, ChevronUp, ChevronDown, Edit2, Trash2,
  Plus, Save, X, Check, AlertCircle, TrendingUp, Users, DollarSign,
  Clock, Search, RefreshCw, Eye
} from 'lucide-react';
import ProductMedia from '../../components/ProductMedia';

// ─── Constants ───────────────────────────────────────────────────────────────
const REBRAND_ADMIN_EMAIL = 'ifootyc@gmail.com';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'orders',     label: 'Pedidos',            icon: ShoppingBag },
  { id: 'products',   label: 'Produtos',           icon: Package },
  { id: 'spotlight',  label: 'Season Spotlight',   icon: Compass },
  { id: 'coupons',    label: 'Cupons',             icon: Tag },
  { id: 'settings',   label: 'Configurações',      icon: Settings },
];

const STATUS_COLORS = {
  pending:   { bg: 'rgba(234,179,8,0.15)',   color: '#FBBF24', label: 'Pendente' },
  paid:      { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80', label: 'Pago' },
  shipped:   { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA', label: 'Enviado' },
  delivered: { bg: 'rgba(168,85,247,0.15)', color: '#C084FC', label: 'Entregue' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#F87171', label: 'Cancelado' },
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
const KpiCard = ({ label, value, icon: Icon, color, sub }) => (
  <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  </div>
);

// ─── Dashboard Section ────────────────────────────────────────────────────────
const DashboardSection = () => {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, users: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ data: orders }, { data: profiles }] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id'),
        ]);

        const validOrders = orders || [];
        const totalRevenue = validOrders
          .filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered')
          .reduce((sum, o) => sum + (parseFloat(o.total || o.total_price) || 0), 0);
        
        const pending = validOrders.filter(o => o.status === 'pending').length;
        setStats({ orders: validOrders.length, revenue: totalRevenue, users: profiles?.length || 0, pending });
        setRecentOrders(validOrders.slice(0, 6));

        // Process data for the last 7 days chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyMap = {};
        last7Days.forEach(date => {
          dailyMap[date] = { revenue: 0, count: 0 };
        });

        validOrders.forEach(o => {
          const dateStr = new Date(o.created_at).toISOString().split('T')[0];
          if (dailyMap[dateStr] !== undefined) {
            dailyMap[dateStr].count += 1;
            if (o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') {
              dailyMap[dateStr].revenue += parseFloat(o.total || o.total_price || 0);
            }
          }
        });

        setChartData(last7Days.map(date => ({
          date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
          revenue: dailyMap[date].revenue,
          count: dailyMap[date].count
        })));

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
      <SectionHeader title="Dashboard" sub="Visão geral da sua loja iFooty Canada" />
      
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <KpiCard label="Total de Pedidos"  value={stats.orders}                            icon={ShoppingBag}  color="#60A5FA" />
        <KpiCard label="Receita Confirmada" value={`$${stats.revenue.toFixed(2)}`}          icon={DollarSign}  color="#4ADE80" sub="Pedidos pagos/enviados/entregues" />
        <KpiCard label="Usuários"           value={stats.users}                             icon={Users}       color="#C084FC" />
        <KpiCard label="Pendentes"          value={stats.pending}                           icon={Clock}       color="#FBBF24" sub="Aguardando confirmação" />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 2.5fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Revenue Line Chart */}
        <div style={S.card}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#4ADE80" /> Faturamento (Últimos 7 dias)
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
                    <text x={padding - 5} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">${val}</text>
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
                  <circle cx={p.x} cy={p.y} r="4" fill="#0B0C0E" stroke="#D6FF00" strokeWidth="2" />
                  <circle cx={p.x} cy={p.y} r="8" fill="#D6FF00" opacity="0" className="chart-hover-trigger" />
                  <text x={p.x} y={chartHeight - 5} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle" transform={`rotate(-15, ${p.x}, ${chartHeight - 5})`}>
                    {p.data.date}
                  </text>
                  {/* Mini Tooltip overlay on points */}
                  <title>{`${p.data.date}: $${p.data.revenue.toFixed(2)}`}</title>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div style={S.card}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={16} color="#60A5FA" /> Volume de Pedidos Diários
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: '150px', padding: '0 10px', paddingTop: '20px' }}>
            {chartData.map((d, idx) => {
              const heightPercent = (d.count / maxCount) * 100;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: d.count > 0 ? '#60A5FA' : 'rgba(255,255,255,0.2)' }}>{d.count}</span>
                  <div style={{ 
                    width: '65%', 
                    height: `${Math.max(heightPercent, 4)}%`, 
                    background: d.count > 0 ? 'linear-gradient(to top, #3B82F6, #60A5FA)' : 'rgba(255,255,255,0.05)', 
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease'
                  }} title={`${d.date}: ${d.count} pedidos`} />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{d.date.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={S.card}>
        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>Pedidos Recentes</h3>
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
                <td style={S.td}>{o.customer_name || o.customer_email || '—'}</td>
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
  );
};

// ─── Orders Section ───────────────────────────────────────────────────────────
// ─── Order Detail Modal ───────────────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose, onStatusChange, onTrackingChange, showToast }) => {
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
            <span style={S.badge(order.status)}>{STATUS_COLORS[order.status]?.label || order.status}</span>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ ...S.card, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D6FF00', marginBottom: '0.75rem' }}>📦 Rastreio</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input style={{ ...S.input, flex: 1 }} value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Ex: 1Z999AA10123456784" />
              <button style={{ ...S.btnPrimary, flexShrink: 0 }} onClick={handleSaveTracking} disabled={savingTracking}><Save size={14} /></button>
            </div>
          </div>
          <div style={{ ...S.card, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D6FF00', marginBottom: '0.75rem' }}>⚙️ Mudar Status</div>
            <select style={S.input} value={order.status} onChange={e => onStatusChange(order.id, e.target.value)}>
              {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Orders Section ───────────────────────────────────────────────────────────
const OrdersSection = ({ showToast }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { showToast('Erro ao atualizar status.', 'error'); return; }
    showToast('Status atualizado!', 'success');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (o.customer_name || '').toLowerCase().includes(q) || (o.customer_email || '').toLowerCase().includes(q) || String(o.id).includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <SectionHeader title="Pedidos" sub={`${orders.length} pedidos no total`} action={<button style={S.btnSecondary} onClick={load}><RefreshCw size={14} /> Atualizar</button>} />
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
          <table style={S.table}>
            <thead>
              <tr>{['ID', 'Cliente', 'Data', 'Total', 'Status', 'Ações'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                  <td style={{ ...S.td, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontFamily: 'monospace' }}>#{String(o.id).slice(-8)}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{o.customer_name || '—'}</div>
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
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onTrackingChange={(id, track) => setOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_number: track } : o))}
          showToast={showToast}
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
const ProductsSection = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

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

    setForm({
      name: product.name || '',
      price: product.price || '',
      category: product.category || '',
      image: product.image || '',
      description: product.description || '',
      inventory: currentInventory
    });
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
      image: imageUrl,
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

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Produtos" sub={`${products.length} produtos cadastrados`} action={<button style={S.btnPrimary} onClick={() => openEdit({ id: 'NEW' })}><Plus size={14} /> Novo Produto</button>} />

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '340px' }}>
          <Search size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
          <input style={{ ...S.input, paddingLeft: '2.5rem' }} placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
                  <label style={S.label}>Categoria</label>
                  <select style={S.input} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">Selecionar...</option>
                    {['soccer', 'basketball', 'football', 'baseball', 'hockey'].map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
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
                  <label style={S.label}>Descrição</label>
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
                  { key: 'img', label: 'URL da Imagem', placeholder: '/assets/rebrand/blue_jays.jpg', full: true },
                  { key: 'featuredProducts', label: 'IDs de Produtos Destacados', placeholder: 'mock-3, mock-4', full: true },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                    <label style={S.label}>{f.label}</label>
                    <input style={inputStyle} value={form[f.key] || ''} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} required={f.key !== 'featuredProducts'} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" style={S.btnSecondary} onClick={() => setEditingIdx(null)}>Cancelar</button>
                <button type="submit" style={S.btnPrimary}><Check size={14} /> Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
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

  const handleDelete = async (id) => {
    if (!window.confirm('Deletar este cupom?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) { showToast('Erro ao deletar.', 'error'); } else { showToast('Cupom removido!', 'success'); load(); }
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
                      <button style={S.btnDanger} onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '3rem' }}>Nenhum cupom cadastrado.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
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
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Auth guard
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email?.toLowerCase().trim();
      if (email === REBRAND_ADMIN_EMAIL) {
        setAuthorized(true);
        setAdminUser(session.user);
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/rebrand/auth');
  };

  if (!authChecked) {
    return (
      <div style={{ background: '#0B0C0E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

  if (!authorized) {
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
    dashboard: <DashboardSection />,
    orders:    <OrdersSection showToast={showToast} />,
    products:  <ProductsSection showToast={showToast} />,
    spotlight: <SpotlightSection showToast={showToast} />,
    coupons:   <CouponsSection showToast={showToast} />,
    settings:  <SettingsSection showToast={showToast} />,
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        select option { background: #1A1D20; color: #fff; }
      `}</style>

      <div style={S.layout}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          {/* Logo */}
          <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid #1A1D20' }}>
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
                  onClick={() => setActiveTab(item.id)}
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
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminUser?.email}</div>
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
        <main style={S.main}>
          {sections[activeTab]}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default RebrandAdmin;

import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Package, User, LogOut, ChevronRight, Edit2, Check, X, Truck, Clock, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'Pending Payment',  color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  paid:       { label: 'Paid',             color: '#3b82f6', bg: '#dbeafe', icon: CheckCircle },
  processing: { label: 'Processing',       color: '#8b5cf6', bg: '#ede9fe', icon: Package },
  shipped:    { label: 'Shipped',          color: '#0ea5e9', bg: '#e0f2fe', icon: Truck },
  completed:  { label: 'Delivered',        color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',        color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

const RebrandProfile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (user) {
      setEditName(user.user_metadata?.full_name || '');
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoadingOrders(false);
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: editName.trim() } });
      await supabase.from('profiles').update({ full_name: editName.trim() }).eq('id', user.id);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/rebrand');
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/rebrand/auth" replace />;

  const firstName = (user.user_metadata?.full_name || user.email || '').split(' ')[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .rebrand-profile-tab { cursor:pointer; padding:0.75rem 1.5rem; border-bottom:2px solid transparent; color:#6b7280; font-weight:600; font-size:0.9rem; transition:all .2s; white-space:nowrap; background:none; border-left:none; border-right:none; border-top:none; }
        .rebrand-profile-tab.active { border-bottom-color:#121416; color:#121416; }
        .rebrand-profile-tab:hover:not(.active) { color:#121416; }
        .rebrand-order-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; transition:box-shadow .2s; }
        .rebrand-order-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }
        .rebrand-btn-primary { background:#121416; color:#fff; border:none; border-radius:8px; padding:0.6rem 1.2rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:opacity .2s; }
        .rebrand-btn-primary:hover { opacity:0.85; }
        .rebrand-btn-outline { background:transparent; color:#121416; border:1.5px solid #d1d5db; border-radius:8px; padding:0.5rem 1rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:0.4rem; }
        .rebrand-btn-outline:hover { border-color:#121416; }
        .rebrand-input { border:1.5px solid #d1d5db; border-radius:8px; padding:0.6rem 0.9rem; font-size:0.9rem; outline:none; width:100%; box-sizing:border-box; transition:border-color .2s; font-family:inherit; }
        .rebrand-input:focus { border-color:#121416; }
        .rebrand-signout-btn { display:flex; align-items:center; gap:0.5rem; background:transparent; border:1.5px solid #fee2e2; color:#ef4444; border-radius:8px; padding:0.6rem 1.2rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all .2s; }
        .rebrand-signout-btn:hover { background:#fee2e2; }
        .icon-btn { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px; border:none; cursor:pointer; flex-shrink:0; }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#121416', margin: 0 }}>
            Hello, {firstName}! 👋
          </h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{user.email}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <button className={`rebrand-profile-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Package size={15} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />
            My Orders
          </button>
          <button className={`rebrand-profile-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <User size={15} style={{ display:'inline', marginRight:6, verticalAlign:'middle' }} />
            My Account
          </button>
        </div>

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
                <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem' }}>No orders yet</p>
                <p style={{ fontSize: '0.85rem', margin: '0 0 1rem' }}>Your orders will appear here once you make a purchase.</p>
                <button className="rebrand-btn-primary" onClick={() => navigate('/rebrand')}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const isExpanded = expandedOrder === order.id;
                  const items = Array.isArray(order.items) ? order.items : [];
                  const date = new Date(order.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

                  return (
                    <div key={order.id} className="rebrand-order-card">
                      <div
                        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '0.5rem' }}
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500 }}>Order #{(order.id || '').slice(-6).toUpperCase()}</div>
                            <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>{date}</div>
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: cfg.bg, color: cfg.color, borderRadius: '20px', padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: 700 }}>
                            <StatusIcon size={13} />
                            {cfg.label}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#121416' }}>${Number(order.total_price || 0).toFixed(2)}</div>
                          </div>
                          <ChevronRight size={18} style={{ color: '#9ca3af', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #f3f4f6', padding: '1rem 1.25rem', background: '#fafafa' }}>
                          {items.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: 56, height: 56, background: '#f3f4f6', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Package size={22} color="#d1d5db" />
                                    </div>
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{item.name || item.productName || 'Jersey'}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.1rem' }}>
                                      Size: {item.size || '—'}
                                      {item.playerName && ` · Name: ${item.playerName}`}
                                      {item.playerNumber && ` · #${item.playerNumber}`}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.1rem' }}>
                                      Qty: {item.quantity || 1} · ${Number(item.price || 0).toFixed(2)} each
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>No item details available.</p>
                          )}

                          {order.shipping_address && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Ship to</div>
                              <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                                {typeof order.shipping_address === 'string'
                                  ? order.shipping_address
                                  : `${order.shipping_address.street || ''} ${order.shipping_address.city || ''} ${order.shipping_address.province || ''} ${order.shipping_address.postalCode || ''}`.trim()
                                }
                              </div>
                            </div>
                          )}

                          {order.tracking_number && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Tracking</div>
                              <div style={{ fontSize: '0.85rem', color: '#0ea5e9', fontWeight: 600 }}>{order.tracking_number}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Full Name</div>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="rebrand-input" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdateName()} autoFocus />
                  <button className="icon-btn rebrand-btn-primary" onClick={handleUpdateName} disabled={savingName}><Check size={16} /></button>
                  <button className="icon-btn rebrand-btn-outline" onClick={() => setIsEditingName(false)}><X size={16} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{user.user_metadata?.full_name || '—'}</span>
                  <button className="rebrand-btn-outline" onClick={() => setIsEditingName(true)}><Edit2 size={14} /> Edit</button>
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Email</div>
              <div style={{ fontSize: '1rem', color: '#111827' }}>{user.email}</div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.25rem' }}>To change your email, contact support.</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Member Since</div>
              <div style={{ fontSize: '1rem', color: '#111827' }}>
                {new Date(user.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <button className="rebrand-signout-btn" onClick={handleSignOut}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default RebrandProfile;

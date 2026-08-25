import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useRebrandAuth } from '../../context/RebrandAuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { Package, User, LogOut, ChevronRight, Edit2, Check, X, Truck, Clock, CheckCircle, XCircle, ShoppingBag, Heart, Star, MessageSquare } from 'lucide-react';
import TrackingModal from '../../components/TrackingModal';

const STATUS_CONFIG = {
  pending:    { label: 'Pending Payment',  color: '#f59e0b', bg: '#fef3c7' },
  paid:       { label: 'Paid',             color: '#3b82f6', bg: '#dbeafe' },
  processing: { label: 'Processing',       color: '#8b5cf6', bg: '#ede9fe' },
  shipped:    { label: 'Shipped',          color: '#0ea5e9', bg: '#e0f2fe' },
  completed:  { label: 'Delivered',        color: '#10b981', bg: '#d1fae5' },
  cancelled:  { label: 'Cancelled',        color: '#ef4444', bg: '#fee2e2' },
};

const RebrandProfile = () => {
  const { user, signOut, loading: authLoading, isAdmin } = useRebrandAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { wishlistItems, toggleWishlist } = useWishlist();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingModalCode, setTrackingModalCode] = useState('');

  // Depoimento
  const [myReview, setMyReview] = useState(null);      // depoimento já enviado
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '', location: '' });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);     // { type: 'success'|'error', text }

  const loadMyReview = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    setMyReview(data?.[0] || null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.content.trim()) {
      setReviewMsg({ type: 'error', text: 'Please write your review before submitting.' });
      return;
    }
    setReviewSaving(true);
    setReviewMsg(null);
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer';
    const payload = {
      name,
      content: reviewForm.content.trim(),
      rating: reviewForm.rating,
      location: reviewForm.location.trim() || null,
      status: 'pending',
      user_id: user.id,
      sort_order: 9999,
    };
    const { error } = await supabase.from('testimonials').insert([payload]);
    setReviewSaving(false);
    if (error) {
      setReviewMsg({ type: 'error', text: 'Error sending review. Please try again.' });
    } else {
      // Notificar o gestor por email
      try {
        await fetch('/api/notify-testimonial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            content: payload.content,
            rating: payload.rating,
            location: payload.location || 'Canada',
            userEmail: user.email,
          }),
        });
      } catch (notifyErr) {
        console.error('[Profile] Erro ao notificar gestor:', notifyErr);
      }
      setReviewMsg({ type: 'success', text: 'Thank you! Your review has been submitted for approval and will appear on the website soon. 🙏' });
      setReviewForm({ rating: 5, content: '', location: '' });
      loadMyReview();
    }
  };

  useEffect(() => {
    if (user) {
      setEditName(user.user_metadata?.full_name || '');
      loadOrders();
      loadMyReview();
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
    <>
    <div style={{ fontFamily: "'Inter', sans-serif", paddingBottom: '4rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .rp-tab { cursor:pointer; padding:0.75rem 1.5rem; border-bottom:2px solid transparent; color:#6b7280; font-weight:600; font-size:0.9rem; transition:all .2s; white-space:nowrap; background:none; border-left:none; border-right:none; border-top:none; }
        .rp-tab.active { border-bottom-color:#121416; color:#121416; }
        .rp-tab:hover:not(.active) { color:#121416; }
        .rp-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; transition:box-shadow .2s; }
        .rp-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }
        .rp-btn-primary { background:#121416; color:#fff; border:none; border-radius:8px; padding:0.6rem 1.2rem; font-size:0.85rem; font-weight:600; cursor:pointer; }
        .rp-btn-primary:hover { opacity:0.85; }
        .rp-btn-outline { background:transparent; color:#121416; border:1.5px solid #d1d5db; border-radius:8px; padding:0.5rem 1rem; font-size:0.85rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.4rem; }
        .rp-btn-outline:hover { border-color:#121416; }
        .rp-input { border:1.5px solid #d1d5db; border-radius:8px; padding:0.6rem 0.9rem; font-size:0.9rem; outline:none; width:100%; box-sizing:border-box; font-family:inherit; }
        .rp-input:focus { border-color:#121416; }
        .rp-signout { display:flex; align-items:center; gap:0.5rem; background:transparent; border:1.5px solid #fee2e2; color:#ef4444; border-radius:8px; padding:0.6rem 1.2rem; font-size:0.85rem; font-weight:600; cursor:pointer; }
        .rp-signout:hover { background:#fee2e2; }
        .rp-icon-btn { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px; border:none; cursor:pointer; flex-shrink:0; }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#121416', margin: 0 }}>
            Hello, {firstName}! 👋
          </h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{user.email}</p>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', overflowX: 'auto', gap: '0.5rem' }}>
          <button className={`rp-tab${activeTab === 'orders' ? ' active' : ''}`} onClick={() => setActiveTab('orders')}>
            {t('rb_profile_orders')}
          </button>
          <button className={`rp-tab${activeTab === 'wishlist' ? ' active' : ''}`} onClick={() => setActiveTab('wishlist')}>
            Wishlist
          </button>
          <button className={`rp-tab${activeTab === 'account' ? ' active' : ''}`} onClick={() => setActiveTab('account')}>
            {t('rb_my_account')}
          </button>
          <button className={`rp-tab${activeTab === 'review' ? ' active' : ''}`} onClick={() => setActiveTab('review')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={14} /> {t('rb_profile_feedback')}
          </button>
          {isAdmin && (
            <button className="rp-tab" onClick={() => navigate('/admin')} style={{ color: '#FB923C' }}>
              ⚙️ Admin Panel
            </button>
          )}
        </div>

        {activeTab === 'wishlist' && (
          <div>
            {wishlistItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
                <Heart size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>Your wishlist is empty</p>
                <p style={{ fontSize: '0.85rem', margin: '0 0 1rem' }}>Mark products with a heart on product details page to save them here.</p>
                <button className="rp-btn-primary" onClick={() => navigate('/rebrand')}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {wishlistItems.map(item => (
                  <div key={item.id} className="rp-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#f3f4f6' }}>
                      <Link to={`/rebrand/produto/${item.id}`}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </Link>
                      <button 
                        onClick={() => toggleWishlist(item)}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Heart size={16} fill="#dc3545" color="#dc3545" />
                      </button>
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>{item.category}</span>
                        <h4 style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 600, color: '#111827', lineHeight: '1.4' }}>
                          <Link to={`/rebrand/produto/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {item.name}
                          </Link>
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#121416', fontSize: '0.95rem' }}>${Number(item.price || 0).toFixed(2)} CAD</span>
                        <button 
                          className="rp-btn-primary" 
                          onClick={() => navigate(`/rebrand/produto/${item.id}`)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
                <ShoppingBag size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>No orders yet</p>
                <p style={{ fontSize: '0.85rem', margin: '0 0 1rem' }}>Your orders will appear here once you make a purchase.</p>
                <button className="rp-btn-primary" onClick={() => navigate('/rebrand')}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const isExpanded = expandedOrder === order.id;
                  const items = Array.isArray(order.items) ? order.items : [];
                  const date = new Date(order.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
                  return (
                    <div key={order.id} className="rp-card">
                      <div
                        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '0.5rem', flexWrap: 'wrap' }}
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Order #{(order.id || '').slice(-6).toUpperCase()}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{date}</div>
                          </div>
                          <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: 700 }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
                            <div style={{ fontWeight: 700, color: '#121416' }}>${Number(order.total_price || 0).toFixed(2)}</div>
                          </div>
                          <ChevronRight size={18} style={{ color: '#9ca3af', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #f3f4f6', padding: '1rem 1.25rem', background: '#fafafa' }}>
                          {items.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: 56, height: 56, background: '#f3f4f6', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Package size={22} color="#d1d5db" />
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{item.name || 'Jersey'}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                      Size: {item.size || '—'}{item.playerName ? ` · ${item.playerName}` : ''}{item.playerNumber ? ` #${item.playerNumber}` : ''}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#374151' }}>Qty: {item.quantity || 1} · ${Number(item.price || 0).toFixed(2)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>No item details available.</p>
                          )}
                          {order.shipping_address && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Ship to</div>
                              <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                                {typeof order.shipping_address === 'string' ? order.shipping_address :
                                  `${order.shipping_address.street || ''} ${order.shipping_address.city || ''} ${order.shipping_address.province || ''} ${order.shipping_address.postalCode || ''}`.trim()}
                              </div>
                            </div>
                          )}
                           {order.tracking_number ? (() => {
                             const trackingCodes = order.tracking_number.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
                             if (trackingCodes.length === 0) return null;
                             return (
                               <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                                 <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tracking Info</div>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                   {trackingCodes.map((code, idx) => (
                                     <button
                                       key={code}
                                       onClick={() => setTrackingModalCode(code)}
                                       className="rp-btn-outline"
                                       style={{ 
                                         display: 'inline-flex', 
                                         alignItems: 'center', 
                                         justifyContent: 'center', 
                                         gap: '0.5rem', 
                                         padding: '0.6rem 1.2rem',
                                         fontSize: '0.85rem',
                                         width: '100%',
                                         boxSizing: 'border-box',
                                         textAlign: 'center',
                                         cursor: 'pointer',
                                         border: 'none',
                                         background: 'none'
                                       }}
                                     >
                                       <Truck size={16} /> Track Package {trackingCodes.length > 1 ? `#${idx + 1}` : ''} ({code})
                                     </button>
                                   ))}
                                 </div>
                               </div>
                             );
                           })() : (
                             <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.82rem' }}>
                               <Clock size={14} style={{ flexShrink: 0 }} />
                               <span>Tracking links will appear here as soon as the order is shipped.</span>
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

        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Full Name</div>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="rp-input" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdateName()} autoFocus />
                  <button className="rp-icon-btn rp-btn-primary" onClick={handleUpdateName} disabled={savingName}><Check size={16} /></button>
                  <button className="rp-icon-btn rp-btn-outline" onClick={() => setIsEditingName(false)}><X size={16} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{user.user_metadata?.full_name || '—'}</span>
                  <button className="rp-btn-outline" onClick={() => setIsEditingName(true)}><Edit2 size={14} /> Edit</button>
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
              <button className="rp-signout" onClick={handleSignOut}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div style={{ maxWidth: 560 }}>
            {myReview ? (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <MessageSquare size={18} style={{ color: '#6b7280' }} />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Your Review</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem',
                    borderRadius: 20, textTransform: 'uppercase',
                    background: myReview.status === 'approved' ? '#d1fae5' : '#fef3c7',
                    color: myReview.status === 'approved' ? '#059669' : '#b45309'
                  }}>
                    {myReview.status === 'approved' ? '✅ Published' : '⏳ Pending approval'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= myReview.rating ? '#FBBF24' : 'none'} stroke={s <= myReview.rating ? '#FBBF24' : '#d1d5db'} />)}
                </div>
                <p style={{ color: '#374151', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 0.5rem' }}>"{myReview.content}"</p>
                {myReview.status === 'pending' && (
                  <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: 0 }}>Your review is under review and will be published soon.</p>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.35rem' }}>Share Your Experience</h2>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>Your feedback helps other customers and gets published on our homepage after approval.</p>

                {reviewMsg && (
                  <div style={{
                    padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem',
                    background: reviewMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: reviewMsg.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${reviewMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
                  }}>
                    {reviewMsg.text}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Star rating */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Rating</div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button"
                          onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                          <Star size={28} fill={s <= reviewForm.rating ? '#FBBF24' : 'none'} stroke={s <= reviewForm.rating ? '#FBBF24' : '#d1d5db'} style={{ transition: 'all 0.15s' }} />
                        </button>
                      ))}
                      <span style={{ marginLeft: '0.5rem', color: '#374151', fontSize: '0.9rem', alignSelf: 'center', fontWeight: 600 }}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                      </span>
                    </div>
                  </div>

                  {/* Review text */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Your Review *</label>
                    <textarea
                      className="rp-input"
                      rows={4}
                      value={reviewForm.content}
                      onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Tell us about your experience with our products and service..."
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                      required
                    />
                  </div>

                  {/* City (optional) */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Your City (optional)</label>
                    <input
                      className="rp-input"
                      value={reviewForm.location}
                      onChange={e => setReviewForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Calgary, AB"
                    />
                  </div>

                  <button type="submit" className="rp-btn-primary" disabled={reviewSaving} style={{ alignSelf: 'flex-start', padding: '0.7rem 1.75rem', fontSize: '0.9rem' }}>
                    {reviewSaving ? 'Sending...' : 'Submit Review 🙏'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>

    <TrackingModal
      isOpen={!!trackingModalCode}
      onClose={() => setTrackingModalCode('')}
      initialTrackingNumber={trackingModalCode}
    />
    </>
  );
};

export default RebrandProfile;

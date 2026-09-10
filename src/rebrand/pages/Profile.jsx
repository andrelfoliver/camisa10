import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useRebrandAuth } from '../../context/RebrandAuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { Package, User, LogOut, ChevronRight, Edit2, Check, X, Truck, Clock, CheckCircle, XCircle, ShoppingBag, Heart, Star, MessageSquare, Wallet, Gift, Sparkles } from 'lucide-react';
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
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingModalCode, setTrackingModalCode] = useState('');

  // Carteira / Store Credit
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loadingCredits, setLoadingCredits] = useState(true);

  const loadCredits = async () => {
    if (!user) return;
    setLoadingCredits(true);
    try {
      const email = (user.email || '').toLowerCase().trim();
      const { data: credits, error } = await supabase
        .from('customer_credits')
        .select('*')
        .or(`customer_email.eq.${email},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (credits && credits.length > 0) {
        setCreditHistory(credits);
        const total = credits.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
        setCreditBalance(Math.max(0, total));
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('store_credit')
          .eq('id', user.id)
          .single();
        const bal = parseFloat(profile?.store_credit || 0);
        setCreditBalance(Math.max(0, bal));
        setCreditHistory([]);
      }
    } catch (e) {
      console.error('[Profile] Error loading credits:', e);
    } finally {
      setLoadingCredits(false);
    }
  };

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
      loadCredits();
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
    navigate('/');
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#121416', margin: 0 }}>
              Hello, {firstName}! 👋
            </h1>
            <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{user.email}</p>
          </div>

          {/* Saldo Rápido no Topo */}
          {creditBalance > 0 && (
            <div 
              onClick={() => setActiveTab('credits')}
              style={{
                background: 'linear-gradient(135deg, #121416 0%, #1e293b 100%)',
                color: '#fff',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(204,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00' }}>
                <Wallet size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t('rb_profile_credits_balance')}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#CCFF00', lineHeight: 1.1 }}>
                  ${creditBalance.toFixed(2)} <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>CAD</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', overflowX: 'auto', gap: '0.5rem' }}>
          <button className={`rp-tab${activeTab === 'orders' ? ' active' : ''}`} onClick={() => setActiveTab('orders')}>
            {t('rb_profile_orders')}
          </button>
          <button className={`rp-tab${activeTab === 'credits' ? ' active' : ''}`} onClick={() => setActiveTab('credits')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wallet size={14} /> {t('rb_profile_credits')}
            {creditBalance > 0 && (
              <span style={{ background: '#CCFF00', color: '#121416', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: 10 }}>
                ${creditBalance.toFixed(0)}
              </span>
            )}
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

        {activeTab === 'credits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Big Wallet Card */}
            <div style={{
              background: 'linear-gradient(135deg, #121416 0%, #1f2937 100%)',
              borderRadius: '16px',
              padding: '2rem',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.08, color: '#CCFF00', pointerEvents: 'none' }}>
                <Wallet size={180} />
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(204,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00' }}>
                    <Sparkles size={16} />
                  </div>
                  <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                    {t('rb_profile_credits')}
                  </span>
                </div>

                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#CCFF00', margin: '0.25rem 0 0.5rem' }}>
                  ${creditBalance.toFixed(2)} <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>CAD</span>
                </div>

                {/* Badges de Regras de Crédito Dinâmicas */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {creditHistory.some(c => parseFloat(c.amount || 0) > 0 && (parseFloat(c.min_order_amount || 0) <= 0 || c.type === 'defect_compensation')) && (
                    <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {t('rb_profile_credit_defect_badge')}
                    </span>
                  )}
                  {creditHistory.some(c => parseFloat(c.amount || 0) > 0 && (parseFloat(c.min_order_amount || 0) > 0 || c.type === 'loyalty_reward' || c.type === 'reactivation_campaign')) && (
                    <span style={{ background: 'rgba(204, 255, 0, 0.15)', color: '#CCFF00', border: '1px solid rgba(204, 255, 0, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {t('rb_profile_credit_loyalty_badge')}
                    </span>
                  )}
                  <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {t('rb_profile_credit_instant_apply')}
                  </span>
                  <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem' }}>
                    {t('rb_profile_credit_non_cumulative')}
                  </span>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', margin: '0 0 1.5rem', maxWidth: 500, lineHeight: 1.5 }}>
                  {creditHistory.some(c => parseFloat(c.amount || 0) > 0 && (parseFloat(c.min_order_amount || 0) <= 0 || c.type === 'defect_compensation'))
                    ? t('rb_profile_credit_desc_mixed')
                    : t('rb_profile_credit_desc_loyalty')}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button 
                    className="rp-btn-primary" 
                    onClick={() => navigate('/')}
                    style={{ background: '#CCFF00', color: '#121416', fontWeight: 700, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ShoppingBag size={16} /> {t('rb_profile_use_credit')}
                  </button>
                  <button 
                    className="rp-btn-outline" 
                    onClick={() => loadCredits()}
                    disabled={loadingCredits}
                    style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)', padding: '0.75rem 1.25rem' }}
                  >
                    {loadingCredits ? t('rb_profile_credit_refreshing') : t('rb_profile_credit_refresh')}
                  </button>
                </div>
              </div>
            </div>

            {/* Extrato / Histórico */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="#6b7280" /> {t('rb_profile_credits_history')}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
                  {creditHistory.length} {creditHistory.length === 1 ? t('rb_profile_credit_records') : t('rb_profile_credit_records_plural')}
                </span>
              </div>

              {loadingCredits ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                  {t('rb_profile_credit_loading_history')}
                </div>
              ) : creditHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                  <Gift size={40} style={{ opacity: 0.25, margin: '0 auto 0.75rem', display: 'block' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 0.25rem', color: '#374151' }}>{t('rb_profile_no_credits')}</p>
                  <p style={{ fontSize: '0.82rem', margin: '0', color: '#9ca3af' }}>
                    {t('rb_profile_credit_no_history_sub')}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {creditHistory.map((item) => {
                    const isPositive = parseFloat(item.amount || 0) >= 0;
                    const dateStr = item.created_at 
                      ? new Date(item.created_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : (language === 'es' ? 'es-ES' : 'en-CA'), { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';

                    let typeLabel = t('rb_profile_credit_type_generic');
                    let typeBg = '#dcfce7';
                    let typeColor = '#15803d';

                    if (item.type === 'defect_compensation') {
                      typeLabel = t('rb_profile_credit_type_defect');
                      typeBg = '#fef3c7';
                      typeColor = '#b45309';
                    } else if (item.type === 'loyalty_reward' || item.type === 'reactivation_campaign') {
                      typeLabel = t('rb_profile_credit_type_loyalty');
                      typeBg = '#dcfce7';
                      typeColor = '#15803d';
                    } else if (item.type === 'order_redemption') {
                      typeLabel = t('rb_profile_credit_type_redemption');
                      typeBg = '#fee2e2';
                      typeColor = '#b91c1c';
                    } else if (item.type === 'refund') {
                      typeLabel = t('rb_profile_credit_type_refund');
                      typeBg = '#e0e7ff';
                      typeColor = '#4338ca';
                    }

                    return (
                      <div 
                        key={item.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem',
                          background: '#f9fafb',
                          border: '1px solid #f3f4f6',
                          borderRadius: 8,
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 4,
                              background: typeBg,
                              color: typeColor,
                              textTransform: 'uppercase'
                            }}>
                              {typeLabel}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{dateStr}</span>
                          </div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1f2937' }}>
                            {item.description || 'Crédito em loja'}
                          </div>
                          {item.order_id && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Ref. Pedido #{String(item.order_id).slice(-8)}
                            </div>
                          )}
                        </div>

                        <div style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: isPositive ? '#16a34a' : '#dc2626',
                          whiteSpace: 'nowrap'
                        }}>
                          {isPositive ? `+$${parseFloat(item.amount).toFixed(2)}` : `-$${Math.abs(parseFloat(item.amount)).toFixed(2)}`} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>CAD</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div>
            {wishlistItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
                <Heart size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>Your wishlist is empty</p>
                <p style={{ fontSize: '0.85rem', margin: '0 0 1rem' }}>Mark products with a heart on product details page to save them here.</p>
                <button className="rp-btn-primary" onClick={() => navigate('/')}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {wishlistItems.map(item => (
                  <div key={item.id} className="rp-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#f3f4f6' }}>
                      <Link to={`/produto/${item.id}`}>
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
                          <Link to={`/produto/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {item.name}
                          </Link>
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#121416', fontSize: '0.95rem' }}>${Number(item.price || 0).toFixed(2)} CAD</span>
                        <button 
                          className="rp-btn-primary" 
                          onClick={() => navigate(`/produto/${item.id}`)}
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
                <button className="rp-btn-primary" onClick={() => navigate('/')}>Start Shopping</button>
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

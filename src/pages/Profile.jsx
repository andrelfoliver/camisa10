import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, Package, Star, Calendar, MessageSquare, CheckCircle2, Clock, MapPin, TrendingUp, Copy, Share2, Menu, X as CloseIcon, Shield, PenTool, Zap, Lock } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Profile = () => {
  const { user, signOut, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ✅ ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState('pedidos');
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateCoupon, setAffiliateCoupon] = useState(null);
  const [affiliateStats, setAffiliateStats] = useState({ totalSales: 0, totalRevenue: 0, baseCommission: 0, bonusMeta: 0, totalPayable: 0, rate: 8, level: 'Bronze' });
  const [copySuccess, setCopySuccess] = useState(null); // id do que foi copiado
  const [affiliateDriveLink, setAffiliateDriveLink] = useState('');

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    const { data: feeds } = await supabase.from('testimonials').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (feeds) setMyFeedbacks(feeds);
    
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (orders) setMyOrders(orders);
    
    const { data: coupons } = await supabase.from('coupons').select('*').or(`agent_id.eq.${user.email},agent_id.eq.${user.user_metadata?.full_name}`);
    if (coupons && coupons.length > 0) {
      setIsAffiliate(true);
      const coupon = coupons[0];
      setAffiliateCoupon(coupon);

      // Calcular Financeiro do Afiliado
      const { data: allOrders } = await supabase.from('orders').select('*');
      if (allOrders) {
        const mySales = allOrders.filter(o => {
          const oRef = o.referrer;
          const oCoupon = o.coupon_code; 
          return oRef === coupon.agent_id || oCoupon === coupon.code;
        });

        const revenue = mySales.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);
        const count = mySales.length;
        
        const baseRate = 0.08;
        const bonusPerSale = 5.00;
        
        const baseCommission = revenue * baseRate;
        const bonusMeta = count * bonusPerSale;
        const totalPayable = baseCommission + bonusMeta;

        let level = '🥉 Bronze';
        if (count >= 51) level = '💎 Diamante';
        else if (count >= 26) level = '🥇 Ouro';
        else if (count >= 11) level = '🥈 Prata';

        setAffiliateStats({
          totalSales: count,
          totalRevenue: revenue,
          baseCommission,
          bonusMeta,
          totalPayable,
          rate: baseRate * 100,
          level
        });
      }
    }

    // Carregar Link do Drive (Global)
    const { data: pricingData } = await supabase.from('store_settings').select('value').eq('key', 'pricing').single();
    if (pricingData?.value) {
      try {
        const parsed = JSON.parse(pricingData.value);
        setAffiliateDriveLink(parsed.affiliateDriveLink || '');
      } catch (err) { console.error("Erro ao carregar link do drive", err); }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusLabel = (status) => {
    const map = {
      pending: t('profile_status_pending'),
      processing: t('profile_status_processing'),
      shipped: t('profile_status_shipped'),
      completed: t('profile_status_completed'),
      cancelled: t('profile_status_cancelled'),
    };
    return map[status] || status;
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const feedbackData = {
      user_id: user.id,
      name: user.user_metadata?.full_name || 'Fan',
      content,
      rating,
      location: location || 'Canada',
      avatar_url: user.user_metadata?.avatar_url || null,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    const { error } = await supabase.from('testimonials').insert([feedbackData]);
    if (error) {
      alert(t('profile_feedback_error') + error.message);
    } else {
      alert(t('profile_feedback_success'));
      setContent('');
      loadUserData();
    }
    setSubmitting(false);
  };

  // ✅ CONDITIONAL RETURNS ONLY AFTER ALL HOOKS
  if (authLoading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{t('profile_loading')}</div>;
  if (!user) return <Navigate to="/auth" />;
  if (isAdmin) return <Navigate to="/admin" />;

  return (
    <div className="container" style={{ padding: '4rem 1rem', minHeight: '80vh' }}>
      
      <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
        <img 
          src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/100'} 
          alt="Avatar" 
          style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-color)' }}
        />
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{user.user_metadata?.full_name || 'Fan'}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>
        </div>
      </div>

      <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }
        .profile-nav-list {
          flex-direction: column;
        }
        
        @media (max-width: 992px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .profile-sidebar {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            padding: 0.5rem !important;
            gap: 0.5rem !important;
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid var(--border-color) !important;
            border-radius: 0 !important;
            position: sticky;
            top: 70px;
            z-index: 100;
            background: var(--bg-color) !important;
            margin: 0 -1rem;
            width: calc(100% + 2rem);
            scrollbar-width: none;
          }
          .profile-sidebar::-webkit-scrollbar {
            display: none;
          }
          .profile-sidebar li {
            flex-shrink: 0;
          }
          .profile-sidebar button {
            white-space: nowrap;
            padding: 0.6rem 1.2rem !important;
            background: rgba(255,255,255,0.05);
            border-radius: 20px !important;
            font-size: 0.9rem !important;
            width: auto !important;
          }
          .profile-sidebar button.active {
            background: var(--accent-color) !important;
            color: #000 !important;
          }
          .profile-nav-list {
            flex-direction: row !important;
          }
          .profile-sidebar hr {
            display: none;
          }
        }
      `}</style>

      <div className="profile-grid">
        {/* Sidebar Menu - Transformed to Tabs on Mobile */}
        <div className="glass-panel profile-sidebar" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
          <ul className="profile-nav-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '1rem' }}>
            <li>
              <button 
                onClick={() => setActiveTab('pedidos')}
                className={activeTab === 'pedidos' ? 'active' : ''}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: activeTab === 'pedidos' ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: activeTab === 'pedidos' ? 600 : 400, fontSize: '1.1rem', padding: '0.5rem 0', transition: 'all 0.2s', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <Package size={20} /> {t('profile_tab_orders')}
              </button>
            </li>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            <li>
              <button 
                onClick={() => setActiveTab('feedback')}
                className={activeTab === 'feedback' ? 'active' : ''}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: activeTab === 'feedback' ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: activeTab === 'feedback' ? 600 : 400, fontSize: '1.1rem', padding: '0.5rem 0', transition: 'all 0.2s', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <MessageSquare size={20} /> {t('profile_tab_feedback')}
              </button>
            </li>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            {isAffiliate && (
              <>
                <li>
                  <button 
                    onClick={() => setActiveTab('afiliado')}
                    className={activeTab === 'afiliado' ? 'active' : ''}
                    style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: activeTab === 'afiliado' ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: activeTab === 'afiliado' ? 600 : 400, fontSize: '1.1rem', padding: '0.5rem 0', transition: 'all 0.2s', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <Star size={20} className="accent-text" /> Área do Afiliado
                  </button>
                </li>
                <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
              </>
            )}
            <li className="hide-mobile">
              <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: '#EF4444', fontSize: '1.1rem', padding: '0.5rem 0', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <LogOut size={20} /> {t('profile_logout')}
              </button>
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="glass-panel profile-content-panel" style={{ borderRadius: 'var(--radius-md)' }}>
          
          {activeTab === 'pedidos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package /> {t('profile_tab_orders')}</h2>
              
              {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>{t('profile_orders_loading')}</p>
              ) : myOrders.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem 2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>{t('profile_no_orders_title')}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>{t('profile_no_orders_text')}</p>
                  <button onClick={() => navigate('/colecao/lancamentos')} className="btn-primary" style={{ marginTop: '2rem' }}>
                    {t('profile_explore_btn')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {myOrders.map(order => (
                    <div key={order.id} style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{t('profile_order_prefix')}{order?.id?.slice(0, 8) || '......'}</p>
                            <p style={{ fontWeight: 600 }}>{order?.created_at ? new Date(order.created_at).toLocaleDateString() : '--/--/----'}</p>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.1rem' }}>
                              ${Number(order?.total_price || 0).toFixed(2)}
                            </p>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                               {getStatusLabel(order?.status)}
                            </span>
                         </div>
                      </div>
                      <div style={{ padding: '1.5rem' }}>
                         <div style={{ marginBottom: '1rem' }}>
                            {order?.items?.map((item, idx) => (
                               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                  <span style={{ color: 'var(--text-main)' }}>{item?.quantity || 1}x {item?.name || 'Product'} ({item?.size || '?'})</span>
                                  <span style={{ color: 'var(--text-muted)' }}>${(Number(item?.price || 0) * (item?.quantity || 1)).toFixed(2)}</span>
                               </div>
                            ))}
                         </div>
                         <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '4px' }}>
                            <MapPin size={14} style={{ marginTop: '2px' }} />
                            <div>
                               <p>{t('profile_delivery')} {order?.shipping_address?.street || ''}{order?.shipping_address?.apartment ? ', Apt ' + order.shipping_address.apartment : ''}</p>
                               <p>{order?.shipping_address?.city || ''}{order?.shipping_address?.province ? ', ' + order.shipping_address.province : ''} {order?.shipping_address?.postalCode || ''}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{t('profile_feedback_title')}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{t('profile_feedback_subtitle')}</p>
                
                <form onSubmit={handleSubmitFeedback} style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                   <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('profile_feedback_rating_label')}</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1,2,3,4,5].map(star => (
                           <button 
                             key={star} 
                             type="button"
                             onClick={() => setRating(star)}
                             style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                           >
                              <Star size={30} fill={star <= rating ? '#FFB81C' : 'transparent'} color={star <= rating ? '#FFB81C' : 'var(--text-muted)'} />
                           </button>
                        ))}
                      </div>
                   </div>

                   <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('profile_feedback_location_label')}</label>
                      <input 
                        type="text" 
                        value={location} 
                        onChange={e => setLocation(e.target.value)} 
                        placeholder={t('profile_feedback_location_placeholder')}
                        style={{ width: '100%', padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }} 
                      />
                   </div>

                   <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('profile_feedback_comment_label')}</label>
                      <textarea 
                        required
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        rows={4}
                        placeholder={t('profile_feedback_comment_placeholder')}
                        style={{ width: '100%', padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', resize: 'none' }} 
                      />
                   </div>

                   <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
                     {submitting ? t('profile_feedback_submitting') : t('profile_feedback_submit')}
                   </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1.5rem' }}>{t('profile_feedback_my_reviews')}</h3>
                {loading ? (
                  <p style={{ color: 'var(--text-muted)' }}>{t('profile_feedback_loading')}</p>
                ) : myFeedbacks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>{t('profile_feedback_empty')}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {myFeedbacks.map(f => (
                      <div key={f.id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                           <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < f.rating ? '#FFB81C' : 'transparent'} color={i < f.rating ? '#FFB81C' : 'var(--text-muted)'} />)}
                           </div>
                           <p style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.3rem' }}>"{f.content}"</p>
                           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('profile_feedback_sent_on')} {new Date(f.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ marginLeft: '1.5rem', textAlign: 'right' }}>
                           {f.status === 'approved' ? (
                             <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> {t('profile_feedback_approved')}
                             </span>
                           ) : (
                             <span style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                <Clock size={16} /> {t('profile_feedback_pending_review')}
                             </span>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'afiliado' && isAffiliate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(204, 255, 0, 0.15), rgba(0,0,0,0))', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent-color)' }}>Painel de Performance</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Acompanhe seus ganhos e utilize os materiais para vender mais.</p>
              </div>

              {/* Cards Financeiros - 4 Lado a Lado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem 0.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Nível Atual</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{affiliateStats.level}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem 0.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Vendas</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{affiliateStats.totalSales}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem 0.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total Vendido</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>${affiliateStats.totalRevenue.toFixed(2)}</div>
                </div>
                <div style={{ background: 'rgba(204, 255, 0, 0.1)', padding: '1.2rem 0.5rem', borderRadius: '16px', border: '1px solid var(--accent-color)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent-color)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>A Receber</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-color)' }}>${affiliateStats.totalPayable.toFixed(2)}</div>
                </div>
              </div>

              {/* Link e Cupom */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Link Curto para Bio/WhatsApp</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <code style={{ background: '#000', padding: '0.6rem', borderRadius: '4px', fontSize: '0.9rem', flex: 1, color: 'var(--accent-color)', fontWeight: 600 }}>
                      ifooty.ca/?ref={affiliateCoupon?.agent_id?.split(' ')[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'vendedor'}
                    </code>
                    <button 
                      onClick={() => {
                        const link = `https://ifooty.ca/?ref=${affiliateCoupon?.agent_id?.split(' ')[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'vendedor'}`;
                        navigator.clipboard.writeText(link);
                        setCopySuccess('link');
                        setTimeout(() => setCopySuccess(null), 2000);
                      }}
                      style={{ background: copySuccess === 'link' ? '#4ADE80' : 'var(--accent-color)', border: 'none', borderRadius: '4px', padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                    >
                      {copySuccess === 'link' ? <CheckCircle2 size={18} color="#000" /> : <Share2 size={18} color="#000" />}
                      {copySuccess === 'link' && <span style={{ color: '#000', fontSize: '0.7rem', fontWeight: 800 }}>COPIADO!</span>}
                    </button>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Seu Cupom</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{affiliateCoupon?.code || '---'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-color)' }}>-{affiliateCoupon?.discount_percent}%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Desconto p/ Cliente</div>
                  </div>
                </div>
              </div>

              {/* Scripts Expandidos */}
              <section>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={20} className="accent-text" /> Scripts de Alta Conversão
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {[
                    {
                      label: "🚀 Story / Status (Criar Curiosidade)",
                      text: "Galera, muita gente perguntando onde pego minhas camisas aqui no Canadá. Descobri a iFooty! Qualidade absurda, envio rápido de dentro do país e preço justo. Quem quiser o link e meu cupom de desconto me chama aqui!"
                    },
                    {
                      label: "📦 Sobre o Prazo de Entrega",
                      text: "O melhor é que o envio é feito por Canada Post. Geralmente chega em 10-15 dias, dependendo de onde você está. Pra Calgary é ainda mais rápido! E o melhor: zero risco de taxa alfandegária."
                    },
                    {
                      label: "💎 Sobre a Qualidade (Objeção de Preço)",
                      text: "Não confunda com camisa de camelô. Essa é qualidade Tailandesa 1.1, o tecido é o mesmo que os jogadores usam em campo. Os detalhes, costura e bordados são perfeitos. Vale cada centavo pela durabilidade."
                    },
                    {
                      label: "🎁 Promoção de Combos",
                      text: "Dica: se você pegar 2 ou mais camisas, o site aplica um desconto progressivo automático. Vale a pena juntar com um amigo pra economizar no frete e no valor unitário!"
                    },
                    {
                      label: "🛡️ Garantia de Satisfação",
                      text: "Pode ficar tranquilo quanto à qualidade. Se a camisa chegar com qualquer defeito de fábrica ou não for o que você esperava, a iFooty resolve na hora. O foco deles é a satisfação da comunidade brasileira aqui."
                    },
                    {
                      label: "✍️ Personalização (Nome e Número)",
                      text: "O mais legal é que dá pra colocar seu nome e número com a fonte oficial do time. Fica igualzinho à que os jogadores usam. É só selecionar a opção 'Com Personalização' na hora de escolher o tamanho."
                    },
                    {
                      label: "🔥 Estoque Limitado (Urgência)",
                      text: "Cara, as camisas desse time estão voando! O estoque no Canadá é limitado e se acabar demora pra chegar reposição. Se eu fosse você garantia a sua hoje pra não ficar sem."
                    },
                    {
                      label: "💳 Segurança no Pagamento (Interac)",
                      text: "O pagamento é via Interac e-Transfer, o sistema mais seguro do Canadá. Você só paga depois que o pedido é validado, e o iFooty é super transparente em todo o processo."
                    }
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#111', padding: '1.2rem', borderRadius: '12px', border: '1px solid #222' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-color)' }}>{item.label}</span>
                        <button 
                          onClick={() => { 
                            navigator.clipboard.writeText(item.text); 
                            setCopySuccess(i);
                            setTimeout(() => setCopySuccess(null), 2000);
                          }}
                          style={{ background: 'transparent', border: 'none', color: copySuccess === i ? '#4ADE80' : 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                        >
                          <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{copySuccess === i ? 'COPIADO!' : 'COPIAR'}</span>
                          {copySuccess === i ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p style={{ fontStyle: 'italic', color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5 }}>"{item.text}"</p>
                    </div>
                  ))}
                </div>
              </section>

              <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--surface-color)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                <TrendingUp size={32} className="accent-text" style={{ marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Acelere suas Vendas</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>Utilize nossas fotos reais e vídeos de unboxing para passar mais confiança aos seus clientes.</p>
                <button 
                  onClick={() => affiliateDriveLink && window.open(affiliateDriveLink, '_blank')} 
                  className="btn-primary" 
                  style={{ padding: '1rem 2rem', cursor: affiliateDriveLink ? 'pointer' : 'not-allowed', opacity: affiliateDriveLink ? 1 : 0.5 }}
                >
                   ACESSAR DRIVE DE MÍDIA <Package size={18} style={{ marginLeft: '0.5rem' }} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Profile;

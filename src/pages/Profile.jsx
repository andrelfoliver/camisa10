import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, Package, Star, Calendar, MessageSquare, CheckCircle2, Clock, MapPin } from 'lucide-react';
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

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    const { data: feeds } = await supabase.from('testimonials').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (feeds) setMyFeedbacks(feeds);
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (orders) setMyOrders(orders);
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

      <div className="profile-grid">
        
        {/* Sidebar Menu */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li>
              <button 
                onClick={() => setActiveTab('pedidos')}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: activeTab === 'pedidos' ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: activeTab === 'pedidos' ? 600 : 400, fontSize: '1.1rem', padding: '0.5rem 0', transition: 'all 0.2s' }}
              >
                <Package size={20} /> {t('profile_tab_orders')}
              </button>
            </li>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            <li>
              <button 
                onClick={() => setActiveTab('feedback')}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: activeTab === 'feedback' ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: activeTab === 'feedback' ? 600 : 400, fontSize: '1.1rem', padding: '0.5rem 0', transition: 'all 0.2s' }}
              >
                <MessageSquare size={20} /> {t('profile_tab_feedback')}
              </button>
            </li>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            <li>
              <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: '#EF4444', fontSize: '1.1rem', padding: '0.5rem 0', fontWeight: 600 }}>
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
        </div>

      </div>

    </div>
  );
};

export default Profile;

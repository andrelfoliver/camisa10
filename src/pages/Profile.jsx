import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, Star, Calendar, MessageSquare, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Profile = () => {
  const { user, signOut, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Carregando perfil...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (isAdmin) return <Navigate to="/admin" />;

  const [activeTab, setActiveTab] = useState('pedidos');
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // States para o Form
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    // 1. Feedbacks
    const { data: feeds } = await supabase.from('testimonials').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (feeds) setMyFeedbacks(feeds);

    // 2. Pedidos
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (orders) setMyOrders(orders);

    setLoading(false);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const feedbackData = {
      user_id: user.id,
      name: user.user_metadata?.full_name || 'Torcedor',
      content,
      rating,
      location: location || 'Canadá',
      avatar_url: user.user_metadata?.avatar_url || null,
      date: new Date().toISOString().split('T')[0],
      status: 'pending' // Forçado pelo default do banco também
    };

    const { error } = await supabase.from('testimonials').insert([feedbackData]);

    if (error) {
      alert("Erro ao enviar feedback: " + error.message);
    } else {
      alert("Depoimento enviado com sucesso! Ele aparecerá no site após a moderação.");
      setContent('');
      loadUserData(); // Chamada correta aqui
    }
    setSubmitting(false);
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', minHeight: '80vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
        <img 
          src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/100'} 
          alt="Avatar" 
          style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-color)' }}
        />
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{user.user_metadata?.full_name || 'Torcedor'}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '2rem' }}>
        
        {/* Sidebar Menu */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li>
              <button 
                onClick={() => setActiveTab('pedidos')}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: activeTab === 'pedidos' ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: activeTab === 'pedidos' ? 600 : 400, fontSize: '1.1rem', padding: '0.5rem 0', transition: 'all 0.2s' }}
              >
                <Package size={20} /> Meus Pedidos
              </button>
            </li>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            <li>
              <button 
                onClick={() => setActiveTab('feedback')}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: activeTab === 'feedback' ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: activeTab === 'feedback' ? 600 : 400, fontSize: '1.1rem', padding: '0.5rem 0', transition: 'all 0.2s' }}
              >
                <MessageSquare size={20} /> Meu Feedback
              </button>
            </li>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            <li>
              <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: '#EF4444', fontSize: '1.1rem', padding: '0.5rem 0', fontWeight: 600 }}>
                <LogOut size={20} /> Sair da Conta
              </button>
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-md)' }}>
          
          {activeTab === 'pedidos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package /> Meus Pedidos</h2>
              
              {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Buscando suas armaduras...</p>
              ) : myOrders.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem 2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>Nenhum pedido encontrado.</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Você ainda não garantiu a sua armadura. Visite as coleções para escolher a sua!</p>
                  <button onClick={() => navigate('/colecao/lancamentos')} className="btn-primary" style={{ marginTop: '2rem' }}>
                    Explorar Coleção
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {myOrders.map(order => (
                    <div key={order.id} style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Pedido #{order?.id?.slice(0, 8) || '......'}</p>
                            <p style={{ fontWeight: 600 }}>{order?.created_at ? new Date(order.created_at).toLocaleDateString() : '--/--/----'}</p>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.1rem' }}>
                              ${Number(order?.total_price || 0).toFixed(2)}
                            </p>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                               {order?.status === 'pending' ? '🟡 Aguardando WhatsApp' : order?.status === 'processing' ? '🔵 Preparando Envio' : '🟢 Enviado'}
                            </span>
                         </div>
                      </div>
                      <div style={{ padding: '1.5rem' }}>
                         <div style={{ marginBottom: '1rem' }}>
                            {order?.items?.map((item, idx) => (
                               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                  <span style={{ color: 'var(--text-main)' }}>{item?.quantity || 1}x {item?.name || 'Produto'} ({item?.size || '?'})</span>
                                  <span style={{ color: 'var(--text-muted)' }}>${(Number(item?.price || 0) * (item?.quantity || 1)).toFixed(2)}</span>
                               </div>
                            ))}
                         </div>
                         <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '4px' }}>
                            <MapPin size={14} style={{ marginTop: '2px' }} />
                            <div>
                               <p>Entrega: {order?.shipping_address?.street || 'Endereço não informado'}{order?.shipping_address?.apartment ? ', Apt ' + order.shipping_address.apartment : ''}</p>
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
                <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>O que você achou da Camisa10? 🗣️</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Sua opinião nos ajuda a crescer e ajuda outros brasileiros no Canadá!</p>
                
                <form onSubmit={handleSubmitFeedback} style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                   <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nota para sua experiência:</label>
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>De onde você comprou? (Cidade, Província)</label>
                      <input 
                        type="text" 
                        value={location} 
                        onChange={e => setLocation(e.target.value)} 
                        placeholder="Ex: Toronto, ON" 
                        style={{ width: '100%', padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }} 
                      />
                   </div>

                   <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Seu comentário:</label>
                      <textarea 
                        required
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        rows={4}
                        placeholder="Conte sua experiência com o produto, entrega e atendimento..."
                        style={{ width: '100%', padding: '1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', resize: 'none' }} 
                      />
                   </div>

                   <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
                     {submitting ? 'Enviando...' : 'Publicar Depoimento'}
                   </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1.5rem' }}>Meus Depoimentos Enviados</h3>
                {loading ? (
                  <p style={{ color: 'var(--text-muted)' }}>Carregando histórico...</p>
                ) : myFeedbacks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>Você ainda não enviou feedbacks.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {myFeedbacks.map(f => (
                      <div key={f.id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                           <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < f.rating ? '#FFB81C' : 'transparent'} color={i < f.rating ? '#FFB81C' : 'var(--text-muted)'} />)}
                           </div>
                           <p style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.3rem' }}>"{f.content}"</p>
                           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enviado em: {new Date(f.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ marginLeft: '1.5rem', textAlign: 'right' }}>
                           {f.status === 'approved' ? (
                             <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> Publicado
                             </span>
                           ) : (
                             <span style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                <Clock size={16} /> Em Análise
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

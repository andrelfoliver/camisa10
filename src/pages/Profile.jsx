import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, Star, Calendar } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/auth" />;
  if (isAdmin) return <Navigate to="/admin" />;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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
              <button style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent-color)', fontWeight: 600, fontSize: '1.1rem', padding: '0.5rem 0' }}>
                <Package size={20} /> Meus Pedidos
              </button>
            </li>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
            <li>
              <button style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)', fontSize: '1.1rem', padding: '0.5rem 0' }}>
                <Star size={20} /> Lista de Desejos
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
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package /> Pedidos Recentes</h2>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem 2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
             <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
             <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>Nenhum pedido encontrado.</h3>
             <p style={{ color: 'var(--text-muted)' }}>Você ainda não garantiu a sua armadura. Visite as coleções para escolher a sua!</p>
             <button onClick={() => navigate('/colecao/lancamentos')} className="btn-primary" style={{ marginTop: '2rem' }}>
               Explorar Coleção
             </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Profile;

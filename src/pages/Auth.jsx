import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, UserCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Auth = () => {
  const { user, isAdmin, signInWithGoogle } = useAuth();
  
  if (user) {
    // Se o usuário logou e é Admin, vá pro Admin. Se não, Painel do Cliente.
    return isAdmin ? <Navigate to="/admin" /> : <Navigate to="/perfil" />;
  }

  return (
    <div className="container" style={{ padding: '6rem 1rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', color: 'var(--accent-color)' }}>
          <UserCircle size={64} />
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>Área do Torcedor</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
          Identifique-se para acessar seus pedidos e concluir suas compras na iFooty.
        </p>

        <button 
          onClick={signInWithGoogle} 
          className="btn-primary" 
          style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', justifyContent: 'center', borderRadius: '8px' }}
        >
          <Database size={24} /> Entrar com Google
        </button>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Ao entrar, você concorda com nossos termos de privacidade e política de envios internacionais.
        </p>
      </div>
    </div>
  );
};

export default Auth;

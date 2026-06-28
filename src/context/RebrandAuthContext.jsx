import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseRebrand } from '../services/supabase';

const RebrandAuthContext = createContext();

// Email Mestre do Administrador (site de produção)
const ADMIN_EMAIL = 'ifootyc@gmail.com';

export function RebrandAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    supabaseRebrand.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeout);
    }).catch(err => {
      console.error("[Rebrand] Erro ao buscar sessão:", err);
      setLoading(false);
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabaseRebrand.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInWithIdToken = async ({ credential }) => {
    const { error } = await supabaseRebrand.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    window.google?.accounts?.id?.disableAutoSelect();
    const { error } = await supabaseRebrand.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = user?.email ? user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() : false;

  return (
    <RebrandAuthContext.Provider value={{ session, user, loading, isAdmin, signInWithIdToken, signOut }}>
      {loading ? (
        <div style={{ 
          height: '100vh', 
          width: '100vw', 
          background: '#000', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid rgba(255,255,255,0.1)', 
              borderTop: '3px solid #D6FF00', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Carregando Rebrand...</p>
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </RebrandAuthContext.Provider>
  );
}

export function useRebrandAuth() {
  return useContext(RebrandAuthContext);
}

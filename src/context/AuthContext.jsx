import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

// Email Mestre do Administrador
const ADMIN_EMAIL = 'camisadez085@gmail.com';

export async function generateNonce() {
  // Fallback para crypto.randomUUID se não existir (ex: navegadores antigos ou sem HTTPS)
  const rawNonce = (typeof crypto.randomUUID === 'function') 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  let hashedNonce = '';
  
  try {
    // Tenta usar a API Web Crypto se disponível
    if (crypto.subtle && typeof TextEncoder !== 'undefined') {
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(rawNonce)
      );
      hashedNonce = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Fallback básico se SubtleCrypto não estiver disponível
      hashedNonce = rawNonce;
    }
  } catch (e) {
    console.warn("WebCrypto não disponível, usando nonce cru", e);
    hashedNonce = rawNonce;
  }
  
  return { rawNonce, hashedNonce };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de segurança para evitar tela branca infinita se o Supabase não responder
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeout);
    }).catch(err => {
      console.error("Erro ao buscar sessão:", err);
      setLoading(false);
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInWithIdToken = async ({ credential, nonce }) => {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
      nonce,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    window.google?.accounts?.id?.disableAutoSelect();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ session, user, loading, isAdmin, signInWithIdToken, signOut }}>
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
              borderTop: '3px solid var(--accent-color, #ccff00)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Carregando iFooty...</p>
          </div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

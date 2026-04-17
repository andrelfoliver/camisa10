import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

// Gera um nonce SHA-256 — exigido pelo Supabase para signInWithIdToken
async function generateNonce() {
  const rawNonce = crypto.randomUUID();
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawNonce)
  );
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { rawNonce, hashedNonce };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Email Mestre do Administrador
  const ADMIN_EMAIL = 'bivisualizerr@gmail.com';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const gis = window.google?.accounts?.id;
    if (!gis) {
      throw new Error('SDK do Google ainda não carregou. Aguarde e tente novamente.');
    }

    const { rawNonce, hashedNonce } = await generateNonce();

    return new Promise((resolve, reject) => {
      gis.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          if (!response.credential) {
            reject(new Error('Nenhuma credencial recebida do Google.'));
            return;
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce: rawNonce,
          });
          if (error) reject(error);
          else resolve();
        },
      });

      gis.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          reject(new Error('Para fazer login, abra uma aba normal do navegador com sua conta Google conectada.'));
        }
      });
    });
  };

  const signOut = async () => {
    window.google?.accounts?.id?.disableAutoSelect();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ session, user, loading, isAdmin, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

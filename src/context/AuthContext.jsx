import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

  const signInWithGoogle = useCallback(async () => {
    return new Promise(async (resolve, reject) => {
      const gis = window.google?.accounts?.id;

      if (!gis) {
        reject(new Error('SDK do Google ainda não carregou. Aguarde e tente novamente.'));
        return;
      }

      // Gera nonce aleatório e faz hash SHA-256 (exigido pelo Supabase)
      const rawNonce = crypto.randomUUID();
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce));
      const hashedNonce = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      gis.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        callback: async ({ credential }) => {
          try {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: credential,
              nonce: rawNonce,
            });
            if (error) throw error;
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      gis.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          // One Tap completamente bloqueado (incógnito, FedCM desativado, etc.)
          reject(new Error('Para fazer login, abra uma aba normal do navegador com sua conta Google conectada.'));
        }
        // isSkippedMoment = One Tap apareceu mas foi ignorado/o usuário vai interagir
        // isDismissedMoment = usuário fechou, não faz nada
      });
    });
  }, []);

  const signOut = async () => {
    // Desativa o auto-select do Google para evitar re-login automático
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

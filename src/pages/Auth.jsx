import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const Auth = () => {
  const { user, isAdmin, signInWithIdToken } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gisReady, setGisReady] = useState(false);

  // Container onde o botão oficial do Google será renderizado
  const googleBtnRef = useRef(null);

  // Callback chamado pelo Google SDK após autenticação
  const handleGoogleCallback = useCallback(async (response) => {
    console.log("Google Callback recebido");
    if (!response.credential) {
      setError(t('auth_error_default'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Faz o login no Supabase usando o ID Token recebido
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        // Removido nonce para máxima compatibilidade no mobile por enquanto
      });

      if (error) throw error;
      
      console.log("Login no Supabase concluído com sucesso");
    } catch (err) {
      console.error("Erro no sign-in:", err);
      setError(`Erro no Login: ${err.message || 'Erro desconhecido'}`);
      setLoading(false);
    }
  }, [t]);

  const handleGoogleRedirectLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth',
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Erro no login alternativo:", err);
      setError(`Erro no Login: ${err.message || 'Erro desconhecido'}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initGIS = async () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;


      // Inicializa o GIS com o callback
      if (GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          callback: handleGoogleCallback,
        });

        // Renderiza o botão OFICIAL do Google (abre popup OAuth real, sem FedCM)
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          size: 'large',
          theme: 'filled_black',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 340,
        });
      } else {
        console.error("VITE_GOOGLE_CLIENT_ID não configurado!");
        setError("Erro de configuração do Google Login.");
      }

      if (!cancelled) setGisReady(true);
    };

    // Aguarda o SDK do Google carregar
    if (window.google?.accounts?.id) {
      initGIS();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGIS();
        }
      }, 150);
      return () => { cancelled = true; clearInterval(interval); };
    }

    return () => { cancelled = true; };
  }, [handleGoogleCallback]);

  if (user) {
    let redirectTo = null;
    try {
      redirectTo =
        sessionStorage.getItem('ifooty_redirect_after_login') ||
        localStorage.getItem('ifooty_redirect_after_login');
      if (redirectTo) {
        sessionStorage.removeItem('ifooty_redirect_after_login');
        localStorage.removeItem('ifooty_redirect_after_login');
      }
    } catch (e) {
      console.warn("Falha ao acessar storage no redirect:", e);
    }
    if (redirectTo) {
      return <Navigate to={redirectTo} />;
    }
    return isAdmin ? <Navigate to="/admin" /> : <Navigate to="/perfil" />;
  }

  return (
    <div className="container" style={{
      padding: '6rem 1rem',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center'
      }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', color: 'var(--accent-color)' }}>
          <UserCircle size={64} />
        </div>

        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>
          {t('auth_title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
          {t('auth_subtitle')}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            color: '#ef4444',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{
            padding: '1rem',
            background: 'rgba(204,255,0,0.05)',
            borderRadius: '8px',
            color: 'var(--accent-color)',
            fontWeight: 600,
            fontSize: '1rem'
          }}>
            {t('auth_loading')}
          </div>
        ) : (
          <>
            {/* Container do botão oficial do Google — abre popup real */}
            <div
              ref={googleBtnRef}
              style={{
                display: 'flex',
                justifyContent: 'center',
                minHeight: '44px',
                marginBottom: '0.5rem'
              }}
            />
            {!gisReady && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Carregando...
              </p>
            )}

            {/* Divisor */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ padding: '0 1rem' }}>{language === 'pt' ? 'ou' : 'or'}</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* Botão de redirect alternativo (especialmente para celular e Safari) */}
            <button
              onClick={handleGoogleRedirectLogin}
              style={{
                width: '100%',
                maxWidth: '340px',
                background: 'rgba(255,255,255,0.03)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s',
                margin: '0 auto'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'var(--accent-color)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.16-4.53z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {language === 'pt' ? 'Entrar com o Google (Alternativo / Celular)' : 'Sign in with Google (Alternative / Mobile)'}
            </button>
          </>
        )}

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {t('auth_terms')}
        </p>
      </div>
    </div>
  );
};

export default Auth;

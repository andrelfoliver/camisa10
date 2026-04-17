import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateNonce } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const Auth = () => {
  const { user, isAdmin, signInWithIdToken } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gisReady, setGisReady] = useState(false);

  // Container onde o botão oficial do Google será renderizado
  const googleBtnRef = useRef(null);
  // Guarda o nonce gerado para usar no callback
  const nonceRef = useRef({ raw: '', hashed: '' });

  // Callback chamado pelo Google SDK após autenticação
  const handleGoogleCallback = useCallback(async (response) => {
    if (!response.credential) {
      setError(t('auth_error_default'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithIdToken({
        credential: response.credential,
        nonce: nonceRef.current.raw,
      });
      // onAuthStateChange em AuthContext vai detectar o login automaticamente
    } catch (err) {
      setError(err.message || t('auth_error_default'));
      setLoading(false);
    }
  }, [signInWithIdToken, t]);

  useEffect(() => {
    let cancelled = false;

    const initGIS = async () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      // Gera novo nonce para esta sessão de login
      const { rawNonce, hashedNonce } = await generateNonce();
      if (cancelled) return;

      nonceRef.current = { raw: rawNonce, hashed: hashedNonce };

      // Inicializa o GIS com o callback
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
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
    const redirectTo =
      sessionStorage.getItem('ifooty_redirect_after_login') ||
      localStorage.getItem('ifooty_redirect_after_login');
    if (redirectTo) {
      sessionStorage.removeItem('ifooty_redirect_after_login');
      localStorage.removeItem('ifooty_redirect_after_login');
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Carregando...
              </p>
            )}
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

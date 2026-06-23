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

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'verify'

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;
      setStep('verify');
    } catch (err) {
      console.error("Erro ao enviar OTP:", err);
      setError(language === 'pt' 
        ? `Falha ao enviar código: ${err.message || 'Verifique o e-mail digitado.'}` 
        : `Failed to send code: ${err.message || 'Please check your email address.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError(language === 'pt' ? "O código deve ter 6 dígitos." : "Code must be 6 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Tentar como 'email' (login de usuário existente)
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: 'email'
      });

      if (error) {
        console.log("Falha com type: 'email', tentando type: 'signup'...");
        // 2. Se falhar, tentar como 'signup' (confirmação de novo cadastro)
        const { data: dataSignup, error: errorSignup } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpCode,
          type: 'signup'
        });
        
        if (errorSignup) {
          console.log("Falha com type: 'signup', tentando type: 'magiclink'...");
          // 3. Se falhar também, tentar como 'magiclink' (fallback)
          const { data: dataMagic, error: errorMagic } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: otpCode,
            type: 'magiclink'
          });
          
          if (errorMagic) {
            // Se todas as tentativas falharem, lança o erro
            throw errorSignup;
          }
        }
      }
    } catch (err) {
      console.error("Erro ao verificar OTP:", err);
      setError(language === 'pt' 
        ? `Código inválido ou expirado: ${err.message}` 
        : `Invalid or expired code: ${err.message}`
      );
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

        {loading && (
          <div style={{
            padding: '1rem',
            background: 'rgba(204,255,0,0.05)',
            borderRadius: '8px',
            color: 'var(--accent-color)',
            fontWeight: 600,
            fontSize: '1rem',
            marginBottom: '1.5rem'
          }}>
            {t('auth_loading')}
          </div>
        )}

        {!loading && (
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Carregando Google Login...
              </p>
            )}

            {step === 'email' ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {language === 'pt' ? 'ou entrar com e-mail' : 'or sign in with email'}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <input
                  type="email"
                  placeholder={language === 'pt' ? 'Seu melhor e-mail (qualquer provedor)' : 'Your best email (any provider)'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    padding: '0.8rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    background: 'var(--accent-color)',
                    color: '#000',
                    border: 'none',
                    transition: 'transform 0.2s, opacity 0.2s'
                  }}
                >
                  {language === 'pt' ? 'Receber Código de Acesso' : 'Get Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                  {language === 'pt' 
                    ? `Enviamos um código de 6 dígitos para:` 
                    : `We sent a 6-digit code to:`}
                  <strong style={{ display: 'block', color: '#fff', marginTop: '0.2rem' }}>{email}</strong>
                </p>

                <input
                  type="text"
                  placeholder="123456"
                  maxLength="6"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    padding: '0.8rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--accent-color)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '4px',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                  autoFocus
                />

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    background: 'var(--accent-color)',
                    color: '#000',
                    border: 'none'
                  }}
                >
                  {language === 'pt' ? 'Confirmar Código e Entrar' : 'Verify Code & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtpCode(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textDecoration: 'underline',
                    marginTop: '0.5rem'
                  }}
                >
                  {language === 'pt' ? 'Alterar e-mail' : 'Change email'}
                </button>
              </form>
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

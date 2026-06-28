import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const RebrandAuth = () => {
  const { user, signInWithIdToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gisReady, setGisReady] = useState(false);

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'verify'
  const [otpType, setOtpType] = useState('email'); // 'email' or 'signup'
  const [showEmailForm, setShowEmailForm] = useState(true);

  const googleBtnRef = useRef(null);

  const handleGoogleCallback = useCallback(async (response) => {
    if (!response.credential) {
      setError("Failed to authenticate with Google.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setError(`Google Login Error: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    setLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false }
      });

      if (error) {
        const { error: signUpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: true }
        });
        if (signUpError) throw signUpError;
        setOtpType('signup');
      } else {
        setOtpType('email');
      }
      setStep('verify');
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(`Failed to send code: ${err.message || 'Please check your email address.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError("Code must be at least 6 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: otpType
      });

      if (error) {
        if (otpType === 'email') {
          const { error: magicError } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: otpCode,
            type: 'magiclink'
          });
          if (magicError) throw magicError;
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError(`Invalid or expired code: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initGIS = async () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;

      if (GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 340,
        });
      } else {
        setError("Google Login is currently unavailable.");
      }

      if (!cancelled) setGisReady(true);
    };

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
    const REBRAND_ADMIN_EMAIL = 'ifootyc@gmail.com';
    const isRebrandAdmin = user.email?.toLowerCase().trim() === REBRAND_ADMIN_EMAIL;
    const savedRedirect = sessionStorage.getItem('ifooty_redirect_after_login');
    sessionStorage.removeItem('ifooty_redirect_after_login');
    const redirectTo = isRebrandAdmin ? '/rebrand/admin' : (savedRedirect || '/rebrand');
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      background: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        padding: '3rem 2rem',
        borderRadius: '16px',
        background: '#ffffff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        textAlign: 'center',
        border: '1px solid #e9ecef'
      }}>
        
        <button 
          onClick={() => navigate('/rebrand')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#6c757d', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back to Shop
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#121416' }}>
          <UserCircle size={56} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#121416', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Sign In
        </h1>
        <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
          Access your account, orders and exclusive fan offers.
        </p>

        {error && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px',
            padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#dc3545',
            fontSize: '0.85rem', textAlign: 'left', display: 'flex', gap: '0.5rem', alignItems: 'center'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div style={{
            padding: '1rem', background: '#f8f9fa', borderRadius: '8px',
            color: '#121416', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem'
          }}>
            Processing, please wait...
          </div>
        )}

        {!loading && (
          <>
            {/* Google Sign-in */}
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: '44px', marginBottom: '1.5rem' }} ref={googleBtnRef} />
            
            {!gisReady && (
              <p style={{ color: '#6c757d', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Loading Google Login...
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#dee2e6' }}></div>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                or use email code
              </span>
              <div style={{ flex: 1, height: '1px', background: '#dee2e6' }}></div>
            </div>

            {step === 'email' ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    padding: '0.8rem 1rem', border: '1.5px solid #dee2e6', borderRadius: '8px',
                    color: '#121416', fontSize: '0.95rem', outline: 'none', textAlign: 'center',
                    background: '#ffffff', width: '100%', boxSizing: 'border-box'
                  }}
                />
                
                <button
                  type="submit"
                  style={{
                    padding: '0.9rem', borderRadius: '100px', fontWeight: 800, fontSize: '0.95rem',
                    cursor: 'pointer', background: '#121416', color: '#fff', border: 'none',
                    transition: 'opacity 0.2s'
                  }}
                >
                  Send Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: '0.5rem 0' }}>
                  We sent the verification code to:
                  <strong style={{ display: 'block', color: '#121416', marginTop: '0.2rem' }}>{email}</strong>
                </p>

                <input
                  type="text"
                  placeholder="000000"
                  maxLength="8"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    padding: '0.8rem 1rem', border: '2px solid #121416', borderRadius: '8px',
                    color: '#121416', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '4px',
                    textAlign: 'center', outline: 'none', background: '#ffffff', width: '100%', boxSizing: 'border-box'
                  }}
                  autoFocus
                />

                <button
                  type="submit"
                  style={{
                    padding: '0.9rem', borderRadius: '100px', fontWeight: 800, fontSize: '0.95rem',
                    cursor: 'pointer', background: '#2b8a3e', color: '#fff', border: 'none'
                  }}
                >
                  Verify & Sign In
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtpCode(''); }}
                  style={{
                    background: 'transparent', border: 'none', color: '#6c757d',
                    cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline', marginTop: '0.5rem'
                  }}
                >
                  Change email
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RebrandAuth;

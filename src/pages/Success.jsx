import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Mail, MessageCircle, Home } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const Success = () => {
  const { t } = useLanguage();
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { waNumber } = location.state || {};

  // Limpa o carrinho definitivamente ao chegar na página de sucesso
  React.useEffect(() => {
    clearCart();
  }, [clearCart]);

  const handleContactSupport = () => {
    const number = (waNumber || '5584991847739').replace(/\D/g, '');
    const message = encodeURIComponent(t('success_support_wa_msg') || 'Olá! Gostaria de tirar dúvidas sobre meu pedido.');
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  return (
    <div className="container" style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '4rem 1.5rem' 
    }}>
      <div className="glass-panel animate-fade-in" style={{ 
        maxWidth: '600px', 
        width: '100%', 
        padding: '3.5rem 2rem', 
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--accent-color)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            background: 'rgba(204, 255, 0, 0.1)', 
            padding: '1.5rem', 
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}>
            <CheckCircle2 size={64} color="var(--accent-color)" />
          </div>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic', marginBottom: '1rem', color: '#fff' }}>
          {t('success_title')}
        </h1>
        
        <p style={{ fontSize: '1.2rem', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '1.5rem' }}>
          {t('success_subtitle')}
        </p>

        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '2.5rem',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Mail size={18} />
            <p style={{ margin: 0 }}>{t('success_message')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            <button 
              onClick={handleContactSupport}
              className="btn-primary" 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                background: '#25D366', 
                color: '#fff',
                padding: '1.2rem',
                fontSize: '1.1rem'
              }}
            >
              <MessageCircle size={24} />
              {t('success_support_btn')}
            </button>
          </div>

          <a 
            href="/"
            className="btn-secondary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              padding: '1rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Home size={20} />
            {t('success_home_btn')}
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Success;

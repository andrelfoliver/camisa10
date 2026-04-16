import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const { language } = useLanguage();

  return (
    <div className="container" style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '4rem 1.5rem'
    }}>
      <div className="reveal" style={{ position: 'relative', marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: 'clamp(8rem, 20vw, 15rem)', 
          margin: 0, 
          lineHeight: 1, 
          opacity: 0.1,
          fontFamily: 'var(--font-display)',
          fontWeight: 900
        }}>
          404
        </h1>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '100%'
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
            {language === 'pt' ? 'Bola Fora!' : 'Ball Out!'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto' }}>
            {language === 'pt' 
              ? 'Essa página não existe ou foi removida do campo.' 
              : 'This page does not exist or has been removed from the field.'}
          </p>
        </div>
      </div>

      <div className="reveal delay-2" style={{ display: 'flex', gap: '1rem', flexDirection: 'column', alignItems: 'center' }}>
        <Link to="/" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          <ArrowLeft size={20} /> {language === 'pt' ? 'Voltar pro Jogo' : 'Back to the Game'}
        </Link>
        
        <Link to="/colecao/lancamentos" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem', textDecoration: 'underline' }}>
          {language === 'pt' ? 'Ver Lançamentos' : 'View New Drops'}
        </Link>
      </div>

      <style>{`
        @keyframes floatBall {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;

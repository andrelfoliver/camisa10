import React, { useState } from 'react';
import { X, Ruler, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SizeGuideModal = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('fan');

  // Handle ESC key press to close the modal
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'fan', label: language === 'pt' ? 'Torcedor' : 'Fan Edition' },
    { id: 'player', label: language === 'pt' ? 'Jogador' : 'Player Edition' },
    { id: 'women', label: language === 'pt' ? 'Feminina' : 'Women' },
    { id: 'kids', label: language === 'pt' ? 'Infantil' : 'Kids' },
    { id: 'special', label: language === 'pt' ? 'Especiais' : 'Plus Size' },
    { id: 'accessories', label: language === 'pt' ? 'Outros' : 'Other' }
  ];

  const TableHeader = () => (
    <thead>
      <tr style={{ background: 'rgba(204, 255, 0, 0.1)' }}>
        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Tamanho' : 'Size'}</th>
        <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Comprimento' : 'Length'}</th>
        <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Largura / Busto' : 'Width / Bust'}</th>
      </tr>
    </thead>
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content glass-panel" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '800px', 
          width: '95%', 
          maxHeight: '90vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Ruler className="text-neon" size={24} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{language === 'pt' ? 'Guia de Medidas' : 'Size Guide'}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="close-btn" 
            style={{ 
              padding: '0.6rem', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)', 
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs" style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          background: 'rgba(0,0,0,0.2)', 
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1.5rem',
                borderRadius: '100px',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem',
                fontWeight: 800,
                transition: 'all 0.2s',
                background: activeTab === tab.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#000' : 'var(--text-main)',
                border: 'none',
                cursor: 'pointer',
                minHeight: '38px',
                flexShrink: 0
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }} className="custom-scrollbar">
          
          {activeTab === 'fan' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)', textTransform: 'uppercase' }}>📊 {language === 'pt' ? 'Camisas Versão Torcedor' : 'Fan Edition Jerseys'}</h3>
              
              <div className="table-responsive" style={{ marginBottom: '2.5rem' }}>
                <p style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" style={{ height: '12px', filter: 'invert(1)' }} alt="Nike" /> Nike
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHeader />
                  <tbody>
                    {[['P (S)', '68-70', '48-50'], ['M', '70-73', '50-52'], ['G (L)', '73-76', '52-54'], ['GG (XL)', '76-79', '54-56'], ['XXL (2XL)', '79-81', '56-58']].map(([s, h, w], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-responsive" style={{ marginBottom: '2.5rem' }}>
                <p style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" style={{ height: '16px', filter: 'invert(1)' }} alt="Adidas" /> Adidas / Puma
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHeader />
                  <tbody>
                    {[['P (S)', '65-68', '50-52'], ['M', '68-71', '52-54'], ['G (L)', '71-74', '54-56'], ['GG (XL)', '74-76', '56-58'], ['XXL (2XL)', '76-79', '58-60']].map(([s, h, w], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'player' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>💎 {language === 'pt' ? 'Camisas Versão Jogador (Ajustada)' : 'Player Edition (Slim Fit)'}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                * {language === 'pt' ? 'Atenção: A versão jogador é mais justa ao corpo. Recomendamos escolher um tamanho acima do habitual.' : 'Warning: Player version is slim fit. We recommend choosing one size up.'}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader />
                <tbody>
                  {[['P (S)', '69-69', '49-51'], ['M', '69-71', '51-53'], ['G (L)', '71-73', '53-55'], ['GG (XL)', '73-75', '55-57'], ['XXL (2XL)', '75-77', '57-59']].map(([s, h, w], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'women' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>🚺 {language === 'pt' ? 'Camisas Femininas' : 'Women Jerseys'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader />
                <tbody>
                  {[['P (S)', '61-63', '40-41'], ['M', '63-66', '41-44'], ['G (L)', '66-69', '44-47'], ['GG (XL)', '69-71', '47-50']].map(([s, h, w], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'kids' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>👶 {language === 'pt' ? 'Kits Infantis' : 'Kids Kits'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(204, 255, 0, 0.1)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Tamanho (Idade)' : 'Size (Age)'}</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Comprimento' : 'Length'}</th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Largura' : 'Width'}</th>
                  </tr>
                </thead>
                <tbody>
                  {[['16 (3~4)', '44', '35'], ['18 (4~5)', '47', '37'], ['20 (5~6)', '50', '39'], ['22 (6~7)', '53', '41'], ['24 (8~9)', '56', '43'], ['26 (10~11)', '59', '45'], ['28 (12~13)', '62', '47']].map(([s, h, w], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'special' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>📏 {language === 'pt' ? 'Tamanhos Especiais' : 'Plus Sizes'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader />
                <tbody>
                  {[['3XL', '81-83', '62-64'], ['4XL', '83-85', '64-65']].map(([s, h, w], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'accessories' && (
            <div className="reveal">
              <div className="table-responsive" style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>🧥 {language === 'pt' ? 'Jaqueta Corta-Vento' : 'Windbreakers'}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHeader />
                  <tbody>
                    {[['P (S)', '67', '106'], ['M', '69', '110'], ['G (L)', '71', '114'], ['GG (XL)', '73', '118']].map(([s, h, w], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-responsive" style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>🏃 {language === 'pt' ? 'Agasalhos' : 'Tracksuits'}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <TableHeader />
                  <tbody>
                    {[['P (S)', '70', '98'], ['M', '72', '102'], ['G (L)', '74', '106'], ['GG (XL)', '76', '110'], ['XXL (2XL)', '78', '114']].map(([s, h, w], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'pt' ? '* Medidas aproximadas podem variar em 1-2 cm.' : '* Approximate measurements can vary by 1-2 cm.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;

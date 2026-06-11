import React, { useState } from 'react';
import { X, Ruler, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SizeGuideModal = ({ isOpen, onClose, isShoes, isNba, isStreetwear }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('fan');

  React.useEffect(() => {
    if (isShoes) {
      setActiveTab('shoes');
    } else if (isNba) {
      setActiveTab('nba');
    } else if (isStreetwear) {
      setActiveTab('streetwear');
    } else {
      setActiveTab('fan');
    }
  }, [isShoes, isNba, isStreetwear, isOpen]);

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
    { id: 'baby', label: language === 'pt' ? 'Bebê' : 'Baby Body' },
    { id: 'special', label: language === 'pt' ? 'Especiais' : 'Plus Size' },
    { id: 'shoes', label: language === 'pt' ? 'Tênis' : 'Shoes' },
    { id: 'nba', label: 'NBA' },
    { id: 'streetwear', label: 'Streetwear' },
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

          {activeTab === 'baby' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>🍼 {language === 'pt' ? 'Body de Bebê' : 'Baby Body'}</h3>
              <div className="table-responsive" style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(204, 255, 0, 0.1)' }}>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Tamanho' : 'Size'}</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Etiqueta' : 'Tag'}</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Comprimento' : 'Length'}</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Largura (Busto)' : 'Width (Bust)'}</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Ombro' : 'Shoulder'}</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Altura Rec.' : 'Height Rec.'}</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Peso Rec.' : 'Weight Rec.'}</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.85rem' }}>{language === 'pt' ? 'Idade Rec.' : 'Age Rec.'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['3M', '9', '44 cm', '27 cm', '24 cm', '65-75 cm', '7.5-9 kg', language === 'pt' ? '3-12 meses' : '3-12 months'],
                      ['6M', '9', '44 cm', '27 cm', '24 cm', '65-75 cm', '7.5-9 kg', language === 'pt' ? '3-12 meses' : '3-12 months'],
                      ['9M', '9', '44 cm', '27 cm', '24 cm', '65-75 cm', '7.5-9 kg', language === 'pt' ? '3-12 meses' : '3-12 months'],
                      ['12M', '12', '46 cm', '28 cm', '25 cm', '75-85 cm', '9-12 kg', language === 'pt' ? '12-24 meses' : '12-24 months']
                    ].map(([sz, tag, len, wdt, shld, hgt, wgt, age], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 600 }}>{sz}</td>
                        <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{tag}</td>
                        <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{len}</td>
                        <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{wdt}</td>
                        <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{shld}</td>
                        <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{hgt}</td>
                        <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{wgt}</td>
                        <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                💡 {language === 'pt' 
                  ? 'Medição manual com variação de 1-2 cm. Para bebês mais cheinhos, recomendamos escolher um tamanho maior.' 
                  : 'Manual measurement with 1-2 cm variation. For chubbier babies, we recommend choosing one size larger.'}
              </p>
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

          {activeTab === 'shoes' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)' }}>
                👟 {language === 'pt' ? 'Tabela de Tamanhos de Chuteiras' : 'Cleats Size Chart'}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Masculino */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '0.8rem', borderBottom: '1px solid var(--accent-color)', paddingBottom: '0.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    👨 {language === 'pt' ? 'Masculino' : "Men's"}
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(204, 255, 0, 0.05)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)', fontSize: '0.8rem' }}>EUR (EU)</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.8rem' }}>US (EUA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['39', '6.5'],
                        ['40', '7'],
                        ['41', '8'],
                        ['42', '9'],
                        ['43', '10'],
                        ['44', '11'],
                        ['45', '12']
                      ].map(([eu, us], idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>{eu}</td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{us}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Feminino */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '0.8rem', borderBottom: '1px solid var(--accent-color)', paddingBottom: '0.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    👩 {language === 'pt' ? 'Feminino' : "Women's"}
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(204, 255, 0, 0.05)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)', fontSize: '0.8rem' }}>EUR (EU)</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.8rem' }}>US (EUA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['35', '5'],
                        ['36', '6'],
                        ['37', '7'],
                        ['38', '8'],
                        ['39', '9'],
                        ['40', '10']
                      ].map(([eu, us], idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>{eu}</td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{us}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Juvenil */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '0.8rem', borderBottom: '1px solid var(--accent-color)', paddingBottom: '0.4rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    👶 {language === 'pt' ? 'Juvenil (Filhos)' : 'Youth (Kids)'}
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(204, 255, 0, 0.05)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)', fontSize: '0.8rem' }}>EUR (EU)</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)', fontSize: '0.8rem' }}>US (EUA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['31-35', '13C - 3Y']
                      ].map(([eu, us], idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>{eu}</td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{us}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dicas */}
              <div style={{ background: 'rgba(204, 255, 0, 0.03)', border: '1px dashed var(--accent-color)', borderRadius: '8px', padding: '1rem', marginTop: '1.2rem' }}>
                <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💡 {language === 'pt' ? 'Dicas de Ajuste:' : 'Sizing Tips:'}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <li>{language === 'pt' ? 'Chuteiras geralmente têm meio número maior.' : 'Cleats generally run half a size larger.'}</li>
                  <li>{language === 'pt' ? 'Escolha meio número acima se você tiver pés largos ou grossos.' : 'Choose half a size up if you have wide or thick feet.'}</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'nba' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)', textTransform: 'uppercase' }}>🏀 {language === 'pt' ? 'Regatas NBA (Swingman / Authentic)' : 'NBA Jerseys (Swingman / Authentic)'}</h3>
              
              <div className="table-responsive" style={{ marginBottom: '2.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(204, 255, 0, 0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Tamanho' : 'Size'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Comprimento' : 'Length'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Busto' : 'Bust'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Ombro' : 'Shoulder'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Altura & Peso Recomendados' : 'Recommended Height & Weight'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['S (P)', '70', '98 cm (49 cm)', '35', '160-170 cm | 40-52 kg (90-115 lbs)'],
                      ['M', '72', '106 cm (53 cm)', '37', '168-175 cm | 52-61 kg (115-135 lbs)'],
                      ['L (G)', '75', '112 cm (56 cm)', '39', '172-180 cm | 61-75 kg (135-165 lbs)'],
                      ['XL (GG)', '77', '120 cm (60 cm)', '41', '178-185 cm | 75-84 kg (165-185 lbs)'],
                      ['2XL (XXL)', '80', '130 cm (65 cm)', '44', '183-200 cm | 82-95 kg (180-210 lbs)']
                    ].map(([s, h, w, shld, rec], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h} cm</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{shld} cm</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{rec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dicas */}
              <div style={{ background: 'rgba(204, 255, 0, 0.03)', border: '1px dashed var(--accent-color)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💡 {language === 'pt' ? 'Dicas de Ajuste para Regatas NBA:' : 'NBA Jersey Sizing Tips:'}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <li>{language === 'pt' ? 'As regatas de basquete possuem um corte ligeiramente mais longo e folgado em comparação com as camisas de futebol padrão.' : 'Basketball jerseys have a slightly longer and looser fit compared to standard soccer jerseys.'}</li>
                  <li>{language === 'pt' ? 'Se você planeja usar a regata por cima de um moletom ou camiseta (estilo streetwear), recomendamos comprar o seu tamanho normal ou um tamanho acima.' : 'If you plan to wear the jersey over a hoodie or t-shirt (streetwear style), we recommend buying your regular size or one size up.'}</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'streetwear' && (
            <div className="reveal">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--accent-color)', textTransform: 'uppercase' }}>👕 {language === 'pt' ? 'Camisetas Streetwear' : 'Streetwear T-Shirts'}</h3>
              
              <div className="table-responsive" style={{ marginBottom: '2.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(204, 255, 0, 0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Tamanho' : 'Size'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Ombro' : 'Shoulder'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Comprimento' : 'Length'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Peito' : 'Chest'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Altura Recomendada' : 'Recommended Height'}</th>
                      <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--accent-color)' }}>{language === 'pt' ? 'Peso Recomendado' : 'Recommended Weight'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['S (P)', '50 cm', '66 cm', '100 cm', '155-160 cm', '36-45 kg'],
                      ['M', '52 cm', '68 cm', '104 cm', '160-165 cm', '45-54 kg'],
                      ['L (G)', '54 cm', '70 cm', '108 cm', '165-170 cm', '54-63 kg'],
                      ['XL (GG)', '56 cm', '73 cm', '112 cm', '170-175 cm', '63-72 kg'],
                      ['2XL (XXL)', '58 cm', '75 cm', '114 cm', '175-180 cm', '72-81 kg'],
                      ['3XL', '60 cm', '77 cm', '120 cm', '180-185 cm', '81-90 kg']
                    ].map(([s, shld, len, chst, h, w], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: 600 }}>{s}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{shld}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{len}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{chst}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{h}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>{w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dicas */}
              <div style={{ background: 'rgba(204, 255, 0, 0.03)', border: '1px dashed var(--accent-color)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💡 {language === 'pt' ? 'Dicas de Ajuste para Camisetas Streetwear:' : 'Streetwear T-Shirt Sizing Tips:'}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  <li>{language === 'pt' ? 'Essas camisetas possuem modelagem boxy/oversized fit, com ombros ligeiramente caídos e caimento mais largo.' : 'These t-shirts feature a boxy/oversized fit with slightly dropped shoulders and a wider drape.'}</li>
                  <li>{language === 'pt' ? 'Recomendamos comprar o seu tamanho habitual para um caimento moderno e confortável. Se preferir um ajuste mais tradicional/justo, opte por um tamanho menor.' : 'We recommend purchasing your usual size for a modern, comfortable fit. If you prefer a more traditional/tighter fit, consider sizing down.'}</li>
                </ul>
              </div>
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

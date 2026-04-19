import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import { X, MessageSquare, Mail, Award, CheckCircle2, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState(null);
  const [waNumber, setWaNumber] = useState('');

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data && data.value) setWaNumber(data.value);
    }
    loadConfig();
  }, []);

  const InfoModal = ({ title, onClose, children }) => (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: '1rem', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
    }}>
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', 
          position: 'relative', padding: '2.5rem', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)', animation: 'modalFadeUp 0.3s ease-out'
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.6 }}
        >
          <X size={24} />
        </button>
        <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1.5rem', fontWeight: 800 }}>{title}</h2>
        {children}
      </div>
      <style>{`
        @keyframes modalFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '4rem', paddingBottom: '2rem', marginTop: '4rem', background: '#050507' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1rem', fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 900 }}>
            <span style={{ color: 'var(--accent-color)' }}>i</span><span style={{ color: '#fff' }}>Footy</span><span style={{ color: 'var(--accent-color)' }}>.</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('footer_about')}
          </p>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{t('footer_links')}</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="/" style={{ color: 'var(--text-muted)', transition: '0.2s', textDecoration: 'none' }}>{t('footer_catalog')}</a></li>
            <li><a href="/#faq" style={{ color: 'var(--text-muted)', transition: '0.2s', textDecoration: 'none' }}>{t('footer_how_to_buy')}</a></li>
            <li><button onClick={() => setActiveModal('affiliates')} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: '0.2s', fontSize: '1rem' }}>{t('footer_affiliates')}</button></li>
            <li><button onClick={() => setActiveModal('contact')} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: '0.2s', fontSize: '1rem' }}>{t('footer_contact')}</button></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{t('footer_payment')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 600, color: '#FFB81C' }}>Interac</span> <span style={{ fontWeight: 400, color: 'var(--text-main)' }}>e-Transfer</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
            {t('footer_payment_desc')}
          </p>
        </div>
      </div>
      <div className="container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; {new Date().getFullYear()} iFooty. {t('footer_rights')}
        <div style={{ marginTop: '0.5rem', opacity: 0.5, fontSize: '0.7rem' }}>{t('footer_dev')} BIVisualizer</div>
      </div>

      {/* MODAL AFILIADOS */}
      {activeModal === 'affiliates' && (
        <InfoModal title="Programa de Embaixadores iFooty" onClose={() => setActiveModal(null)}>
          <div style={{ color: 'var(--text-main)' }}>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>Fature com a paixão pelo futebol! Divulgue o manto sagrado no Canadá e receba comissões agressivas por cada venda.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>10%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comissão Base</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>30 Dias</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validade do Cookie</div>
              </div>
            </div>

            <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><TrendingUp size={18} color="var(--accent-color)" /> Bônus por Volume Mensal</h4>
            <div style={{ marginBlock: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Até CA$ 2.000</span> <span style={{ fontWeight: 600 }}>10% Base</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>CA$ 2.001 - 4.000</span> <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>12% + CA$ 50 Bônus</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>CA$ 4.001 - 8.000</span> <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>15% + CA$ 200 Bônus</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Mais de CA$ 8.001</span> <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>20% + CA$ 500 Bônus</span>
              </div>
            </div>

            <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', marginTop: '2rem' }}><Award size={18} color="var(--accent-color)" /> Bônus Especiais</h4>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <li>Primeiro cliente novo: <strong>+CA$ 25</strong></li>
              <li>Black Friday / Cyber Monday: <strong>+5% extra</strong></li>
              <li>Copa do Mundo: <strong>+10% em camisas de seleção</strong></li>
              <li>Indicação de novo afiliado ativo: <strong>+CA$ 50/mês</strong></li>
            </ul>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(204, 255, 0, 0.05)', borderRadius: '12px', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
              <h4 style={{ color: 'var(--accent-color)', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} /> O que você PODE fazer
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Compartilhar em redes sociais, criar conteúdo no TikTok/YouTube/Instagram, usar sua própria lista de e-mails.</p>
              
              <h4 style={{ color: '#EF4444', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} /> O que NÃO pode fazer
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fazer Spam, comprar pelo próprio link, fraudar cliques ou usar a marca em anúncios sem autorização.</p>
            </div>

            <a 
              href={`https://wa.me/${waNumber.replace(/\D/g, '')}?text=Olá!%20Tenho%20interesse%20em%20me%20tornar%20um%20afiliado%20da%20iFooty.%20Gostaria%20de%20saber%20mais%20detalhes.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginTop: '2.5rem', padding: '1.2rem', textDecoration: 'none', fontWeight: 800 }}
            >
              <MessageSquare size={20} /> QUERO SER UM EMBAIXADOR
            </a>
          </div>
        </InfoModal>
      )}

      {/* MODAL CONTATO */}
      {activeModal === 'contact' && (
        <InfoModal title="Fale com a iFooty" onClose={() => setActiveModal(null)}>
          <div style={{ color: 'var(--text-main)' }}>
            <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>Estamos prontos para te ajudar a encontrar o seu manto ideal. Entre em contato pelos nossos canais oficiais:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <a 
                href={`https://wa.me/${waNumber.replace(/\D/g, '')}`} 
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
                  background: 'rgba(255,255,255,0.05)', borderRadius: '16px', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <MessageSquare size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>WhatsApp Oficial</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Falar com Atendimento</div>
                </div>
              </a>

              <a 
                href="mailto:parceiros@ifooty.ca" 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
                  background: 'rgba(255,255,255,0.05)', borderRadius: '16px', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <Mail size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>E-mail para Parcerias</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>parceiros@ifooty.ca</div>
                </div>
              </a>
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>Horário de Atendimento</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Segunda a Sábado: 09:00 - 18:00 (MST)<br/>Calgary, Alberta - Canada</p>
            </div>
          </div>
        </InfoModal>
      )}
    </footer>
  );
};

export default Footer;

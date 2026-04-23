import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import { X, MessageSquare, Mail, Award, CheckCircle2, AlertCircle, TrendingUp, DollarSign, FileText, Instagram } from 'lucide-react';

const InfoModal = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
  }}>
    <div
      className="glass-panel custom-scrollbar"
      style={{
        width: '100%', maxWidth: '600px', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto',
        position: 'relative', padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '24px',
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

const Footer = () => {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState(null);
  const [waNumber, setWaNumber] = useState('');
  const [contactData, setContactData] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle'); // idle, submitting, success, error

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data && data.value) setWaNumber(data.value);
    }
    loadConfig();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('submitting');
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: contactData.name,
            email: contactData.email,
            subject: contactData.subject || 'Contato via Site',
            message: contactData.message
          }
        ]);

      if (error) throw error;

      setContactStatus('success');
      setContactData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setContactStatus('idle'), 5000);
    } catch (err) {
      console.error('Erro ao enviar contato:', err);
      setContactStatus('error');
    }
  };

  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '4rem', paddingBottom: '2rem', marginTop: '4rem', background: '#050507' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        <div>
          <h2
            onClick={() => {
              if (window.location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                window.location.href = '/';
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0',
              marginBottom: '1rem',
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontStyle: 'italic',
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
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
        <InfoModal title={<>Convocação: Jogue no Time <span style={{ color: 'var(--accent-color)' }}>i</span><span style={{ color: '#fff' }}>Footy</span></>} onClose={() => setActiveModal(null)}>
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
              <li>Primeiro gol (1ª venda): <strong>+CA$ 5</strong></li>
              <li>Plano de Carreira: <strong>8% a 15%</strong></li>
              <li>Indicação de novo jogador ativo: <strong>+CA$ 25</strong></li>
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

            <button
              onClick={() => { setActiveModal(null); window.location.href = '/afiliados#cadastro'; }}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                marginTop: '2.5rem', padding: '1.2rem', width: '100%', border: 'none',
                cursor: 'pointer', fontSize: '1.1rem', fontWeight: 800
              }}
            >
              <FileText size={20} /> QUERO JOGAR NESTE TIME
            </button>

            <button
              onClick={() => { setActiveModal(null); window.location.href = '/afiliados'; }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                marginTop: '1.5rem', width: '100%', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              <FileText size={16} /> VER GUIA COMPLETO DO PROGRAMA
            </button>
          </div>
        </InfoModal>
      )}

      {/* MODAL CONTATO */}
      {activeModal === 'contact' && (
        <InfoModal title="Fale com o iFooty" onClose={() => setActiveModal(null)}>
          <div style={{ color: 'var(--text-main)' }}>
            <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>Estamos prontos para te ajudar a encontrar o seu manto ideal. Entre em contato pelos nossos canais oficiais:</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <a
                href={`https://wa.me/${waNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem',
                  background: 'rgba(255,255,255,0.05)', borderRadius: '16px', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>WhatsApp Oficial</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Falar com Atendimento</div>
                </div>
              </a>

              <a
                href="https://instagram.com/ifooty.ca"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem',
                  background: 'rgba(255,255,255,0.05)', borderRadius: '16px', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
                }}>
                  <Instagram size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Instagram</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>@ifooty.ca</div>
                </div>
              </a>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={18} color="var(--accent-color)" /> Envie uma mensagem
              </h4>

              {contactStatus === 'success' ? (
                <div style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ADE80', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                  <CheckCircle2 size={32} style={{ marginBottom: '0.8rem' }} />
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Mensagem enviada!</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.4rem' }}>O Professor entrará em contato em breve.</div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input
                      required
                      type="text"
                      placeholder="Nome"
                      value={contactData.name}
                      onChange={e => setContactData({ ...contactData, name: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                    />
                    <input
                      required
                      type="email"
                      placeholder="E-mail"
                      value={contactData.email}
                      onChange={e => setContactData({ ...contactData, email: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Assunto (Opcional)"
                    value={contactData.subject}
                    onChange={e => setContactData({ ...contactData, subject: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <textarea
                    required
                    placeholder="Sua mensagem..."
                    value={contactData.message}
                    onChange={e => setContactData({ ...contactData, message: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.8rem', color: '#fff', fontSize: '0.9rem', outline: 'none', minHeight: '100px', resize: 'vertical' }}
                  />

                  {contactStatus === 'error' && (
                    <div style={{ color: '#F87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={14} /> Erro ao enviar. Tente novamente mais tarde.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={contactStatus === 'submitting'}
                    className="btn-primary"
                    style={{ padding: '1rem', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', width: '100%', opacity: contactStatus === 'submitting' ? 0.7 : 1 }}
                  >
                    {contactStatus === 'submitting' ? 'ENVIANDO...' : 'ENVIAR MENSAGEM'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center', marginBottom: '2rem' }}>
            <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>Horário de Atendimento</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Segunda a Sábado: 09:00 - 18:00 (MST)<br />Calgary, Alberta - Canada</p>
          </div>
        </InfoModal>
      )}
    </footer>
  );
};

export default Footer;

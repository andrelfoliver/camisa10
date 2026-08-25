import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, HelpCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="rebrand-footer">
      {/* Guarantees */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2rem',
        paddingBottom: '4rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '4rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Truck size={32} color="var(--rebrand-volt)" />
          <div>
            <h5 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>{t('rb_footer_shipping_title')}</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#adb5bd' }}>{t('rb_footer_shipping_desc')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldCheck size={32} color="var(--rebrand-volt)" />
          <div>
            <h5 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>{t('rb_footer_quality_title')}</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#adb5bd' }}>{t('rb_footer_quality_desc')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <HelpCircle size={32} color="var(--rebrand-volt)" />
          <div>
            <h5 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>{t('rb_footer_support_title')}</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#adb5bd' }}>{t('rb_footer_support_desc')}</p>
          </div>
        </div>
      </div>

      <div className="rebrand-footer-grid">
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Link to="/rebrand" className="rebrand-logo-text" style={{ color: '#ffffff' }}>
              <span className="logo-i">i</span>Footy<span className="logo-dot">.</span>
            </Link>
            <div className="rebrand-logo-underline" style={{ width: '130px' }}></div>
          </div>
          <p style={{ color: '#adb5bd', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '1.5rem', maxWidth: '400px' }}>
            {t('rb_footer_about_text')}
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{t('rb_footer_shop_by_sport')}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <Link to="/colecao/soccer" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_soccer_jerseys')}</Link>
            <Link to="/colecao/basketball" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_basketball_jerseys')}</Link>
            <Link to="/colecao/football" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_football_jerseys')}</Link>
            <Link to="/colecao/baseball" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_baseball_jerseys')}</Link>
            <Link to="/colecao/hockey" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_hockey_jerseys')}</Link>
          </div>
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem' }}>{t('rb_footer_info_service')}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <Link to='/profile' style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_track_order')}</Link>
            <Link to='/about' style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_about_us')}</Link>
            <Link to='/affiliates' style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_affiliate')}</Link>
            <a href="https://wa.me/17788061419" target="_blank" rel="noopener noreferrer" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_contact')}: +1 (778) 806-1419</a>
            <a href="https://chat.whatsapp.com/BRxOBGKn84E8n3kiaqh7Jv?s=cl&p=i&mlu=2" target="_blank" rel="noopener noreferrer" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>{t('rb_footer_join_vip')}</a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: 0 }}>
          © {new Date().getFullYear()} iFooty. {t('rb_footer_rights')}
        </p>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" style={{ height: '22px', opacity: 0.7, filter: 'brightness(0) invert(1)' }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style={{ height: '20px', opacity: 0.7 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/InteracLogo.svg" alt="Interac" style={{ height: '20px', opacity: 0.7 }} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, HelpCircle, RefreshCw } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ background: '#121416', color: '#ffffff', padding: '5rem 2rem 2rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
            <h5 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>Canada-Wide Shipping</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#adb5bd' }}>Free shipping on premium orders</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldCheck size={32} color="var(--rebrand-volt)" />
          <div>
            <h5 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>100% Premium Quality</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#adb5bd' }}>Officially stitched details & fabrics</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <HelpCircle size={32} color="var(--rebrand-volt)" />
          <div>
            <h5 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>24/7 VIP Support</h5>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#adb5bd' }}>Talk directly to our team via WhatsApp</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '4rem', marginBottom: '4rem' }}>
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Link to="/rebrand" className="rebrand-logo-text" style={{ color: '#ffffff' }}>
              <span className="logo-i">i</span>Footy<span className="logo-dot">.</span>
            </Link>
            <div className="rebrand-logo-underline" style={{ width: '130px' }}></div>
          </div>
          <p style={{ color: '#adb5bd', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '1.5rem', maxWidth: '400px' }}>
            At iFooty, we're passionate about connecting sports fans with premium jerseys from the world's biggest leagues and national teams. 
            From soccer to hockey, basketball, football and baseball, we help fans wear their passion every day.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Shop By Sport</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <Link to="/rebrand/colecao/soccer" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>⚽ Soccer Jerseys</Link>
            <Link to="/rebrand/colecao/basketball" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>🏀 Basketball Jerseys</Link>
            <Link to="/rebrand/colecao/football" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>🏈 Football Jerseys</Link>
            <Link to="/rebrand/colecao/baseball" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>⚾ Baseball Jerseys</Link>
            <Link to="/rebrand/colecao/hockey" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>🏒 Hockey Jerseys</Link>
          </div>
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Info & Service</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <Link to="/rebrand/profile" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>Track Order</Link>
            <Link to="/rebrand/about" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>About Us</Link>
            <Link to="/afiliados" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>Affiliate Program</Link>
            <a href="https://chat.whatsapp.com/KKKNZoOnr57AanDT33KPrT" target="_blank" rel="noopener noreferrer" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>Join VIP WhatsApp Group</a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: 0 }}>
          © {new Date().getFullYear()} iFooty. Canada's Sports Jersey Store. All rights reserved.
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

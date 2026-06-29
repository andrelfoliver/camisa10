import React from 'react';
import { ArrowLeft, Award, Globe, ShieldCheck, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const RebrandAboutPage = () => {
  return (
    <div style={{ background: '#ffffff', minHeight: '80vh', padding: '3rem 2rem' }} className="rebrand-scope">
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/rebrand" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rebrand-text-muted)', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <ArrowLeft size={14} /> Back to Shop
          </Link>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#121416', marginBottom: '0.5rem', lineHeight: '1.1' }}>
          About iFooty
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--rebrand-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2.5rem' }}>
          🍁 Canada's Premium Stitched Jersey Store
        </p>

        {/* Story Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '1.05rem', lineHeight: '1.7', color: '#374151' }}>
          <p>
            Welcome to <strong>iFooty</strong>, your ultimate destination for high-quality sports jerseys in Canada. We are sports enthusiasts who believe that wearing your team's colors is more than just fandom, it's a second skin that carries memories, history, and belonging.
          </p>

          <p>
            Founded in British Columbia in 2022, iFooty emerged from a simple but powerful goal: to bridge the gap between passionate sports fans and premium, detailed fan gear. We specialize in replica versions and player versions featuring high-durability stitching, premium breathable mesh fabrics, and authentic tailored fits.
          </p>

          {/* Pillars Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '2rem 0' }}>
            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#121416', fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase' }}>
                <Award size={18} /> Premium Quality
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
                Every patch, nameplate, and number is stitched with care using durable, lightweight thread.
              </p>
            </div>
            
            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#121416', fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase' }}>
                <Globe size={18} /> Canada Shipping & Tracking
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
                Fast delivery with a comprehensive tracking system keeping you updated every step of the way.
              </p>
            </div>

            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '10px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#121416', fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase' }}>
                <ShieldCheck size={18} /> Secure Purchase & Support
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
                Encrypted Stripe checkout, PayPal protection, and VIP customer service to guide you every step of the way.
              </p>
            </div>
          </div>

          <p>
            From football to hockey, basketball, baseball, and soccer, we are proud to serve communities all over the country. Thank you for choosing iFooty as your sports jersey partner!
          </p>

          {/* Contact Details */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--rebrand-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Have questions? Get in touch</span>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
              <a href="mailto:info@ifooty.ca" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#121416', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' }}>
                <Mail size={16} /> info@ifooty.ca
              </a>
              <a href="https://wa.me/17788061419" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#121416', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' }}>
                <MessageCircle size={16} /> +1 (778) 806-1419
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RebrandAboutPage;

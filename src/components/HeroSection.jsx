import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';

const HeroSection = () => {
  const [heroBgUrl, setHeroBgUrl] = useState(() => {
    return localStorage.getItem('cached_hero_bg') || '';
  });

  useEffect(() => {
    async function loadHero() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'hero_bg').single();
      if (data && data.value) {
        setHeroBgUrl(data.value);
        localStorage.setItem('cached_hero_bg', data.value);
      }
    }
    loadHero();
  }, []);

  return (
    <section className="hero-funnel" style={{ '--hero-bg-url': `url('${heroBgUrl}')` }}>
      <div className="hero-overlay-texture"></div>
      
      <div className="hero-container-modern animate-fade-in">
        {/* Corner Left Zone */}
        <div className="hero-zone-west">
          <h1 className="hero-giant-title">
            VISTA SEU <span className="outline-text">TIME</span><br />
            MESMO LONGE DO <span className="accent-glow-text">BRASIL</span>
          </h1>

        </div>

        {/* Corner Right Zone */}
        <div className="hero-zone-east">
          {/* Prova social — abaixo da foto, fora da imagem */}
          <p style={{ fontSize: '0.85rem', color: '#fff', textAlign: 'center', margin: '0 0 0.4rem 0', opacity: 0.9 }}>⭐ +200 clientes satisfeitos no Canadá</p>

          <div className="hero-hud-badges">
            <div className="hud-item">
              <div className="hud-icon"><Truck size={18} /></div>
              <div className="hud-text">
                <span className="hud-value">Todo o Canadá</span>
              </div>
            </div>
            <div className="hud-item">
              <div className="hud-icon"><ShieldCheck size={18} /></div>
              <div className="hud-text">
                <span className="hud-value">Entrega garantida</span>
              </div>
            </div>
          </div>

          <div className="hero-actions-modern">
            <a href="#destaque" className="btn-hero-massive">
              GARANTIR MINHA CAMISA
            </a>
            <a href="#catalogo" className="btn-hero-outline">
              Ver todas as camisas
            </a>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="hero-decor-line"></div>
    </section>
  );
};

export default HeroSection;

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';

import { useLanguage } from '../context/LanguageContext';

const HeroSection = () => {
  const { t, language } = useLanguage();
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
      
      <div className="hero-container-modern animate-fade-in">
        
        {/* Social Proof no topo à direita */}
        <div className="hero-social-proof-top">
          {t('hero_satisfied_clients')}
        </div>

        {/* Content Box */}
        <div className="hero-zone-west">
          <h1 className="hero-giant-title">
            {t('hero_title_part1')}
            <span style={{ color: 'var(--accent-color)' }}>{t('hero_title_accent')}</span>
          </h1>

          <p className="hero-subtitle-modern">
            {t('hero_subtitle')}
          </p>

          {/* Trust Badges */}
          <div className="hero-trust-badges">
            <div className="badge-trust-item">
              <Truck size={24} color="var(--accent-color)" />
              <div className="badge-trust-text">
                <span className="badge-trust-title">{t('hero_shipping_all')}</span>
                <span className="badge-trust-desc">{t('hero_shipping_calgary')}</span>
              </div>
            </div>
            <div className="badge-trust-item">
              <ShieldCheck size={24} color="var(--accent-color)" />
              <div className="badge-trust-text">
                <span className="badge-trust-title">{t('hero_shipping_guaranteed')}</span>
                <span className="badge-trust-desc">{t('hero_shipping_moneyback')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="hero-actions-strategic">
            <a href="#catalogo" className="btn-hero-strategic-primary">
              {t('hero_btn_guarantee')}
            </a>
            <a href="#catalogo" className="btn-hero-strategic-secondary">
              {t('hero_btn_view_all')}
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

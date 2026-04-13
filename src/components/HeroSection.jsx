import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';

const HeroSection = () => {
  const [heroBgUrl, setHeroBgUrl] = useState(() => {
    return localStorage.getItem('cached_hero_bg') || '';
  });

  useEffect(() => {
    async function loadHero() {
      const { data, error } = await supabase.from('store_settings').select('value').eq('key', 'hero_bg').single();
      if (data && data.value) {
        setHeroBgUrl(data.value);
        localStorage.setItem('cached_hero_bg', data.value);
      }
    }
    loadHero();
  }, []);

  return (
    <section className="hero-funnel" style={{ '--hero-bg-url': `url('${heroBgUrl}')` }}>
      <div className="hero-content">
        <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s', fontSize: '3.5rem', lineHeight: 1.1 }}>
          Vista seu time mesmo longe do Brasil 🇧🇷
        </h1>
        
        <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Camisas estilo jogador entregues no Canadá
        </p>

        <div className="hero-badges animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="hero-badge-item">
            <Truck size={18} color="var(--accent-color)" /> Entrega p/ todo Canadá
          </div>
          <div className="hero-badge-item">
            <ShieldCheck size={18} color="var(--accent-color)" /> Alta qualidade
          </div>
          <div className="hero-badge-item">
            <Clock size={18} color="var(--accent-color)" /> Estoque limitado
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.4s', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <a href="#destaque" className="btn-primary btn-massive">
            Comprar agora
          </a>
          <a href="#catalogo" className="btn-secondary" style={{ border: 'none', background: 'transparent', textDecoration: 'underline' }}>
            Ver todas as camisas
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import React, { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import TeamsBar from '../components/TeamsBar';
import ProductCard from '../components/ProductCard';
import { supabase } from '../services/supabase';
import { ShieldCheck, Truck, Star, Package, Lock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ChevronRight, Users, Zap, Quote } from 'lucide-react';
import StatCounter from '../components/StatCounter';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        {question}
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && <p style={{ marginTop: '1rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{answer}</p>}
    </div>
  );
};



const Home = () => {
  const { pricingConfig } = useCart();
  const { t, language, translateProductDisplay } = useLanguage();

  // Estado inicial limpo - O site agora é 100% dinâmico via Supabase
  const [queridinhas, setQueridinhas] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeamFilter, setActiveTeamFilter] = useState(null);
  const [allProductsData, setAllProductsData] = useState([]);
  const [dbTeams, setDbTeams] = useState([]);

  const [storeSections, setStoreSections] = useState({
    'Seleções': [],
    'Brasileirão': [],
    'Internacionais': [],
    'Lançamentos': [],
    'Retrô': []
  });

  useEffect(() => {
    async function fetchHomeData() {
      let qIds = [];
      let cIds = [];

      // Buscar configurações globais na nuvem (Supabase)
      const { data: settingsData, error: settingsError } = await supabase.from('store_settings').select('*').in('key', ['queridinhas_ids', 'catalog_ids']);

      if (settingsError) {
        console.error("❌ Erro ao buscar configurações no Supabase:", settingsError);
      } else {
        console.log("✅ Configurações carregadas do Supabase:", settingsData);
      }

      if (settingsData && settingsData.length > 0) {
        settingsData.forEach(s => {
          try {
            const val = JSON.parse(s.value);
            if (s.key === 'queridinhas_ids') qIds = val;
            if (s.key === 'catalog_ids') cIds = val;
          } catch (e) {
            console.error(`❌ Erro ao processar chave ${s.key}:`, e);
          }
        });
      } else {
        console.warn("⚠️ Nenhuma configuração encontrada no Supabase para as chaves solicitadas.");
      }

      // Fallback para localStorage (opcional)
      if (qIds.length === 0) {
        const localQ = localStorage.getItem('queridinhas_ids');
        if (localQ) qIds = JSON.parse(localQ);
      }

      if (qIds && qIds.length > 0) {
        let supabaseData = [];
        const fetchIds = qIds
          .map(id => parseInt(id))
          .filter(id => !isNaN(id));

        if (fetchIds.length > 0) {
          const { data, error } = await supabase.from('products').select('*').in('id', fetchIds);
          if (data) supabaseData = data;
          if (error) console.error("Erro ao buscar queridinhas:", error);
        }

        const sortedQ = qIds.map(id => supabaseData.find(d => String(d.id) === String(id))).filter(Boolean);
        setQueridinhas(sortedQ);
      }

      const { data: dbData } = await supabase.from('products').select('*').order('id', { ascending: false });
      const allUnified = dbData || [];

      // Fallback automático: Se não houver queridinhas manuais, usa as marcadas como is_bestseller
      if (qIds.length === 0) {
        const autoQueridinhas = allUnified.filter(p => p.is_bestseller).slice(0, 6);
        setQueridinhas(autoQueridinhas);
      }

      const { data: teamsData } = await supabase.from('teams').select('*').order('name');
      if (teamsData) setDbTeams(teamsData);

      const mapCat = {
        'Seleções': [],
        'Brasileirão': [],
        'Internacionais': [],
        'Lançamentos': [],
        'Retrô': []
      };

      allUnified.forEach(p => {
        const cat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const pTeam = (p.team || '').toLowerCase();

        const isClub = (teamsData || []).some(t => t.name.toLowerCase() === pTeam);
        const isBrasileirao = cat === 'brasileirão' || cat === 'brasileirao' || cat.includes('brasileiro') || (p.league && p.league.toLowerCase() === 'brasileirão');
        const isSelecao = cat === 'seleções' || cat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || (p.league && p.league.toLowerCase() === 'seleções');
        const isRetro = cat === 'retrô' || cat.includes('retro') || (p.version || '').toLowerCase().includes('retrô') || pName.includes('retrô');
        const isInternacional = cat === 'internacionais' || cat.includes('europa') || cat.includes('europe') || (p.league && p.league !== 'Brasileirão' && p.league !== 'Seleções');

        // Permitir que uma camisa apareça em mais de uma sessão na Home
        let added = false;
        if (isBrasileirao) { mapCat['Brasileirão'].push(p); added = true; }
        if (isSelecao) { mapCat['Seleções'].push(p); added = true; }
        if (isInternacional && !isSelecao && !isBrasileirao) { mapCat['Internacionais'].push(p); added = true; }
        if (isRetro) { mapCat['Retrô'].push(p); added = true; }
        
        // Se for NOVO, aparece em Lançamentos obrigatoriamente
        if (p.is_new || cat === 'lançamentos' || cat.includes('lançament')) { 
          mapCat['Lançamentos'].push(p); 
          added = true; 
        }

        if (!added) mapCat['Lançamentos'].push(p); // Fallback
      });

      // Ordenar cada categoria para colocar is_bestseller no topo
      Object.keys(mapCat).forEach(key => {
        mapCat[key].sort((a, b) => {
          if (a.is_bestseller && !b.is_bestseller) return -1;
          if (!a.is_bestseller && b.is_bestseller) return 1;
          return 0;
        });
      });

      setStoreSections(mapCat);
      setAllProductsData(allUnified);

      // 3. Buscar depoimentos aprovados
      const { data: testimonialsData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('date', { ascending: false });
      if (testimonialsData) setTestimonials(testimonialsData);

      setLoading(false);
    }
    fetchHomeData();
  }, []);

  const activeTeams = dbTeams.filter(team =>
    team.league !== 'Seleções' && allProductsData.some(p => (p.team || '').toLowerCase() === team.name.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* 1. HERO */}
      <HeroSection />
      {activeTeams.length > 0 && (
        <TeamsBar teams={activeTeams} onSelectTeam={(team) => {
          setActiveTeamFilter(team);
          setTimeout(() => {
            document.getElementById('filtro-time')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }} />
      )}

      {/* SEÇÃO DE FILTRO DINÂMICO POR TIME */}
      {activeTeamFilter && (
        <section id="filtro-time" className="section-padding" style={{ background: 'linear-gradient(to bottom, #000, var(--surface-color))', borderBottom: '2px solid var(--accent-color)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-color)' }}>
                {activeTeamFilter.toUpperCase()}
              </h2>
              <button
                onClick={() => setActiveTeamFilter(null)}
                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
              >
                {t('section_categories')}
              </button>
            </div>

            <div className="grid-products">
              {allProductsData
                .filter(p => p.team?.toLowerCase().includes(activeTeamFilter.toLowerCase()) || p.name?.toLowerCase().includes(activeTeamFilter.toLowerCase()))
                .map(product => <ProductCard key={product.id} product={product} />)
              }
              {allProductsData.filter(p => p.team?.toLowerCase().includes(activeTeamFilter.toLowerCase()) || p.name?.toLowerCase().includes(activeTeamFilter.toLowerCase())).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  {t('home_empty_team')}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. PROVA E CONFIANÇA (ICONOS MOVIDOS PARA O TOPO) */}
      <section className="section-padding reveal delay-1" style={{ 
        background: 'var(--surface-color)', 
        borderBottom: '1px solid var(--border-color)',
        paddingTop: '6rem', /* Aumentado para evitar conflito visual com o marquee acima */
        paddingBottom: '6rem'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
              {t('home_numbers_title')}
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '1.5rem',
            maxWidth: '1000px',
            margin: '0 auto' 
          }}>
            
            {/* Clientes */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(219, 254, 135, 0.1)', borderRadius: '50%' }}>
                  <Users size={20} color="var(--accent-color)" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
                <StatCounter target={200} suffix="+" delay={0} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('stats_clients')}</p>
            </div>

            {/* Envio */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(219, 254, 135, 0.1)', borderRadius: '50%' }}>
                  <Truck size={20} color="var(--accent-color)" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
                <StatCounter target={100} suffix="%" delay={400} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('stats_shipping')}</p>
            </div>

            {/* WhatsApp */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(219, 254, 135, 0.1)', borderRadius: '50%' }}>
                  <Zap size={20} color="var(--accent-color)" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
                <StatCounter target={15} suffix="min" delay={800} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('stats_whatsapp')}</p>
            </div>

            {/* Seguro */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(219, 254, 135, 0.1)', borderRadius: '50%' }}>
                  <Lock size={20} color="var(--accent-color)" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
                <StatCounter target={100} suffix="%" delay={1200} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('stats_payment')}</p>
            </div>

          </div>
        </div>
      </section>


      {/* 4. AS QUERIDINHAS (CARROSSEL) */}
      <section className="section-padding reveal" style={{ background: 'var(--surface-color)' }}>
        <div className="container" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>{t('section_favorites_title')}</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.2rem' }}>{t('section_favorites_subtitle')}</p>

          <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '1.5rem', padding: '0 1.5rem 2rem' }}>
            {!loading && queridinhas.map(product => (
              <div key={product.id} style={{ minWidth: '220px', width: '220px', flexShrink: 0 }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COMBOS (OFERTA ESPECIAL) */}
      <section className="section-padding container reveal">
        <div style={{ background: 'linear-gradient(135deg, rgba(255,184,28,0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid var(--accent-color)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#EF4444', fontWeight: 800 }}>{t('promo_banner_title')}</h2>
          {(() => {
            const basePromoPrice = 47.90;
            const discountPercent2 = (pricingConfig?.discounts || []).find(d => d.qty === 2)?.percent || 8;
            const discountPercent3 = (pricingConfig?.discounts || []).find(d => d.qty === 3)?.percent || 12;

            const normalPrice2 = basePromoPrice * 2;
            const finalPricePerUnit2 = basePromoPrice * (1 - (discountPercent2 / 100));
            const finalTotal2 = finalPricePerUnit2 * 2;
            const savings2 = (basePromoPrice - finalPricePerUnit2) * 2;

            const normalPrice3 = basePromoPrice * 3;
            const finalPricePerUnit3 = basePromoPrice * (1 - (discountPercent3 / 100));
            const finalTotal3 = finalPricePerUnit3 * 3;
            const savings3 = (basePromoPrice - finalPricePerUnit3) * 3;

            return (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Combo 2 Camisas */}
                <div className="glass-panel" style={{ flex: 1, minWidth: '250px', padding: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('promo_banner_combo2')}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.2rem' }}>{t('promo_banner_from')} <del>${normalPrice2.toFixed(2)}</del> {t('promo_banner_for')}</p>
                  <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1 }}>${finalTotal2.toFixed(2)}</p>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    <span style={{ display: 'block', marginBottom: '0.2rem' }}>{t('home_comes_out_to')} <strong>${finalPricePerUnit2.toFixed(2)}</strong> {t('promo_banner_each')}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>💰 {t('promo_banner_savings')} ${savings2.toFixed(2)}</span>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <a href="#catalogo" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>{t('promo_banner_apply')}</a>
                  </div>
                </div>

                {/* Combo 3 Camisas */}
                <div className="glass-panel" style={{ flex: 1, minWidth: '250px', padding: '2rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--accent-color)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div className="badge" style={{ background: 'var(--accent-color)', color: '#000', left: '50%', transform: 'translate(-50%, -150%)', width: 'max-content' }}>{t('promo_banner_best_offer')}</div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('promo_banner_combo3')}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.2rem' }}>{t('promo_banner_from')} <del>${normalPrice3.toFixed(2)}</del> {t('promo_banner_for')}</p>
                  <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '1rem', lineHeight: 1 }}>${finalTotal3.toFixed(2)}</p>
                  <div style={{ background: 'rgba(219, 254, 135, 0.1)', border: '1px solid rgba(219, 254, 135, 0.3)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    <span style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{t('home_only')} <strong>${finalPricePerUnit3.toFixed(2)}</strong> {t('promo_banner_each')}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>🔥 {t('home_savings')} ${savings3.toFixed(2)}!</span>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <a href="#catalogo" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{t('promo_banner_apply')}</a>
                  </div>
                </div>
              </div>
            );
          })()}
          <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>{t('promo_footer_note')}</p>
        </div>
      </section>

      {/* 6. CARROSSEIS CATEGORIAS OFICIAIS */}
      <section id="catalogo" className="section-padding container reveal">

        {Object.entries(storeSections).map(([catName, products]) => (
          <div key={catName} style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', color: '#fff' }}>
                  {t(`nav_${catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('brasileirao', 'br').replace('internacionais', 'intl').replace('retro', 'retro')}`)}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  {t('home_best_options')} {t(`nav_${catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('brasileirao', 'br').replace('internacionais', 'intl').replace('retro', 'retro')}`).toLowerCase()}
                </p>
              </div>
              <a href={`/colecao/${catName.toLowerCase().replace('ç', 'c').replace('õ', 'o').replace('ã', 'a')}`} style={{ color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{t('home_view_all')} <ChevronRight size={16} /></a>
            </div>

            <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '1.5rem', paddingBottom: '1.5rem' }}>
              {!loading && products.map(product => (
                <div key={`section-${product.id}`} style={{ minWidth: '220px', width: '220px', flexShrink: 0 }}>
                  <ProductCard product={product} />
                </div>
              ))}
              {!loading && products.length === 0 && (
                <div style={{ padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'center' }}>
                  {t('home_comming_soon')} {catName}!
                </div>
              )}
            </div>
          </div>
        ))}

      </section>

      {/* 7. PERSONALIZAÇÃO (UPSELL) */}
      <section className="section-padding reveal" style={{ background: 'var(--surface-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>{t('customization_title')}</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px' }}>
              {t('customization_subtitle')}
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', minWidth: '250px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('customization_item1')}</p>
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ 11.90 CAD</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', minWidth: '250px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('customization_item2')}</p>
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ 3.90 CAD</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONEXÃO EMOCIONAL */}
      <section id="about" style={{ padding: '6rem 0', textAlign: 'center', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--accent-color)', marginBottom: '1.5rem', fontWeight: 700 }}>{t('about_title')}</h2>
          <h2 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 900, color: '#fff', marginBottom: '2rem' }}>
            {t('emotional_title')}
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
            {t('about_text1')}
          </p>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
            {t('about_text2')}
          </p>
        </div>
      </section>

      {/* 8. PROVA SOCIAL (CARROSSEL DINÂMICO) */}
      <section className="section-padding container" style={{ textAlign: 'center', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>{t('social_proof_title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3.5rem', fontSize: '1.2rem' }}>
          {t('social_proof_subtitle')}
        </p>

        <div className="testimonials-track hide-scrollbar">
          {testimonials.length > 0 ? (
            testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-card-premium shadow-hover">
                <Quote className="testimonial-quote-icon" size={80} />
                
                <div className="testimonial-badge-year">
                  {t('social_proof_client_since')} {testimonial.date ? new Date(testimonial.date).getFullYear() : new Date().getFullYear()}
                </div>

                <div className="testimonial-stars-container">
                  {Array.from({ length: Number(testimonial.rating) || 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="#FFB81C" />
                  ))}
                </div>

                <p className="testimonial-content-text">"{testimonial.content}"</p>

                <div className="testimonial-avatar-container">
                  {testimonial.avatar_url ? (
                    <img 
                      src={testimonial.avatar_url} 
                      alt={testimonial.name} 
                      className="testimonial-avatar-img"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className="testimonial-avatar-fallback" style={{ display: testimonial.avatar_url ? 'none' : 'flex' }}>
                    {(testimonial.name || '?').charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{testimonial.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Fallback caso não tenha nada no banco ainda
            [1, 2, 3].map(i => (
              <div key={i} className="testimonial-card-premium" style={{ opacity: 0.5 }}>
                <p style={{ color: 'var(--text-muted)' }}>{t('social_proof_loading') || 'Carregando depoimentos...'}</p>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('social_proof_swipe')}</p>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="section-padding container" style={{ maxWidth: '800px', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>{t('faq_title')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FAQItem question={t('faq_q1')} answer={t('faq_a1')} />
          <FAQItem question={t('faq_q2')} answer={t('faq_a2')} />
          <FAQItem question={t('faq_q3')} answer={t('faq_a3')} />
          <FAQItem question={t('faq_q4')} answer={t('faq_a4')} />
        </div>
      </section>

      {/* 10. CTA FINAL */}
      <section className="section-padding container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <CheckCircle2 size={48} color="#10B981" />
          <h2 style={{ fontSize: '2.5rem' }}>{t('cta_security')}</h2>
        </div>
        <h2 style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>{t('cta_title')}</h2>
        <a href="#catalogo" className="btn-primary btn-massive" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem', borderRadius: '3rem' }}>
          {t('cta_btn')}
        </a>
      </section>

    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import TeamsBar from '../components/TeamsBar';
import ProductCard from '../components/ProductCard';
import { supabase } from '../services/supabase';
import { ShieldCheck, Truck, Star, Package, Lock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
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
        if (cat === 'lançamentos' || cat.includes('lançament')) { mapCat['Lançamentos'].push(p); added = true; }

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
                  Nenhuma camisa do {activeTeamFilter} encontrada no momento. Tente outro clube!
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. PROVA E CONFIANÇA (ICONOS MOVIDOS PARA O TOPO) */}
      <section className="section-padding" style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.2rem' }}>Já somos <strong style={{ color: 'var(--accent-color)' }}>+200 clientes</strong> vestindo a paixão no Canadá! 🍁</p>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <Truck size={40} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.2rem' }}>Entrega garantida no Canadá</h4>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <ShieldCheck size={40} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.2rem' }}>Pagamento 100% seguro</h4>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <Star size={40} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.2rem' }}>Suporte via WhatsApp</h4>
            </div>
          </div>
        </div>
      </section>


      {/* 4. AS QUERIDINHAS (CARROSSEL) */}
      <section className="section-padding" style={{ background: 'var(--surface-color)' }}>
        <div className="container" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>As Queridinhas 🇧🇷</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.2rem' }}>Deslize para ver os mantos sagrados mais pedidos.</p>

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
      <section className="section-padding container">
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
                    <span style={{ display: 'block', marginBottom: '0.2rem' }}>{language === 'pt' ? 'Sai por' : 'Comes out to'} <strong>${finalPricePerUnit2.toFixed(2)}</strong> {t('promo_banner_each')}</span>
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
                    <span style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{language === 'pt' ? 'Sai por só' : 'Only'} <strong>${finalPricePerUnit3.toFixed(2)}</strong> {t('promo_banner_each')}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>🔥 {language === 'pt' ? 'Você economiza' : 'You save'} ${savings3.toFixed(2)}!</span>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <a href="#catalogo" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{t('promo_banner_apply')}</a>
                  </div>
                </div>
              </div>
            );
          })()}
          <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>* Preços baseados na camisa padrão. O desconto se aplica a <strong>qualquer</strong> peça. Adicione à sacola e a mágica acontece!</p>
        </div>
      </section>

      {/* 6. CARROSSEIS CATEGORIAS OFICIAIS */}
      <section id="catalogo" className="section-padding container">

        {Object.entries(storeSections).map(([catName, products]) => (
          <div key={catName} style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', color: '#fff' }}>{language === 'pt' ? catName : t(`nav_${catName.toLowerCase().replace('brasileirão', 'br').replace('internacionais', 'intl').replace('retrô', 'retro')}`)}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{language === 'pt' ? `As melhores opções em ${catName.toLowerCase()}` : `The best options in ${catName.toLowerCase()}`}</p>
              </div>
              <a href={`/colecao/${catName.toLowerCase().replace('ç', 'c').replace('õ', 'o').replace('ã', 'a')}`} style={{ color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{language === 'pt' ? 'Ver todas' : 'View all'} <ChevronRight size={16} /></a>
            </div>

            <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '1.5rem', paddingBottom: '1.5rem' }}>
              {!loading && products.map(product => (
                <div key={`section-${product.id}`} style={{ minWidth: '220px', width: '220px', flexShrink: 0 }}>
                  <ProductCard product={product} />
                </div>
              ))}
              {!loading && products.length === 0 && (
                <div style={{ padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'center' }}>
                  Novidades em breve de {catName}!
                </div>
              )}
            </div>
          </div>
        ))}

      </section>

      {/* 7. PERSONALIZAÇÃO (UPSELL) */}
      <section className="section-padding" style={{ background: 'var(--surface-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Deixe sua camisa única ✍️</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px' }}>
              Você poderá solicitar a personalização com a mesma fonte oficial dos jogadores diretamente dentro das opções do produto.
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', minWidth: '250px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nome + Número</p>
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ 11.90 CAD</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', minWidth: '250px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Patch de Campeonatos</p>
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ 3.90 CAD</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONEXÃO EMOCIONAL */}
      <section style={{ padding: '5rem 0', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 900, color: 'var(--accent-color)' }}>
            Porque ser torcedor não tem distância 🇧🇷
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: 1.6 }}>
            A saudade do seu país e a paixão pelo futebol vivem na mesma gaveta. Entregamos a qualidade de jogador profissional diretamente na sua porta no Canadá.
          </p>
        </div>
      </section>

      {/* 8. PROVA SOCIAL (CARROSSEL DINÂMICO) */}
      <section className="section-padding container" style={{ textAlign: 'center', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Voz da Arquibancada 🗣️</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3.5rem', fontSize: '1.2rem' }}>
          Desde 2022, conectando brasileiros em todo o Canadá com seus mantos favoritos.
        </p>

        <div className="testimonials-track hide-scrollbar" style={{ display: 'flex', gap: '2rem', overflowX: 'auto', padding: '1rem 0.5rem 3rem', scrollSnapType: 'x mandatory' }}>
          {testimonials.length > 0 ? (
            testimonials.map(t => (
              <div key={t.id} style={{ minWidth: '320px', maxWidth: '350px', background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'left', position: 'relative', scrollSnapAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--accent-color)', color: '#000', fontSize: '0.7rem', fontWeight: 900, padding: '0.3rem 0.8rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Cliente desde {new Date(t.date).getFullYear()}
                </div>

                <div style={{ color: '#FFB81C', marginBottom: '1.2rem', display: 'flex', gap: '2px' }}>
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={16} fill="#FFB81C" />)}
                </div>

                <p style={{ fontSize: '1.1rem', marginBottom: '2rem', fontStyle: 'italic', color: '#fff', lineHeight: 1.6 }}>"{t.content}"</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-color)' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-color), #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: '0.9rem' }}>
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>{t.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.location}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Fallback caso não tenha nada no banco ainda
            [1, 2, 3].map(i => (
              <div key={i} style={{ minWidth: '320px', background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'left', opacity: 0.5 }}>
                <p style={{ color: 'var(--text-muted)' }}>Depoimento carregando...</p>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Deslize lateralmente para ler mais →</p>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="section-padding container" style={{ maxWidth: '800px', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>Dúvidas Rápidas</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FAQItem question="Vocês entregam em todo o Canadá?" answer="Sim, enviamos para todas as províncias e cidades do Canadá com rastreamento." />
          <FAQItem question="Qual o prazo de entrega?" answer="Entre 10 e 20 dias úteis, dependendo de sua região." />
          <FAQItem question="Como escolher o tamanho?" answer="Use seu tamanho normal ou peça para ver a tabela de medidas no WhatsApp. Para estilo largo (streetwear), escolha um número maior." />
          <FAQItem question="O pagamento é seguro?" answer="100% Seguro através de gateways blindados, ou aceitamos e-Transfer via Interac." />
        </div>
      </section>

      {/* 10. CTA FINAL */}
      <section className="section-padding container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <CheckCircle2 size={48} color="#10B981" />
          <h2 style={{ fontSize: '2.5rem' }}>Site 100% Blindado</h2>
        </div>
        <h2 style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>{language === 'pt' ? 'Garanta sua camisa antes que acabe!' : 'Get your jersey before it sells out!'}</h2>
        <a href="#catalogo" className="btn-primary btn-massive" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem', borderRadius: '3rem' }}>
          {language === 'pt' ? 'Ver Catálogo' : 'View Catalog'}
        </a>
      </section>

    </div>
  );
};

export default Home;

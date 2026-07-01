import React, { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import TeamsBar from '../components/TeamsBar';
import ProductCard from '../components/ProductCard';
import { supabase } from '../services/supabase';
import { ShieldCheck, Truck, Star, Package, Lock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ChevronRight, Users, Zap, Quote, MapPin } from 'lucide-react';
import StatCounter from '../components/StatCounter';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';

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

const TypewriterCities = ({ cities }) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  
  useEffect(() => {
    if (!cities || cities.length === 0) return;
    if (isWaiting) return;
    
    const currentCity = String(cities[index % cities.length]);
    const typeSpeed = isDeleting ? 40 : 100;
    
    const timeout = setTimeout(() => {
      if (!isDeleting && text === currentCity) {
        setIsWaiting(true);
        setTimeout(() => {
          setIsDeleting(true);
          setIsWaiting(false);
        }, 2000); // Pausa ao completar a palavra
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setIndex((prev) => prev + 1);
      } else {
        setText(currentCity.substring(0, text.length + (isDeleting ? -1 : 1)));
      }
    }, typeSpeed);
    
    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, cities, isWaiting]);

  return (
    <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
      {text}
      <span style={{ 
        borderRight: '3px solid var(--accent-color)', 
        animation: 'blink 1s step-end infinite',
        marginLeft: '4px'
      }}></span>
      <style>{`@keyframes blink { 50% { border-color: transparent; } }`}</style>
    </span>
  );
};



const TestimonialCard = ({ testimonial, t }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="testimonial-card-premium shadow-hover">
      <Quote className="testimonial-quote-icon" size={80} />
      
      <div className="testimonial-badge-year">
        {t('social_proof_client_since')} {testimonial.date ? new Date(testimonial.date).getFullYear() : new Date().getFullYear()}
      </div>

      <div className="testimonial-stars-container">
        {Array.from({ length: Number(testimonial.rating) || 5 }).map((_, i) => (
          <Star key={i} size={16} fill="#FFB81C" />
        ))}
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <p className="testimonial-content-text" style={expanded ? { WebkitLineClamp: 'unset', overflow: 'visible', display: 'block' } : {}}>
          "{testimonial.content}"
        </p>
        {testimonial.content && testimonial.content.length > 180 && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', padding: '0 0 1rem 0', fontSize: '0.9rem', marginTop: '-1rem' }}
          >
            {expanded ? 'Ler menos' : 'Ler mais'}
          </button>
        )}
      </div>

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
  );
};

const Home = () => {
  const { pricingConfig } = useCart();
  const { t, language, translateProductDisplay, formatPrice } = useLanguage();

  // Estado inicial limpo - O site agora é 100% dinâmico via Supabase
  const [queridinhas, setQueridinhas] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeamFilter, setActiveTeamFilter] = useState(null);
  const [allProductsData, setAllProductsData] = useState([]);
  const [dbTeams, setDbTeams] = useState([]);
  const [topCities, setTopCities] = useState(['Toronto', 'Vancouver', 'Calgary']);

  const [storeSections, setStoreSections] = useState({
    'Seleções': [],
    'Brasileirão': [],
    'Internacionais': [],
    'Lançamentos': [],
    'Retrô': [],
    'Tênis': [],
    'NBA': [],
    'Streetwear': []
  });

  const sortProductsList = (list) => {
    return [...list].sort((a, b) => {
      // 1. Lançamento (is_new)
      if (a.is_new && !b.is_new) return -1;
      if (!a.is_new && b.is_new) return 1;

      // 2. Mais Vendida (is_bestseller)
      if (a.is_bestseller && !b.is_bestseller) return -1;
      if (!a.is_bestseller && b.is_bestseller) return 1;

      // 3. Pronta Entrega (Estoque Local)
      const aStock = a.inventory && Object.values(a.inventory).some(v => v > 0);
      const bStock = b.inventory && Object.values(b.inventory).some(v => v > 0);
      if (aStock && !bStock) return -1;
      if (!aStock && bStock) return 1;

      // 4. Preço (Menor para Maior) - Fallback para preço padrão de 47.90
      const aPrice = a.price || 47.90;
      const bPrice = b.price || 47.90;
      return aPrice - bPrice;
    });
  };

  useEffect(() => {
    async function fetchHomeData() {
      let qIds = [];
      let cIds = [];

      let productSales = {};
      const sortBySales = (list) => {
        return [...list].sort((a, b) => {
          const aSales = productSales[a.id] || 0;
          const bSales = productSales[b.id] || 0;
          
          if (bSales !== aSales) {
            return bSales - aSales; // Mais vendidos primeiro
          }
          
          // Desempates
          if (a.is_new && !b.is_new) return -1;
          if (!a.is_new && b.is_new) return 1;
          
          if (a.is_bestseller && !b.is_bestseller) return -1;
          if (!a.is_bestseller && b.is_bestseller) return 1;
          
          return (a.price || 47.90) - (b.price || 47.90);
        });
      };

      // Buscar configurações globais na nuvem (Supabase)
      const { data: settingsData, error: settingsError } = await supabase.from('store_settings').select('*').in('key', ['queridinhas_ids', 'catalog_ids', 'product_sales_ranking']);

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
            if (s.key === 'product_sales_ranking') productSales = val;
          } catch (e) {
            console.error(`❌ Erro ao processar chave ${s.key}:`, e);
          }
        });
      } else {
        console.warn("⚠️ Nenhuma configuração encontrada no Supabase para as chaves solicitadas.");
      }

      const { data: dbData } = await supabase.from('products').select('*').order('id', { ascending: false });
      const allUnified = dbData || [];

      // Seleção 100% dinâmica das "Queridinhas" baseada em vendas reais (popularidade) do catálogo
      // 1. Filtrar produtos que têm pelo menos 1 venda cadastrada
      const soldProducts = allUnified.filter(p => (productSales[p.id] || 0) > 0);
      
      // 2. Ordenar os produtos vendidos por volume real de vendas (decrescente)
      const sortedSold = sortBySales(soldProducts);

      // 3. Montar a lista final com 10 itens. Se houver menos de 10 vendidos, preencher com os melhores do catálogo restante (sem duplicar)
      let finalQueridinhas = [...sortedSold];
      if (finalQueridinhas.length < 10) {
        const remainingProducts = allUnified.filter(p => !finalQueridinhas.some(q => q.id === p.id));
        const sortedRemaining = sortProductsList(remainingProducts);
        const needed = 10 - finalQueridinhas.length;
        finalQueridinhas = [...finalQueridinhas, ...sortedRemaining.slice(0, needed)];
      } else {
        finalQueridinhas = finalQueridinhas.slice(0, 10);
      }

      // 4. Adicionar o destaque "MAIS VENDIDA do MOMENTO" apenas para a primeira posição (o mais vendido)
      const mappedQueridinhas = finalQueridinhas.map((p, idx) => ({
        ...p,
        is_bestseller: idx === 0
      }));

      setQueridinhas(mappedQueridinhas);

      const { data: teamsData } = await supabase.from('teams').select('*').order('name');
      if (teamsData) setDbTeams(teamsData);

      const mapCat = {
        'Seleções': [],
        'Brasileirão': [],
        'Internacionais': [],
        'Lançamentos': [],
        'Retrô': [],
        'Tênis': [],
        'NBA': [],
        'Streetwear': []
      };

      allUnified.forEach(p => {
        const cat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const pTeam = (p.team || '').toLowerCase();
        const pLeague = (p.league || '').toLowerCase();

        const isClub = (teamsData || []).some(t => t.name.toLowerCase() === pTeam);
        const isStreetwear = cat === 'streetwear' || cat === 'camisetas' || pName.includes('streetwear') || pName.includes('camiseta');
        const isTenis = (cat === 'tênis' || cat === 'tenis' || cat === 'shoes' || pName.includes('tênis') || pName.includes('tenis') || pName.includes('sneaker')) && !isStreetwear;
        const isNba = (cat === 'nba' || cat === 'basquete' || pLeague === 'nba' || pName.includes('nba') || pName.includes('basquete') || pName.includes('basketball') || pName.includes('jersey nba')) && !isStreetwear;
        const isBrasileirao = (cat === 'brasileirão' || cat === 'brasileirao' || cat.includes('brasileiro') || (p.league && p.league.toLowerCase() === 'brasileirão')) && !isTenis && !isNba && !isStreetwear;
        const isSelecao = (cat === 'seleções' || cat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || (p.league && p.league.toLowerCase() === 'seleções')) && !isTenis && !isNba && !isStreetwear;
        const isRetro = (cat === 'retrô' || cat.includes('retro') || (p.version || '').toLowerCase().includes('retrô') || pName.includes('retrô')) && !isTenis && !isNba && !isStreetwear;
        const isInternacional = (cat === 'internacionais' || cat.includes('europa') || cat.includes('europe') || (p.league && p.league !== 'Brasileirão' && p.league !== 'Seleções' && p.league !== 'nba' && p.league !== 'NBA')) && !isSelecao && !isBrasileirao && !isTenis && !isNba && !isStreetwear;

        // Permitir que um produto apareça em mais de uma sessão na Home
        let added = false;
        if (isTenis) { mapCat['Tênis'].push(p); added = true; }
        if (isNba) { mapCat['NBA'].push(p); added = true; }
        if (isStreetwear) { mapCat['Streetwear'].push(p); added = true; }
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

      // Ordenar cada categoria seguindo a nova prioridade:
      // 1. Mais Vendida | 2. Pronta Entrega | 3. Preço (Menor -> Maior)
      Object.keys(mapCat).forEach(key => {
        mapCat[key] = sortProductsList(mapCat[key]);
      });

      setStoreSections(mapCat);
      setAllProductsData(allUnified);

      // 3. Buscar depoimentos aprovados
      const { data: testimonialsData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved');
      if (testimonialsData) {
        const sorted = [...testimonialsData].sort((a, b) => {
          const orderA = a.sort_order ? Number(a.sort_order) : 99999;
          const orderB = b.sort_order ? Number(b.sort_order) : 99999;
          if (orderA !== orderB) return orderA - orderB;
          const dateA = a.date || '';
          const dateB = b.date || '';
          return dateB.localeCompare(dateA);
        });
        setTestimonials(sorted);
      }

      // 4. Buscar cidades reais para o card animado
      const { data: citiesData } = await supabase
        .from('orders')
        .select('shipping_address')
        .not('shipping_address', 'is', null);

      if (citiesData && citiesData.length > 0) {
        const counts = {};
        citiesData.forEach(o => {
          let city = o.shipping_address?.city;
          let province = o.shipping_address?.province || '';
          
          if (city && typeof city === 'string' && city.trim() !== '') {
            // Normalizar Winnipeg, Charlottetown e Montréal
            const cleanLower = city.trim().toLowerCase();
            if (city.toUpperCase() === 'N') {
              city = 'Winnipeg';
              province = 'MB';
            } else if (cleanLower.includes('charlottetown')) {
              city = 'Charlottetown';
              province = 'PE';
            } else if (cleanLower === 'mont-royal' || cleanLower === 'mont royal' || cleanLower === 'montreal' || cleanLower === 'montréal') {
              city = 'Montréal';
              province = 'QC';
            }

            // Pega apenas a primeira parte antes de qualquer vírgula, barra ou parênteses (sem cortar o hífen!)
            city = city.split(',')[0].split('/')[0].split('(')[0].trim();
            
            // Remove números e caracteres estranhos, MAS PRESERVA O HÍFEN
            city = city.replace(/[^a-zA-Záéíóúâêôãõç\s-]/gi, '').trim();
            
            // Se o usuário digitou uma frase enorme (limitando a 3 palavras para não cortar Mont-Royal)
            if (city.split(/[\s-]/).length > 3) {
              city = city.split(' ').slice(0, 3).join(' ');
            }
            
            if (city.length >= 3 && city.length <= 25) {
              // Capitaliza cada palavra separadamente e preserva hífens
              const normalizedCity = city.split(/([\s-])/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
              
              let finalName = normalizedCity;
              if (province && typeof province === 'string' && province.trim().length >= 2) {
                // Pega a sigla da província (2 letras)
                const prov = province.trim().substring(0, 2).toUpperCase();
                finalName = `${normalizedCity} | ${prov}`;
              }
              
              counts[finalName] = (counts[finalName] || 0) + 1;
            }
          }
        });
        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).map(e => e[0]);
        if (sorted.length > 0) {
          // Embaralhar as cidades de forma randômica
          const shuffled = [...sorted].sort(() => Math.random() - 0.5);
          setTopCities(shuffled);
        }
      }

      setLoading(false);
    }
    fetchHomeData();
  }, []);

  const activeTeams = dbTeams.filter(team =>
    team.league !== 'Seleções' && allProductsData.some(p => (p.team || '').toLowerCase() === team.name.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <SEO 
        description="Encontre mantos sagrados com qualidade premium, envio rápido para todo o país e atendimento personalizado para brasileiros e apaixonados por futebol no Canadá!"
      />
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
                <StatCounter target={400} variant="simple" suffix="+" delay={0} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('stats_clients')}</p>
            </div>

            {/* Avaliação Média */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(219, 254, 135, 0.1)', borderRadius: '50%', display: 'flex', gap: '2px' }}>
                  <Star size={20} color="var(--accent-color)" fill="var(--accent-color)" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
                <StatCounter target={9} prefix="4." variant="simple" suffix="/5" delay={400} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', lineHeight: 1.2 }}>
                AVALIAÇÃO DOS CLIENTES
              </p>
            </div>

            {/* WhatsApp */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(219, 254, 135, 0.1)', borderRadius: '50%' }}>
                  <Zap size={20} color="var(--accent-color)" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
                <StatCounter target={15} variant="simple" suffix="min" delay={800} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('stats_whatsapp')}</p>
            </div>

            {/* Cidades (Substitui Seguro) */}
            <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(219, 254, 135, 0.1)', borderRadius: '50%' }}>
                  <MapPin size={20} color="var(--accent-color)" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.25rem', minHeight: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TypewriterCities cities={topCities} />
              </h3>
              <p style={{ color: 'var(--text-main)', opacity: 0.8, fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', marginTop: '0.5rem', lineHeight: 1.2 }}>
                CIDADES QUE JÁ ENVIAMOS
              </p>
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
            const basePromoPrice = pricingConfig?.promoBasePrice || 47.90;
            const discountPercent2 = (pricingConfig?.discounts || []).find(d => d.qty === 2)?.percent || (pricingConfig?.discounts || []).find(d => d.qty === 2)?.amount || 4;
            const discountPercent3 = (pricingConfig?.discounts || []).find(d => d.qty === 3)?.percent || (pricingConfig?.discounts || []).find(d => d.qty === 3)?.amount || 7;

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
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.2rem' }}>{t('promo_banner_from')} <del>{formatPrice(normalPrice2)}</del> {t('promo_banner_for')}</p>
                  <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1 }}>{formatPrice(finalTotal2)}</p>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    <span style={{ display: 'block', marginBottom: '0.2rem' }}>{t('home_comes_out_to')} <strong>{formatPrice(finalPricePerUnit2)}</strong> {t('promo_banner_each')}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>💰 {t('promo_banner_savings')} {formatPrice(savings2)}</span>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <a href="#catalogo" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>{t('promo_banner_apply')}</a>
                  </div>
                </div>

                {/* Combo 3 Camisas */}
                <div className="glass-panel" style={{ flex: 1, minWidth: '250px', padding: '2rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--accent-color)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div className="badge" style={{ background: 'var(--accent-color)', color: '#000', left: '50%', transform: 'translate(-50%, -150%)', width: 'max-content' }}>{t('promo_banner_best_offer')}</div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('promo_banner_combo3')}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.2rem' }}>{t('promo_banner_from')} <del>{formatPrice(normalPrice3)}</del> {t('promo_banner_for')}</p>
                  <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '1rem', lineHeight: 1 }}>{formatPrice(finalTotal3)}</p>
                  <div style={{ background: 'rgba(219, 254, 135, 0.1)', border: '1px solid rgba(219, 254, 135, 0.3)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    <span style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{t('home_only')} <strong>{formatPrice(finalPricePerUnit3)}</strong> {t('promo_banner_each')}</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>🔥 {t('home_savings')} {formatPrice(savings3)}!</span>
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
              <a href={`/colecao/${catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} style={{ color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{t('home_view_all')} <ChevronRight size={16} /></a>
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
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ {formatPrice(pricingConfig?.nameNumber || 11.90)}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', minWidth: '250px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t('customization_item2')}</p>
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ {formatPrice(pricingConfig?.patch || 4.90)}</p>
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
              <TestimonialCard key={testimonial.id} testimonial={testimonial} t={t} />
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
          {Array.isArray(t('faqs')) && t('faqs').map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
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

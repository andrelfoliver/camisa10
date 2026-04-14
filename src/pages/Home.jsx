import React, { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import TeamsBar from '../components/TeamsBar';
import ProductCard from '../components/ProductCard';
import { supabase } from '../services/supabase';
import { ShieldCheck, Truck, Star, Package, Lock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BR_2026_TEAMS } from '../data/teams';

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

const ProductShowcaseCard = ({ product }) => {
  const navigate = useNavigate();

  if(!product) return null;

  return (
    <div style={{ margin: '0 auto', width: '100%', maxWidth: '420px' }}>
      <div 
        onClick={() => navigate(`/produto/${product.id}`)}
        style={{ 
          background: 'var(--surface-color)', 
          border: '1px solid var(--border-color)',
          padding: '2rem', 
          borderRadius: 'var(--radius-lg)', 
          cursor: 'pointer',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ position: 'absolute', top: '-1rem', left: '-1rem', background: '#EF4444', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', zIndex: 10, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}>
          🔥 Mais vendido
        </div>
        <div className="coin-stage">
          <div className="coin-inner">
            <div className="coin-front">
              <img src={product.gallery && product.gallery[0] ? product.gallery[0] : product.image} alt={product.name} style={{ width: '100%', height: '300px', objectFit: 'contain', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.5))' }} />
            </div>
            <div className="coin-back">
              <img src={product.gallery && product.gallery[1] ? product.gallery[1] : product.image} alt={`${product.name} costas`} style={{ width: '100%', height: '300px', objectFit: 'contain', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.5))' }} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', lineHeight: 1.2, marginBottom: '0.8rem' }}>{product.name}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '1.5rem' }}>
            <Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" />
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Mais de 100 vendidos</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem' }}>120.00 CAD</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-color)', lineHeight: 1 }}>69.90 CAD</span>
          </div>
          <button className="btn-primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.2rem' }}>
            COMPRAR AGORA
          </button>
        </div>
      </div>
    </div>
  );
};


const Home = () => {
  // Estado inicial limpo - O site agora é 100% dinâmico via Supabase
  const [bestSeller, setBestSeller] = useState(null);
  const [queridinhas, setQueridinhas] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTeamFilter, setActiveTeamFilter] = useState(null);
  const [allProductsData, setAllProductsData] = useState([]);
  
  const [storeSections, setStoreSections] = useState({
    'Seleções': [],
    'Brasileirão': [],
    'Internacionais': [],
    'Lançamentos': [],
    'Retrô': []
  });
  
  useEffect(() => {
    async function fetchHomeData() {
      const savedQueridinhas = localStorage.getItem('queridinhas_ids');
      const savedBestSeller = localStorage.getItem('best_seller_id');
      const savedCatalog = localStorage.getItem('catalog_ids');
      
      let qIds = savedQueridinhas ? JSON.parse(savedQueridinhas) : [];
      let bId = savedBestSeller ? JSON.parse(savedBestSeller) : null;
      let cIds = savedCatalog ? JSON.parse(savedCatalog) : [];

      if(bId || qIds.length > 0) {
        let supabaseData = [];
        const fetchIds = [...new Set([...qIds, bId ? [bId] : []].flat())];
        
        if (fetchIds.length > 0) {
          const { data } = await supabase.from('products').select('*').in('id', fetchIds);
          if (data) supabaseData = data;
        }

        if (bId) {
          setBestSeller(supabaseData.find(d => String(d.id) === String(bId)));
        }

        if (qIds.length > 0) {
          const sortedQ = qIds.map(id => supabaseData.find(d => String(d.id) === String(id))).filter(Boolean);
          setQueridinhas(sortedQ);
        }
      }

      const { data: dbData } = await supabase.from('products').select('*').order('id', { ascending: false });
      const allUnified = dbData || [];
      
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
        
        const isClub = BR_2026_TEAMS.some(t => t.name.toLowerCase() === pTeam);
        const isSelecao = cat === 'seleções' || cat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || (pName.includes('brasil') && !isClub);

        if (isClub) mapCat['Brasileirão'].push(p);
        else if (isSelecao) mapCat['Seleções'].push(p);
        else if (cat === 'internacionais' || cat.includes('europa') || cat.includes('europe')) mapCat['Internacionais'].push(p);
        else if (cat === 'lançamentos' || cat.includes('lançament')) mapCat['Lançamentos'].push(p);
        else if (cat === 'retrô' || cat.includes('retro')) mapCat['Retrô'].push(p);
        else mapCat['Lançamentos'].push(p);
      });

        setStoreSections(mapCat);
        setAllProductsData(allUnified);

      const { data: testData } = await supabase.from('testimonials').select('*').eq('status', 'approved').order('date', { ascending: false });
      if(testData) setTestimonials(testData);

      setLoading(false);
    }
    fetchHomeData();
  }, []);

  const activeTeams = BR_2026_TEAMS.filter(team => 
    allProductsData.some(p => (p.team || '').toLowerCase() === team.name.toLowerCase())
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
                  Ver Todos os Clubes
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
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.2rem' }}>Já somos <strong style={{color: 'var(--accent-color)'}}>+100 clientes</strong> vestindo a paixão no Canadá! 🍁</p>
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

      {/* 3. PRODUTO MAIS VENDIDO (EFEITO 3D HOVER) */}
      <section id="destaque" className="section-padding">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '3rem' }}>A Escolha dos Campeões 🏆</h2>
          {!loading && <ProductShowcaseCard product={bestSeller} />}
          
          <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', padding: '1.5rem', borderRadius: 'var(--radius-md)', maxWidth: '600px', width: '100%' }}>
            <AlertTriangle color="#EF4444" size={30} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '1.2rem' }}>🔥 Alta demanda no Canadá</span>
              <span style={{ color: '#EF4444' }}>⚠️ Últimas unidades do nosso estoque com preço promocional!</span>
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
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#EF4444', fontWeight: 800 }}>🔥 OFERTA ESPECIAL</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Combo 2 Camisas */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '250px', padding: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2 Camisas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.2rem' }}>De <del>$149.80</del> por apenas</p>
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1 }}>$119.80</p>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                <span style={{ display: 'block', marginBottom: '0.2rem' }}>Sai por <strong>$59.90</strong> cada</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>💰 Economia de $30.00</span>
              </div>
              
              <div style={{ marginTop: 'auto' }}>
                <a href="#destaque" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Aproveitar oferta</a>
              </div>
            </div>

            {/* Combo 3 Camisas */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '250px', padding: '2rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--accent-color)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div className="badge" style={{ background: 'var(--accent-color)', color: '#000', left: '50%', transform: 'translate(-50%, -150%)', width: 'max-content' }}>Maior Desconto</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3 Camisas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.2rem' }}>De <del>$224.70</del> por apenas</p>
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '1rem', lineHeight: 1 }}>$164.70</p>
              
              <div style={{ background: 'rgba(219, 254, 135, 0.1)', border: '1px solid rgba(219, 254, 135, 0.3)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                <span style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.2rem' }}>Sai por só <strong>$54.90</strong> cada</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>🔥 Você economiza $60.00!</span>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <a href="#destaque" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Aproveitar oferta</a>
              </div>
            </div>
          </div>
          <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>* Adicione a quantidade na sacola e o desconto será aplicado magicamente!</p>
        </div>
      </section>

      {/* 6. CARROSSEIS CATEGORIAS OFICIAIS */}
      <section id="catalogo" className="section-padding container">
        
        {Object.entries(storeSections).map(([catName, products]) => (
          <div key={catName} style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', color: '#fff' }}>{catName}</h2>
                <p style={{ color: 'var(--text-muted)' }}>As melhores opções em {catName.toLowerCase()}</p>
              </div>
              <a href={`/colecao/${catName.toLowerCase().replace('ç','c').replace('õ','o').replace('ã','a')}`} style={{ color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Ver todas <ChevronRight size={16} /></a>
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
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ 9.90 CAD</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', minWidth: '250px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Patch de Campeonatos</p>
                <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.5rem' }}>+ 4.90 CAD</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CONEXÃO EMOCIONAL */}
      <section style={{ padding: '5rem 0', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 900, color: 'var(--accent-color)' }}>
            Porque ser brasileiro não tem distância 🇧🇷
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: 1.6 }}>
            A saudade do Brasil e a paixão pelo futebol vivem na mesma gaveta. Entregamos a qualidade de jogador profissional diretamente na sua porta no Canadá.
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
            [1,2,3].map(i => (
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
        <h2 style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>Garanta sua camisa antes que acabe!</h2>
        <a href="#destaque" className="btn-primary btn-massive" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem', borderRadius: '3rem' }}>
          Comprar Agora
        </a>
      </section>

    </div>
  );
};

export default Home;

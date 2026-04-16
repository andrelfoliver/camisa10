import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import ProductCard from '../components/ProductCard';
import { mockEcommerceProducts, getAllProducts } from '../data/mockProducts';
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react';

const CategoryPage = () => {
  const { category_id } = useParams();
  const [products, setProducts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('popular');
  const [versionFilters, setVersionFilters] = useState([]);
  
  // Quick map to beautiful names
  const categoryNames = {
    'brasileirao': 'Brasileirão',
    'selecoes': 'Seleções',
    'internacionais': 'Internacionais',
    'retro': 'Retrô',
    'lancamentos': 'Lançamentos'
  };

  const title = categoryNames[category_id] || decodeURIComponent(category_id).toUpperCase();

  useEffect(() => {
    async function fetchCategoryProducts() {
      setLoading(true);
      // Puxar do Supabase
      const { data: supabaseData } = await supabase.from('products').select('*').order('id', { ascending: false });
      const { data: teamsData } = await supabase.from('teams').select('*');
      
      const allProducts = getAllProducts(supabaseData || []);
      if(teamsData) setTeams(teamsData);
      
      // Filtrar baseado no category_id usando a mesma lógica refinada da Home
      let filtered = allProducts.filter(p => {
        const cat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const pLeague = (p.league || '').toLowerCase();

        const isBrasileirao = cat === 'brasileirão' || cat === 'brasileirao' || cat.includes('brasileiro') || pLeague === 'brasileirão';
        const isSelecao = cat === 'seleções' || cat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || pLeague === 'seleções';
        const isRetro = cat === 'retrô' || cat.includes('retro') || (p.version || '').toLowerCase().includes('retrô') || pName.includes('retrô');
        const isInternacional = cat === 'internacionais' || cat.includes('europa') || cat.includes('europe') || (pLeague !== '' && pLeague !== 'brasileirão' && pLeague !== 'seleções');

        if (category_id === 'brasileirao') return isBrasileirao;
        if (category_id === 'selecoes') return isSelecao;
        if (category_id === 'retro') return isRetro;
        if (category_id === 'internacionais') return isInternacional && !isSelecao && !isBrasileirao;
        if (category_id === 'lancamentos') return cat === 'lançamentos' || cat.includes('lançament');
        
        // Fallback para slugs dinâmicos de ligas específicas
        return pLeague === category_id.toLowerCase() || cat === category_id.toLowerCase();
      });

      setProducts(filtered);
      setLoading(false);
    }
    fetchCategoryProducts();
    window.scrollTo(0,0);
  }, [category_id]);

  const toggleVersion = (ver) => {
    setVersionFilters(prev =>
      prev.includes(ver) ? prev.filter(v => v !== ver) : [...prev, ver]
    );
  };

  // Apply version filter + sort
  const displayedProducts = [...products]
    .filter(p => {
      if (versionFilters.length === 0) return true;
      const ver = (p.version || '').toLowerCase();
      return versionFilters.some(f => ver.includes(f.toLowerCase()));
    })
    .sort((a, b) => {
      if (sortOrder === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortOrder === 'price_desc') return (b.price || 0) - (a.price || 0);
      return 0; // popular = original order
    });

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      
      {/* Mega Banner da Categoria */}
      <div style={{ background: 'linear-gradient(90deg, #1A1A24 0%, #0D0D14 100%)', padding: '3rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--accent-color)' }}>{title}</span>
          </div>
          <h1 style={{ fontSize: '3rem', color: '#fff', fontFamily: 'var(--font-display)' }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{products.length} itens encontrados</p>
        </div>
      </div>

      <div className="container" style={{ display: 'flex', gap: '2rem', marginTop: '2rem', paddingBottom: '5rem' }}>
        
        {/* Sidebar Desktop */}
        <aside style={{ width: '250px', display: 'none' }} className="desktop-filters">
          <div style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Filtros</h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Versão da Camisa</h4>
              {['Torcedor', 'Jogador', 'Retrô'].map(ver => (
                <label key={ver} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={versionFilters.includes(ver)}
                    onChange={() => toggleVersion(ver)}
                    style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px' }}
                  />
                  <span style={{ color: versionFilters.includes(ver) ? 'var(--accent-color)' : 'var(--text-main)', fontWeight: versionFilters.includes(ver) ? 600 : 400 }}>{ver}</span>
                </label>
              ))}
              {versionFilters.length > 0 && (
                <button onClick={() => setVersionFilters([])} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>Limpar filtros</button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Toggle */}
        <div className="mobile-filter-toggle" style={{ width: '100%', marginBottom: '1rem', display: 'none' }}>
           <button onClick={() => setMobileFilterOpen(true)} className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
             <Filter size={20} /> Filtrar Produtos
           </button>
        </div>

        {/* Main Content */}
        <main style={{ flex: 1 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Exibindo {displayedProducts.length} de {products.length} produtos{versionFilters.length > 0 ? ` (filtrado por: ${versionFilters.join(', ')})` : ''}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ordenar por:</span>
                 <select
                   value={sortOrder}
                   onChange={e => setSortOrder(e.target.value)}
                   style={{ background: 'var(--surface-color)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                 >
                    <option value="popular">Mais Populares</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                 </select>
              </div>
           </div>

           {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Buscando o manto sagrado...</div>
           ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Vestiário vazio!</h3>
                <p style={{ color: 'var(--text-muted)' }}>Não encontramos camisas para essa categoria no momento.</p>
              </div>
           ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
           )}
        </main>
      </div>

      <style>{`
        @media (min-width: 992px) {
          .desktop-filters { display: block !important; }
          .mobile-filter-toggle { display: none !important; }
        }
        @media (max-width: 991px) {
          .mobile-filter-toggle { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default CategoryPage;

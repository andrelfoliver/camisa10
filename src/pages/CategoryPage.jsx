import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import ProductCard from '../components/ProductCard';
import { mockEcommerceProducts, getAllProducts } from '../data/mockProducts';
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CategoryPage = () => {
  const { category_id } = useParams();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('popular');
  const [versionFilters, setVersionFilters] = useState([]);
  
  const categoryNames = {
    pt: {
      'brasileirao': 'Brasileirão',
      'selecoes': 'Seleções',
      'internacionais': 'Internacionais',
      'retro': 'Retrô',
      'lancamentos': 'Lançamentos'
    },
    en: {
      'brasileirao': 'Brazilian League',
      'selecoes': 'National Teams',
      'internacionais': 'International',
      'retro': 'Retro',
      'lancamentos': 'New Arrivals'
    }
  };

  const title = (categoryNames[language] || categoryNames.pt)[category_id] || decodeURIComponent(category_id).toUpperCase();

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
        if (category_id === 'lancamentos') return p.is_new || cat === 'lançamentos' || cat.includes('lançament');
        
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
            <Link to="/" style={{ color: 'var(--text-muted)' }}>{t('category_home')}</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--accent-color)' }}>{title}</span>
          </div>
          <h1 style={{ fontSize: '3rem', color: '#fff', fontFamily: 'var(--font-display)' }}>{title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{products.length} {t('category_items_found')}</p>
        </div>
      </div>

      <div className="container category-page-wrapper">
        
        {/* Sidebar Desktop */}
        <aside style={{ width: '250px', display: 'none' }} className="desktop-filters">
          <div style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{t('category_filters')}</h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('category_jersey_version')}</h4>
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
                <button onClick={() => setVersionFilters([])} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>{t('category_clear_filters')}</button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Toggle */}
        <div className="mobile-filter-toggle" style={{ width: '100%', marginBottom: '1rem', display: 'none' }}>
           <button onClick={() => setMobileFilterOpen(true)} className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
             <Filter size={20} /> {t('category_filter_btn')}
           </button>
        </div>

        {/* Main Content */}
        <main style={{ flex: 1 }}>
           <div className="category-controls-bar">
               <span className="results-count">{t('category_showing')} {displayedProducts.length} {t('category_of')} {products.length} {t('category_products')}{versionFilters.length > 0 ? ` (${t('category_filtered_by')} ${versionFilters.join(', ')})` : ''}</span>
               <div className="sort-controls">
                  <span className="sort-label">{t('category_sort_by')}</span>
                  <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="sort-select"
                  >
                     <option value="popular">{t('category_sort_popular')}</option>
                     <option value="price_asc">{t('category_sort_price_asc')}</option>
                     <option value="price_desc">{t('category_sort_price_desc')}</option>
                  </select>
               </div>
            </div>

           {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>{t('category_loading')}</div>
           ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ marginBottom: '1rem' }}>{t('category_empty_title')}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{t('category_empty_text')}</p>
              </div>
           ) : (
              <div className="grid-products reveal delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-min-width, 240px), 1fr))', gap: '1.5rem', justifyContent: 'center' }}>
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
           )}
        </main>
      </div>

      <style>{`
        :root {
          --card-min-width: 240px;
        }
        .category-page-wrapper {
          display: flex;
          gap: 2rem;
          margin-top: 2rem;
          padding-bottom: 5rem;
        }
        .category-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        .results-count { color: var(--text-muted); }
        .sort-controls { display: flex; alignItems: center; gap: 0.5rem; }
        .sort-label { color: var(--text-muted); font-size: 0.9rem; }
        .sort-select { background: var(--surface-color); color: #fff; border: 1px solid var(--border-color); padding: 0.5rem; borderRadius: 4px; cursor: pointer; }

        @media (min-width: 992px) {
          .desktop-filters { display: block !important; }
          .mobile-filter-toggle { display: none !important; }
        }
        @media (max-width: 991px) {
          .mobile-filter-toggle { display: block !important; width: 100%; margin-bottom: 1.5rem !important; }
          .category-page-wrapper {
            flex-direction: column !important;
            gap: 1rem !important;
          }
          .category-controls-bar {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          .sort-controls {
            width: 100%;
            justify-content: space-between;
          }
          .sort-select {
            flex: 1;
            max-width: 200px;
          }
        }
        @media (max-width: 500px) {
          :root {
            --card-min-width: 160px;
          }
          .grid-products {
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import ProductCard from '../components/ProductCard';
import { mockEcommerceProducts, getAllProducts } from '../data/mockProducts';
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react';

const CategoryPage = () => {
  const { category_id } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Quick map to beautiful names
  const categoryNames = {
    'brasileirao': 'Brasileirão',
    'selecoes': 'Seleções',
    'premier-league': 'Premier League',
    'la-liga': 'La Liga',
    'europeus': 'Clubes Europeus',
    'lancamentos': 'Lançamentos'
  };

  const title = categoryNames[category_id] || decodeURIComponent(category_id).toUpperCase();

  useEffect(() => {
    async function fetchCategoryProducts() {
      setLoading(true);
      // Puxar do Supabase
      const { data: supabaseData } = await supabase.from('products').select('*').order('id', { ascending: false });
      
      const allProducts = getAllProducts(supabaseData || []);
      
      // Filtrar baseado no category_id
      let filtered = allProducts;
      if (category_id === 'selecoes') {
        filtered = allProducts.filter(p => String(p.category).includes('Seleç') || String(p.league).includes('Seleç'));
      } else if (category_id === 'europeus') {
        filtered = allProducts.filter(p => String(p.category).includes('Europe') || ['Premier League', 'La Liga', 'Serie A', 'Ligue 1', 'Bundesliga'].includes(p.league));
      } else if (category_id === 'brasileirao') {
        filtered = allProducts.filter(p => String(p.league).includes('Brasil') || String(p.category).includes('Brasil'));
      } else if (categoryNames[category_id]) {
         filtered = allProducts.filter(p => String(p.league).toLowerCase() === categoryNames[category_id].toLowerCase());
      }

      setProducts(filtered);
      setLoading(false);
    }
    fetchCategoryProducts();
    window.scrollTo(0,0);
  }, [category_id]);

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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" /> Torcedor
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" /> Jogador
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" /> Retrô
              </label>
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
              <span style={{ color: 'var(--text-muted)' }}>Exibindo {products.length} produtos</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ordenar por:</span>
                 <select style={{ background: 'var(--surface-color)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px' }}>
                    <option>Mais Populares</option>
                    <option>Menor Preço</option>
                    <option>Maior Preço</option>
                    <option>Lançamentos</option>
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
                {products.map(product => (
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

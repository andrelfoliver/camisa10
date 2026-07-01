import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabaseRebrand as supabase } from '../../services/supabase';
import ProductCard from '../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { Search, ChevronRight, X, AlertCircle } from 'lucide-react';
import { formatProductName, getProductRating, getProductReviewsCount } from '../utils/format';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false });

        if (data) {
          const formatted = data.map((p, idx) => {
            const isBasketball = p.category === 'NBA' || p.category === 'Basketball';
            return {
              id: p.id,
              name: p.name,
              price: p.price || 89.90,
              oldPrice: p.is_sale ? (p.price || 89.90) + 30.00 : null,
              category: isBasketball ? 'Basketball' : 'Soccer',
              dbCategory: p.category,
              version: p.version,
              is_new: p.is_new,
              is_bestseller: p.is_bestseller,
              is_sale: p.is_sale,
              league: p.league || p.category || 'Other',
              team: p.team || '',
              desc: p.description || '',
              image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
              rating: p.rating || getProductRating(p.id),
              reviews: p.reviews_count || getProductReviewsCount(p.id),
              colors: ['#000000', '#ffffff', '#e31837'],
              badge: p.is_bestseller ? 'Best Seller' : (p.is_sale ? 'Sale' : (p.is_new ? 'New Arrival' : (idx % 4 === 0 ? 'Almost Gone' : '')))
            };
          });

          const lowercaseQuery = query.toLowerCase();
          const filtered = formatted.filter(p => {
            const name = (p.name || '').toLowerCase();
            const team = (p.team || '').toLowerCase();
            const league = (p.league || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            const desc = (p.desc || '').toLowerCase();

            return name.includes(lowercaseQuery) || 
                   team.includes(lowercaseQuery) || 
                   league.includes(lowercaseQuery) ||
                   category.includes(lowercaseQuery) ||
                   desc.includes(lowercaseQuery);
          });

          setProducts(filtered);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query]);

  return (
    <div style={{ background: '#ffffff', minHeight: '80vh', padding: '3rem 2rem' }} className="rebrand-scope">
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Breadcrumb e Voltar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link to="/rebrand" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rebrand-text-muted)', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Back to Home
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--rebrand-text-muted)', fontWeight: 600 }}>
            iFooty / Search Results
          </span>
        </div>

        {/* Header de Busca */}
        <div style={{ 
          borderBottom: '1px solid var(--rebrand-border)', 
          paddingBottom: '2rem', 
          marginBottom: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: '1.1', margin: '0 0 0.5rem 0', color: '#121416' }}>
              Search Results
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--rebrand-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
              🔎 Showing matches for "{query}"
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--rebrand-text-main)', display: 'block', fontFamily: 'var(--rebrand-font-display)' }}>
              {products.length} ITEMS
            </span>
          </div>
        </div>

        {/* Resultados */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '6rem 0' }}>
              <p style={{ color: 'var(--rebrand-text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Searching official catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '1.5px dashed var(--rebrand-border)', borderRadius: '8px' }}>
              <AlertCircle size={48} color="var(--rebrand-text-muted)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--rebrand-text-main)' }}>No jerseys found</h2>
              <p style={{ color: 'var(--rebrand-text-muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                We couldn't find any results for "{query}". Try checking the spelling or searching for more general terms like "Real Madrid", "Brazil", or "Messi".
              </p>
              <Link to="/rebrand" className="rebrand-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>Back to Shop</Link>
            </div>
          ) : (
            <div className="rebrand-products-grid">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAdd={(p) => {
                    addToCart({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      image: p.image
                    }, 'M');
                  }}
                  onQuickView={(pId) => navigate(`/rebrand/produto/${pId}`)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchPage;

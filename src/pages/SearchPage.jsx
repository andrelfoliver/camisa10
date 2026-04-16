import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import ProductCard from '../components/ProductCard';
import { getAllProducts } from '../data/mockProducts';
import { Search, ChevronRight, X, AlertCircle } from 'lucide-react';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
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
                // Fetch all products from Supabase
                const { data: supabaseData, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('id', { ascending: false });

                if (error) throw error;

                const allProducts = getAllProducts(supabaseData || []);
                
                // Perform fuzzy-ish search
                const lowercaseQuery = query.toLowerCase();
                const filtered = allProducts.filter(p => {
                    const name = (p.name || '').toLowerCase();
                    const team = (p.team || '').toLowerCase();
                    const league = (p.league || '').toLowerCase();
                    const category = (p.category || '').toLowerCase();

                    return name.includes(lowercaseQuery) || 
                           team.includes(lowercaseQuery) || 
                           league.includes(lowercaseQuery) ||
                           category.includes(lowercaseQuery);
                });

                setProducts(filtered);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }

        performSearch();
        window.scrollTo(0, 0);
    }, [query]);

    return (
        <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-color)' }}>
            
            {/* Search Header */}
            <div style={{ background: 'linear-gradient(90deg, #1A1A24 0%, #0D0D14 100%)', padding: '3rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        <Link to="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
                        <ChevronRight size={14} />
                        <span style={{ color: 'var(--accent-color)' }}>Busca</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Search size={32} color="var(--accent-color)" /> Resultados para: "{query}"
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {loading ? 'Buscando...' : `${products.length} itens encontrados`}
                    </p>
                </div>
            </div>

            <div className="container" style={{ marginTop: '3rem', paddingBottom: '5rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <div className="loading-spinner"></div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Vasculhando o vestiário...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Nenhum manto encontrado</h2>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                            Infelizmente não encontramos resultados para "{query}". Tente buscar por termos mais genéricos como "Brasil", "Real" ou "Retrô".
                        </p>
                        <Link to="/" className="btn-primary">Ver todos os produtos</Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
            
            <style>{`
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(204, 255, 0, 0.1);
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SearchPage;

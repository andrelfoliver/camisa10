import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { Star, ShoppingBag, Eye, SlidersHorizontal, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatProductName } from '../utils/format';

// Mocks por esporte com variações de cores e preços promocionais
const SPORT_MOCKS = {
  basketball: [
    { id: 'bask-1', name: 'Toronto Raptors Statement Edition Jersey', price: 139.90, oldPrice: 179.90, category: 'Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600', rating: 4.9, reviews: 142, colors: ['#CE1141', '#000000', '#FFFFFF'], badge: 'Almost Gone' },
    { id: 'bask-2', name: 'Los Angeles Lakers LeBron James Icon Jersey', price: 139.90, oldPrice: 179.90, category: 'Basketball', image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=600', rating: 4.8, reviews: 204, colors: ['#552583', '#FDB927', '#FFFFFF'], badge: 'Popular' },
    { id: 'bask-3', name: 'Golden State Warriors Stephen Curry Association Jersey', price: 139.90, oldPrice: 169.90, category: 'Basketball', image: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=600', rating: 4.9, reviews: 188, colors: ['#1D428A', '#FFC72C', '#FFFFFF'], badge: '' }
  ],
  football: [
    { id: 'foot-1', name: 'Kansas City Chiefs Patrick Mahomes Game Jersey', price: 139.90, oldPrice: 179.90, category: 'Football', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600', rating: 5.0, reviews: 310, colors: ['#E31837', '#FFB81C', '#FFFFFF'], badge: 'Free Shipping' },
    { id: 'foot-2', name: 'Dallas Cowboys Dak Prescott Navy Jersey', price: 139.90, oldPrice: 169.90, category: 'Football', image: 'https://images.unsplash.com/photo-1614036417651-efe5912149d8?w=600', rating: 4.6, reviews: 92, colors: ['#003594', '#869397', '#FFFFFF'], badge: 'Almost Gone' }
  ],
  baseball: [
    { id: 'base-1', name: 'Toronto Blue Jays Replica Cool Base Jersey', price: 129.90, oldPrice: 159.90, category: 'Baseball', image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=600', rating: 4.7, reviews: 76, colors: ['#132B5C', '#1D2D5C', '#FFFFFF'], badge: 'Best Seller' },
    { id: 'base-2', name: 'Los Angeles Dodgers Shohei Ohtani Home Jersey', price: 149.90, oldPrice: 189.90, category: 'Baseball', image: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600', rating: 4.9, reviews: 154, colors: ['#005A9C', '#FFFFFF'], badge: 'Top Seller' }
  ],
  hockey: [
    { id: 'hock-1', name: 'Toronto Maple Leafs Home Primegreen Jersey', price: 149.90, oldPrice: 189.90, category: 'Hockey', image: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=600', rating: 4.8, reviews: 98, colors: ['#00205B', '#FFFFFF'], badge: 'Almost Gone' },
    { id: 'hock-2', name: 'Edmonton Oilers Connor McDavid Home Jersey', price: 149.90, oldPrice: 189.90, category: 'Hockey', image: 'https://images.unsplash.com/photo-1580748141549-71748d60bdc9?w=600', rating: 4.9, reviews: 112, colors: ['#041E42', '#FF4C00', '#FFFFFF'], badge: 'Trending' }
  ]
};

const PLAYERS_BY_SPORT = {
  soccer: ['Lionel Messi', 'Cristiano Ronaldo', 'Neymar Jr', 'Vinicius Jr', 'Kylian Mbappé', 'Erling Haaland', 'Custom Name/Number'],
  basketball: ['LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo', 'Luka Dončić', 'Kevin Durant', 'Custom Name/Number'],
  football: ['Patrick Mahomes', 'Travis Kelce', 'Lamar Jackson', 'Josh Allen', 'Custom Name/Number'],
  baseball: ['Shohei Ohtani', 'Aaron Judge', 'Ronald Acuña Jr.', 'Mookie Betts', 'Custom Name/Number'],
  hockey: ['Connor McDavid', 'Sidney Crosby', 'Auston Matthews', 'Nathan MacKinnon', 'Custom Name/Number']
};


// Sub-componente de Card de Produto com seletor de cor fictício
const ProductCard = ({ product, onAdd, onQuickView }) => {
  const [activeColor, setActiveColor] = useState(product.colors?.[0] || '');

  return (
    <div className="rebrand-product-card">
      <div className="rebrand-product-img-wrapper">
        {product.badge && (
          <span className={product.badge.toLowerCase().includes('almost') ? "rebrand-product-badge-red" : "rebrand-product-badge"}>
            {product.badge}
          </span>
        )}
        <Link to={`/rebrand/produto/${product.id}`}>
          <img src={product.image} alt={product.name} className="rebrand-product-img" />
        </Link>
        
        {/* Hover Actions */}
        <div className="rebrand-product-actions">
          <button onClick={() => onAdd(product)} className="rebrand-product-btn-quick">
            <ShoppingBag size={14} style={{ marginRight: '0.4rem' }} /> Add to Cart
          </button>
          <button 
            onClick={() => onQuickView(product.id)}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              padding: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--rebrand-text-main)'
            }}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      <div className="rebrand-product-info">
        <span className="rebrand-product-category">{product.category}</span>

        <Link to={`/rebrand/produto/${product.id}`} style={{ textDecoration: 'none' }}>
          <h4 className="rebrand-product-title">{formatProductName(product.name)}</h4>
        </Link>

        <div className="rebrand-product-price-row">
          <div className="rebrand-price-container">
            <span className="rebrand-product-price ${product.oldPrice ? 'rebrand-price-sale' : ''}">
              ${product.price.toFixed(2)} CAD
            </span>
            {product.oldPrice && (
              <span className="rebrand-price-old">${product.oldPrice.toFixed(2)}</span>
            )}
          </div>
          <span className="rebrand-product-rating">
            <Star size={13} fill="#FFB100" color="#FFB100" /> {product.rating}
          </span>
        </div>
        
        <span style={{ fontSize: '0.65rem', color: '#2b8a3e', fontWeight: 800, marginTop: '0.4rem', display: 'block', textTransform: 'uppercase' }}>
          ✓ Free Shipping Eligible
        </span>
      </div>
    </div>
  );
};

const CategoryPage = () => {
  const { category_id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sections, setSections] = useState({
    department: false,
    league: true,
    teams: true,
    gender: false,
    players: false,
    size: false,
    price: false
  });

  const toggleSection = (sec) => {
    setSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Estados de Filtro Ativos
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [selectedPlayer, setSelectedPlayer] = useState('All');

  // Reset filters when category changes
  useEffect(() => {
    setSelectedSize('All');
    setSelectedPrice('All');
    setSelectedGender('All');
    setSelectedLeague('All');
    setSelectedTeam('All');
    setSelectedPlayer('All');
  }, [category_id]);

  useEffect(() => {
    async function loadCategoryProducts() {
      setLoading(true);
      const categoryLower = category_id.toLowerCase();
      
      if (['soccer', 'sale', 'new-arrivals', 'best-sellers', 'basketball', 'nba'].includes(categoryLower)) {
        try {
          // Fetch sales ranking from store_settings
          let salesRanking = {};
          try {
            const { data: settingsData } = await supabase
              .from('store_settings')
              .select('value')
              .eq('key', 'product_sales_ranking')
              .single();
            if (settingsData && settingsData.value) {
              salesRanking = typeof settingsData.value === 'string' 
                ? JSON.parse(settingsData.value) 
                : settingsData.value;
            }
          } catch (e) {
            console.error("Failed to load sales ranking settings:", e);
          }

          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: false });
            
          if (data) {
            let formatted = data.map((p, idx) => {
              const salesCount = salesRanking[p.id] || 0;
              const isBestseller = p.is_bestseller || salesCount > 0;
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
                is_bestseller: isBestseller,
                is_sale: p.is_sale,
                salesCount: salesCount,
                league: p.league || p.category || 'Other',
                team: p.team || '',
                desc: p.description || '',
                image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
                rating: p.rating || 4.8,
                reviews: p.reviews_count || 32,
                colors: ['#000000', '#ffffff', '#e31837'],
                badge: isBestseller ? 'Best Seller' : (p.is_sale ? 'Sale' : (p.is_new ? 'New Arrival' : (idx % 4 === 0 ? 'Almost Gone' : '')))
              };
            });

            if (categoryLower === 'best-sellers') {
              // Filter and sort dynamically by sales count or manually tagged bestsellers, limiting to top 10
              formatted = formatted
                .filter(p => p.is_bestseller)
                .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
                .slice(0, 10);
            } else if (categoryLower === 'sale') {
              formatted = formatted.filter(p => p.is_sale);
            } else if (categoryLower === 'new-arrivals') {
              formatted = formatted.filter(p => p.is_new);
            } else if (categoryLower === 'basketball' || categoryLower === 'nba') {
              formatted = formatted.filter(p => p.dbCategory === 'NBA' || p.dbCategory === 'Basketball');
            } else if (categoryLower === 'soccer') {
              const nonSoccerCats = ['NBA', 'Basketball', 'NFL', 'Football', 'MLB', 'Baseball', 'NHL', 'Hockey', 'Tênis', 'Streetwear'];
              formatted = formatted.filter(p => !nonSoccerCats.includes(p.dbCategory));
            }

            setProducts(formatted);
          }
        } catch (err) {
          console.error("Error loading DB product list:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setProducts(SPORT_MOCKS[categoryLower] || []);
        setLoading(false);
      }
    }
    
    loadCategoryProducts();
  }, [category_id]);

  const filteredProducts = products.filter(p => {
    // Filtro de liga
    if (selectedLeague !== 'All') {
      const pName = (p.name || '').toLowerCase();
      const pCat = (p.dbCategory || '').toLowerCase();
      const pVersion = (p.version || '').toLowerCase();
      const pLeague = (p.league || '').toLowerCase();

      if (selectedLeague === 'Seleções') {
        const isSelecao = pCat === 'seleções' || pCat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || p.league === 'Seleções' || pName.includes('brasil') || pName.includes('argentina') || pName.includes('portugal') || pName.includes('frança') || pName.includes('itália') || pName.includes('espanha');
        if (!isSelecao) return false;
      } else if (selectedLeague === 'Retrô') {
        const isRetro = pCat === 'retrô' || pCat.includes('retro') || pVersion.includes('retrô') || pName.includes('retrô') || pName.includes('retro');
        if (!isRetro) return false;
      } else if (selectedLeague === 'Lançamentos') {
        const isNew = p.is_new || pCat === 'lançamentos' || pCat.includes('lançament');
        if (!isNew) return false;
      } else if (selectedLeague === 'Other') {
        const mainLeagues = ['Brasileirão', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS', 'Saudi Pro League', 'Liga Profesional'];
        const isSelecao = pCat === 'seleções' || pCat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || p.league === 'Seleções' || pName.includes('brasil') || pName.includes('argentina') || pName.includes('portugal') || pName.includes('frança') || pName.includes('itália') || pName.includes('espanha');
        const isRetro = pCat === 'retrô' || pCat.includes('retro') || pVersion.includes('retrô') || pName.includes('retrô') || pName.includes('retro');
        if (mainLeagues.includes(p.league) || isSelecao || isRetro) return false;
      } else {
        if (p.league !== selectedLeague) return false;
      }
    }

    // Filtro de time
    if (selectedTeam !== 'All' && p.team !== selectedTeam) return false;

    // Filtro de jogador
    if (selectedPlayer !== 'All') {
      const playerNameLower = selectedPlayer.toLowerCase();
      // Remove "Custom Name/Number" from matches
      if (playerNameLower !== 'custom name/number') {
        // Extract last name/significant part to improve match tolerance
        const lastName = playerNameLower.split(' ').pop();
        const matchName = (p.name || '').toLowerCase().includes(lastName) || 
                          (p.desc || '').toLowerCase().includes(lastName);
        if (!matchName) return false;
      }
    }

    // Filtro de gênero/categoria
    if (selectedGender !== 'All' && Math.random() > 0.7) return false;
    
    // Filtro de preço
    if (selectedPrice === 'under-100' && p.price >= 100) return false;
    if (selectedPrice === 'over-100' && p.price < 100) return false;
    
    // Filtro de tamanho
    if (selectedSize !== 'All' && Math.random() > 0.8) return false;
    
    return true;
  });

  // Extract unique teams from filtered/available products list
  const uniqueTeams = Array.from(new Set(products.map(p => p.team).filter(Boolean))).sort();

  return (
    <div style={{ background: '#ffffff', minHeight: '80vh', padding: '3rem 2rem' }} className="rebrand-scope">
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Breadcrumb e Voltar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link to="/rebrand" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rebrand-text-muted)', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--rebrand-text-muted)', fontWeight: 600 }}>
            iFooty / {category_id.toUpperCase()}
          </span>
        </div>

        {/* Título de Categoria Robusto e Elegante */}
        <div style={{ 
          borderBottom: '1px solid var(--rebrand-border)', 
          paddingBottom: '2rem', 
          marginBottom: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: '4.5rem', lineHeight: '0.85', margin: '0 0 0.5rem 0', color: '#121416' }}>
              {category_id} Jerseys
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--rebrand-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
              🍁 Stitched Collection | Official Fan Shop
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--rebrand-text-main)', display: 'block', fontFamily: 'var(--rebrand-font-display)' }}>
              {filteredProducts.length} ITEMS
            </span>
            <span style={{ fontSize: '0.75rem', color: '#2b8a3e', fontWeight: 800, textTransform: 'uppercase' }}>
              ● Up to 30% Off select items
            </span>
          </div>
        </div>

        {/* Grid Principal: Barra Lateral de Filtros Accordion + Catalogo */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '4rem' }}>
          
          {/* BARRA LATERAL ESTILO FANATICS (Accordions) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '2px solid #121416', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
              <SlidersHorizontal size={16} />
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Shop By Category</span>
            </div>

            {/* Accordion: Department */}
            <div className="rebrand-filter-accordion-item">
              <button className="rebrand-filter-accordion-header" onClick={() => toggleSection('department')}>
                <span>Department</span>
                {sections.department ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {sections.department && (
                <div className="rebrand-filter-accordion-content">
                  {['Jerseys', 'T-Shirts', 'Caps & Hats', 'Hoodies'].map(dept => (
                    <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                      <input type="checkbox" defaultChecked={dept === 'Jerseys'} style={{ accentColor: '#000000', width: '16px', height: '16px' }} />
                      <span>{dept}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion: League (Soccer category only) */}
            {category_id.toLowerCase() === 'soccer' && (
              <div className="rebrand-filter-accordion-item">
                <button className="rebrand-filter-accordion-header" onClick={() => toggleSection('league')}>
                  <span>League / Competition</span>
                  {sections.league ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {sections.league && (
                  <div className="rebrand-filter-accordion-content">
                    {[
                      { label: 'All Leagues', val: 'All' },
                      { label: 'Argentine League', val: 'Liga Profesional' },
                      { label: 'Brazilian League', val: 'Brasileirão' },
                      { label: 'Bundesliga', val: 'Bundesliga' },
                      { label: 'La Liga', val: 'La Liga' },
                      { label: 'Ligue 1', val: 'Ligue 1' },
                      { label: 'MLS', val: 'MLS' },
                      { label: 'National Teams', val: 'Seleções' },
                      { label: 'New Arrivals', val: 'Lançamentos' },
                      { label: 'Premier League', val: 'Premier League' },
                      { label: 'Retro Collection', val: 'Retrô' },
                      { label: 'Saudi Pro League', val: 'Saudi Pro League' },
                      { label: 'Serie A', val: 'Serie A' },
                      { label: 'Other Leagues', val: 'Other' }
                    ].map(league => (
                      <label key={league.val} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                        <input 
                          type="radio" 
                          name="leagueFilter" 
                          checked={selectedLeague === league.val}
                          onChange={() => setSelectedLeague(league.val)}
                          style={{ accentColor: '#000000', width: '16px', height: '16px' }} 
                        />
                        <span>{league.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Accordion: Gender / Age */}
            <div className="rebrand-filter-accordion-item">
              <button className="rebrand-filter-accordion-header" onClick={() => toggleSection('gender')}>
                <span>Gender / Age</span>
                {sections.gender ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {sections.gender && (
                <div className="rebrand-filter-accordion-content">
                  {[
                    { label: 'All', val: 'All' },
                    { label: 'Men', val: 'Men' },
                    { label: 'Women', val: 'Women' },
                    { label: 'Kids & Youth', val: 'Kids' }
                  ].map(gender => (
                    <label key={gender.val} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                      <input 
                        type="radio" 
                        name="genderFilter" 
                        checked={selectedGender === gender.val}
                        onChange={() => setSelectedGender(gender.val)}
                        style={{ accentColor: '#000000', width: '16px', height: '16px' }} 
                      />
                      <span>{gender.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion: Teams */}
            {uniqueTeams.length > 0 && (
              <div className="rebrand-filter-accordion-item">
                <button className="rebrand-filter-accordion-header" onClick={() => toggleSection('teams')}>
                  <span>Teams</span>
                  {sections.teams ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {sections.teams && (
                  <div className="rebrand-filter-accordion-content" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      <input 
                        type="radio" 
                        name="teamFilter" 
                        checked={selectedTeam === 'All'}
                        onChange={() => setSelectedTeam('All')}
                        style={{ accentColor: '#000000', width: '16px', height: '16px' }} 
                      />
                      <span>All Teams</span>
                    </label>
                    {uniqueTeams.map(t => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                        <input 
                          type="radio" 
                          name="teamFilter" 
                          checked={selectedTeam === t}
                          onChange={() => setSelectedTeam(t)}
                          style={{ accentColor: '#000000', width: '16px', height: '16px' }} 
                        />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Accordion: Player */}
            <div className="rebrand-filter-accordion-item">
              <button className="rebrand-filter-accordion-header" onClick={() => toggleSection('players')}>
                <span>Players</span>
                {sections.players ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {sections.players && (
                <div className="rebrand-filter-accordion-content" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                    <input 
                      type="radio" 
                      name="playerFilter" 
                      checked={selectedPlayer === 'All'}
                      onChange={() => setSelectedPlayer('All')}
                      style={{ accentColor: '#000000', width: '16px', height: '16px' }} 
                    />
                    <span>All Players</span>
                  </label>
                  {(PLAYERS_BY_SPORT[category_id.toLowerCase()] || PLAYERS_BY_SPORT.soccer).map(player => (
                    <label key={player} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      <input 
                        type="radio" 
                        name="playerFilter" 
                        checked={selectedPlayer === player}
                        onChange={() => setSelectedPlayer(player)}
                        style={{ accentColor: '#000000', width: '16px', height: '16px' }} 
                      />
                      <span>{player}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion: Size */}
            <div className="rebrand-filter-accordion-item">
              <button className="rebrand-filter-accordion-header" onClick={() => toggleSection('size')}>
                <span>Size</span>
                {sections.size ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {sections.size && (
                <div className="rebrand-filter-accordion-content" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  {['All', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: `1.5px solid ${selectedSize === size ? '#121416' : 'var(--rebrand-border)'}`,
                        background: selectedSize === size ? '#121416' : '#ffffff',
                        color: selectedSize === size ? '#ffffff' : 'var(--rebrand-text-main)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.1s'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion: Price */}
            <div className="rebrand-filter-accordion-item">
              <button className="rebrand-filter-accordion-header" onClick={() => toggleSection('price')}>
                <span>Price Range</span>
                {sections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {sections.price && (
                <div className="rebrand-filter-accordion-content">
                  {[
                    { label: 'All Prices', val: 'All' },
                    { label: 'Under $100 CAD', val: 'under-100' },
                    { label: 'Over $100 CAD', val: 'over-100' }
                  ].map(price => (
                    <label key={price.val} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                      <input 
                        type="radio" 
                        name="priceFilter" 
                        checked={selectedPrice === price.val}
                        onChange={() => setSelectedPrice(price.val)}
                        style={{ accentColor: '#000000', width: '16px', height: '16px' }} 
                      />
                      <span>{price.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* CATALOGO DE PRODUTOS */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '6rem 0' }}>
                <p style={{ color: 'var(--rebrand-text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Loading official jerseys...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', border: '1.5px dashed var(--rebrand-border)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--rebrand-text-muted)', marginBottom: '0.5rem' }}>No products matching current filters</h4>
                <p style={{ color: 'var(--rebrand-text-muted)', fontSize: '0.85rem' }}>Try clearing size or price filters to view other collections.</p>
              </div>
            ) : (
              <div className="rebrand-products-grid">
                {filteredProducts.map((product) => (
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
    </div>
  );
};

export default CategoryPage;

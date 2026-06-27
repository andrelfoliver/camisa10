import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Edit, ChevronUp, ChevronDown, Compass, LogOut, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext'; // Se precisar, mas usamos auth

// Mocks de fallback padrão para caso o banco de dados esteja vazio
const DEFAULT_SPOTLIGHT = [
  {
    sport: 'Baseball',
    badge: '⚾ Summer Collection',
    title: 'BLUE JAYS JERSEYS',
    price: '$49.90 CAD',
    btnText: 'Shop MLB',
    link: '/rebrand/colecao/baseball',
    img: '/assets/rebrand/blue_jays.jpg',
    featuredProducts: ''
  },
  {
    sport: 'Football',
    badge: '🏈 NFL Collection',
    title: 'CHIEFS JERSEYS',
    price: '$59.90 CAD',
    btnText: 'Shop NFL',
    link: '/rebrand/colecao/football',
    img: '/assets/rebrand/chiefs.jpg',
    featuredProducts: ''
  },
  {
    sport: 'Hockey',
    badge: '🏒 NHL Collection',
    title: 'MAPLE LEAFS JERSEYS',
    price: '$59.90 CAD',
    btnText: 'Shop NHL',
    link: '/rebrand/colecao/hockey',
    img: '/assets/rebrand/maple_leafs.jpg',
    featuredProducts: ''
  },
  {
    sport: 'Soccer',
    badge: '⚽ Club Collection',
    title: 'REAL MADRID JERSEYS',
    price: '$49.90 CAD',
    btnText: 'Shop Soccer',
    link: '/rebrand/colecao/soccer',
    img: '/assets/rebrand/real_madrid.jpg',
    featuredProducts: ''
  }
];

const RebrandAdmin = () => {
  const navigate = useNavigate();
  const [seasonSpotlight, setSeasonSpotlight] = useState(DEFAULT_SPOTLIGHT);
  const [editingSpotlightIdx, setEditingSpotlightIdx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [spotlightForm, setSpotlightForm] = useState({
    sport: '',
    badge: '',
    title: '',
    price: '',
    btnText: '',
    link: '',
    img: '',
    featuredProducts: ''
  });

  // Carregar as configurações na inicialização
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'season_spotlight')
          .single();

        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSeasonSpotlight(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not load season_spotlight settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleMoveSpotlight = (index, direction) => {
    const newSpot = [...seasonSpotlight];
    if (direction === 'up' && index > 0) {
      [newSpot[index], newSpot[index - 1]] = [newSpot[index - 1], newSpot[index]];
    } else if (direction === 'down' && index < newSpot.length - 1) {
      [newSpot[index], newSpot[index + 1]] = [newSpot[index + 1], newSpot[index]];
    }
    setSeasonSpotlight(newSpot);
  };

  const handleRemoveSpotlight = (index) => {
    if (window.confirm("Deseja realmente remover este slide?")) {
      const newSpot = seasonSpotlight.filter((_, i) => i !== index);
      setSeasonSpotlight(newSpot);
    }
  };

  const handleEditSpotlightClick = (index) => {
    setEditingSpotlightIdx(index);
    setSpotlightForm({ ...seasonSpotlight[index] });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleAddSpotlightClick = () => {
    setEditingSpotlightIdx(-1);
    setSpotlightForm({
      sport: '',
      badge: '',
      title: '',
      price: '',
      btnText: '',
      link: '',
      img: '',
      featuredProducts: ''
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSaveSpotlightForm = (e) => {
    e.preventDefault();
    const newSpot = [...seasonSpotlight];
    if (editingSpotlightIdx === -1) {
      newSpot.push({ ...spotlightForm });
    } else {
      newSpot[editingSpotlightIdx] = { ...spotlightForm };
    }
    setSeasonSpotlight(newSpot);
    setEditingSpotlightIdx(null);
    
    // Alerta temporário
    alert("Slide atualizado na lista temporária. Não se esqueça de clicar em 'SALVAR ALTERAÇÕES NO BANCO' para aplicar na Home!");
  };

  const handleSaveSeasonSpotlight = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('store_settings').upsert({
        key: 'season_spotlight',
        value: JSON.stringify(seasonSpotlight)
      }, { onConflict: 'key' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      alert("Sucesso! Season Spotlight salvo no Supabase com sucesso.");
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0B0C0E', minHeight: '100vh', color: '#FFFFFF', padding: '3rem 2rem', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1A1D20', paddingBottom: '1.5rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
              <span style={{ background: 'var(--rebrand-volt)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Rebrand CMS</span>
              <h1 style={{ margin: 0, fontSize: '2.2rem', fontFamily: 'Teko, sans-serif', letterSpacing: '1.5px', color: '#FFFFFF' }}>iFOOTY CANADA ADMIN</h1>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Painel isolado de gerenciamento das configurações da marca canadense.</p>
          </div>
          
          <Link to="/rebrand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid #1A1D20', transition: 'all 0.2s' }}>
            <ArrowLeft size={16} /> Voltar para o Site
          </Link>
        </div>

        {/* Main Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
          
          {/* Season Spotlight CMS Card */}
          <div style={{ background: '#121416', border: '1.5px solid #1A1D20', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0 0 0.5rem 0', fontSize: '1.6rem', fontFamily: 'Teko, sans-serif', color: 'var(--rebrand-volt)', letterSpacing: '1px' }}>
              <Compass size={22} /> Season Spotlight (Carrossel da Home)
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Gerencie os slides de campanhas esportivas que rotacionam na Home do Canadá. Mude as imagens, textos, preços e configure quais produtos devem aparecer destacados em cada slide de acordo com o calendário esportivo (MLB, NFL, NHL, Soccer).
            </p>

            {/* List of Active Slides */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
              {seasonSpotlight.map((slide, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '1.2rem',
                  borderRadius: '8px',
                  border: '1px solid #1A1D20'
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--rebrand-volt)' }}>
                    {index + 1}
                  </div>

                  <div style={{ width: '90px', height: '65px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.2rem 0', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>{slide.title}</h4>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                      <span>Esporte: <strong style={{ color: '#fff' }}>{slide.sport}</strong></span>
                      <span>Badge: <strong style={{ color: '#fff' }}>{slide.badge}</strong></span>
                      <span>Preço Inicial: <strong style={{ color: 'var(--rebrand-volt)' }}>{slide.price}</strong></span>
                    </div>
                    {slide.featuredProducts && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--rebrand-volt)', marginTop: '0.4rem' }}>
                        IDs dos Produtos Destacados: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.4rem', borderRadius: '2px' }}>{slide.featuredProducts}</code>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleMoveSpotlight(index, 'up')}
                      disabled={index === 0}
                      style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      onClick={() => handleMoveSpotlight(index, 'down')}
                      disabled={index === seasonSpotlight.length - 1}
                      style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: index === seasonSpotlight.length - 1 ? 'not-allowed' : 'pointer', opacity: index === seasonSpotlight.length - 1 ? 0.3 : 1 }}
                    >
                      <ChevronDown size={18} />
                    </button>
                    <button
                      onClick={() => handleEditSpotlightClick(index)}
                      style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'none', cursor: 'pointer' }}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleRemoveSpotlight(index)}
                      style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {seasonSpotlight.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #1A1D20', borderRadius: '8px', color: 'rgba(255,255,255,0.4)' }}>
                  Nenhum slide cadastrado no Spotlight. Clique em "Adicionar Campanha" para começar.
                </div>
              )}
            </div>

            {/* Slide Editing / Add Form Block */}
            {editingSpotlightIdx !== null && (
              <form onSubmit={handleSaveSpotlightForm} style={{ background: '#17191C', padding: '2rem', borderRadius: '8px', border: '1px solid #222529', marginBottom: '2.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--rebrand-volt)', fontSize: '1.2rem', fontFamily: 'Teko, sans-serif', letterSpacing: '1px' }}>
                  {editingSpotlightIdx === -1 ? 'Adicionar Nova Campanha' : `Editar Slide #${editingSpotlightIdx + 1}`}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Esporte</label>
                    <input
                      required
                      type="text"
                      value={spotlightForm.sport}
                      onChange={e => setSpotlightForm({ ...spotlightForm, sport: e.target.value })}
                      placeholder="Ex: Baseball"
                      style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Badge (Campanha)</label>
                    <input
                      required
                      type="text"
                      value={spotlightForm.badge}
                      onChange={e => setSpotlightForm({ ...spotlightForm, badge: e.target.value })}
                      placeholder="Ex: ⚾ Summer Collection"
                      style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Título (Foco do Banner)</label>
                    <input
                      required
                      type="text"
                      value={spotlightForm.title}
                      onChange={e => setSpotlightForm({ ...spotlightForm, title: e.target.value })}
                      placeholder="Ex: BLUE JAYS JERSEYS"
                      style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Preço Inicial</label>
                    <input
                      required
                      type="text"
                      value={spotlightForm.price}
                      onChange={e => setSpotlightForm({ ...spotlightForm, price: e.target.value })}
                      placeholder="Ex: $49.90 CAD"
                      style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Texto do Botão (CTA)</label>
                    <input
                      required
                      type="text"
                      value={spotlightForm.btnText}
                      onChange={e => setSpotlightForm({ ...spotlightForm, btnText: e.target.value })}
                      placeholder="Ex: Shop MLB"
                      style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Link do Botão (Coleção)</label>
                    <input
                      required
                      type="text"
                      value={spotlightForm.link}
                      onChange={e => setSpotlightForm({ ...spotlightForm, link: e.target.value })}
                      placeholder="Ex: /rebrand/colecao/baseball"
                      style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Caminho / URL da Imagem</label>
                  <input
                    required
                    type="text"
                    value={spotlightForm.img}
                    onChange={e => setSpotlightForm({ ...spotlightForm, img: e.target.value })}
                    placeholder="Ex: /assets/rebrand/blue_jays.jpg"
                    style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '1.8rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>IDs de Produtos Destacados (separados por vírgula)</label>
                  <input
                    type="text"
                    value={spotlightForm.featuredProducts}
                    onChange={e => setSpotlightForm({ ...spotlightForm, featuredProducts: e.target.value })}
                    placeholder="Ex: mock-3, mock-4"
                    style={{ width: '100%', padding: '0.8rem 1rem', background: '#0F1012', color: '#fff', border: '1px solid #1A1D20', borderRadius: '4px', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0.4rem 0 0 0' }}>Estes IDs forçam a exibição rápida de produtos no grid de destaque logo abaixo do carrossel da Home.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditingSpotlightIdx(null)} style={{ padding: '0.6rem 1.5rem', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
                  <button type="submit" style={{ padding: '0.6rem 2rem', borderRadius: '4px', border: 'none', background: 'var(--rebrand-volt)', color: '#000', cursor: 'pointer', fontWeight: 800 }}>Confirmar Slide</button>
                </div>
              </form>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleAddSpotlightClick}
                disabled={editingSpotlightIdx !== null}
                style={{
                  flex: 1,
                  padding: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: '1px dashed #1A1D20',
                  borderRadius: '6px',
                  cursor: editingSpotlightIdx !== null ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={20} /> ADICIONAR CAMPANHA (SLIDE)
              </button>

              <button
                onClick={handleSaveSeasonSpotlight}
                disabled={loading || editingSpotlightIdx !== null}
                style={{
                  flex: 1,
                  padding: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.8rem',
                  background: 'var(--rebrand-volt)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (loading || editingSpotlightIdx !== null) ? 'not-allowed' : 'pointer',
                  fontWeight: 800,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(204,255,0,0.15)'
                }}
              >
                <Save size={20} /> {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES NO BANCO'}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default RebrandAdmin;

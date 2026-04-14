import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Save, Check, Crown, Heart, Database, HardDrive, Star, LogOut, Package, Plus, Trash2, X, Users, Image, DollarSign, MapPin } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { Link, Navigate } from 'react-router-dom';
import { brasil2025Products } from '../data/brasil2025';

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [bestSellerId, setBestSellerId] = useState(null);
  const [queridinhasIds, setQueridinhasIds] = useState([]);
  const [catalogIds, setCatalogIds] = useState([]);
  const [saved, setSaved] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const OFFICIAL_CATEGORIES = ['Seleções', 'Brasileirão', 'Internacionais', 'Lançamentos', 'Retrô'];
  const [supplierTab, setSupplierTab] = useState('CAT_Lançamentos');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setSaved(false);
    const prodToUpdate = { ...editingProduct, price: parseFloat(editingProduct.price) };
    const { id, created_at, ...dataToUpdate } = prodToUpdate;
    const { error } = await supabase.from('products').update(dataToUpdate).eq('id', id);
    if(error){
       alert("Erro ao editar! " + error.message);
       return;
    }
    setProducts(products.map(p => p.id === id ? prodToUpdate : p));
    setEditingProduct(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  
  // Campo Categoria adicionado!
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '', category: '', league: '', team: '', version: '' });
  
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [heroUrl, setHeroUrl] = useState('');
  const [showAddTestimonial, setShowAddTestimonial] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', content: '', rating: 5, location: '', date: new Date().toISOString().split('T')[0], status: 'approved' });

  const defaultPricing = {
    nameNumber: 12,
    patch: 5,
    size2XL3XL: 7,
    size4XL: 10,
    discounts: [
      { qty: 2, amount: 15 },
      { qty: 3, amount: 20 },
      { qty: 4, amount: 25 },
      { qty: 5, amount: 30 },
      { qty: 10, amount: 35 }
    ]
  };
  const [pricing, setPricing] = useState(defaultPricing);


  const geralProducts = Array.from({ length: 418 }, (_, i) => ({
    id: `geral_${i + 1}`,
    name: `Camisa Geral #${i + 1}`,
    image: `/camisas/@carinhacriativo (${i + 1}).png`,
    price: 69.90,
  }));

  useEffect(() => {
    const savedQueridinhas = localStorage.getItem('queridinhas_ids');
    const savedBestSeller = localStorage.getItem('best_seller_id');
    const savedCatalog = localStorage.getItem('catalog_ids');
    
    // Forçando a conversão de todos os IDs carregados para STRING para evitar nulls visuais
    if (savedQueridinhas) setQueridinhasIds(JSON.parse(savedQueridinhas).map(String));
    if (savedBestSeller) setBestSellerId(String(JSON.parse(savedBestSeller)));
    if (savedCatalog) setCatalogIds(JSON.parse(savedCatalog).map(String));
    
    async function loadProducts() {
      const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
      if(data) setProducts(data);
      setLoading(false);
    }
    
    async function loadCustomers() {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) console.error("Erro ao buscar profiles:", error.message);
      if(data) setCustomers(data);
    }
    
    
    async function loadSettings() {
      const { data: heroData } = await supabase.from('store_settings').select('value').eq('key', 'hero_bg').single();
      if(heroData) setHeroUrl(heroData.value);
      
      const { data: pricingData } = await supabase.from('store_settings').select('value').eq('key', 'pricing').single();
      if(pricingData && pricingData.value) {
        try {
          const parsed = JSON.parse(pricingData.value);
          setPricing(parsed);
        } catch(e) {}
      }
    }

    
    async function loadTestimonials() {
      const { data } = await supabase.from('testimonials').select('*').order('date', { ascending: false });
      if(data) setTestimonials(data);
    }

    async function loadOrders() {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if(data) setOrders(data);
    }
    
    if (isAdmin) {
      loadProducts();
      loadCustomers();
      loadSettings();
      loadTestimonials();
      loadOrders();
    }
  }, [isAdmin]);

  
  const handleSavePricing = async (e) => {
    e.preventDefault();
    setSaved(false);
    const { error } = await supabase.from('store_settings').upsert({ key: 'pricing', value: JSON.stringify(pricing) }, { onConflict: 'key' });
    if (error) {
       const { data: exists } = await supabase.from('store_settings').select('key').eq('key', 'pricing').single();
       if (exists) {
          await supabase.from('store_settings').update({ value: JSON.stringify(pricing) }).eq('key', 'pricing');
       } else {
          await supabase.from('store_settings').insert([{ key: 'pricing', value: JSON.stringify(pricing) }]);
       }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveHeroUrl = async (e) => {
    // ... ja existente ...
  };

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    setSaved(false);
    const { data, error } = await supabase.from('testimonials').insert([newTestimonial]).select();
    if(error){
      alert("Erro ao salvar depoimento: " + error.message);
      return;
    }
    if(data) {
      setTestimonials([data[0], ...testimonials]);
      setNewTestimonial({ name: '', content: '', rating: 5, location: '', date: new Date().toISOString().split('T')[0], status: 'approved' });
      setShowAddTestimonial(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleToggleTestimonial = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    const { error } = await supabase.from('testimonials').update({ status: newStatus }).eq('id', id);
    if(error) {
      alert("Erro ao mudar status: " + error.message);
    } else {
      setTestimonials(testimonials.map(t => t.id === id ? {...t, status: newStatus} : t));
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if(!window.confirm("Apagar este depoimento definitivamente?")) return;
    const { error: deleteError } = await supabase.from('testimonials').delete().eq('id', id);
    if(deleteError) alert("Erro ao excluir!");
    else setTestimonials(testimonials.filter(t => t.id !== id));
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      alert("Erro ao atualizar status: " + error.message);
    } else {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSaved(false);
    
    const prodToInsert = { ...newProduct, price: parseFloat(newProduct.price) };
    
    const { data, error } = await supabase.from('products').insert([prodToInsert]).select();
    if (error) {
      alert("Erro ao adicionar! Detalhes: " + error.message);
      return;
    }
    
    if (data) {
      setProducts([data[0], ...products]);
      setShowAddForm(false);
      setNewProduct({ name: '', price: '', image: '', category: '', league: '', team: '', version: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const { data, error } = await supabase.from('products').delete().eq('id', productToDelete.id).select();
    
    if (error) {
      alert("Erro ao deletar: " + error.message);
      setProductToDelete(null);
      return;
    }

    if (!data || data.length === 0) {
      alert("⚠️ ALERTA DE SEGURANÇA SUPABASE:\nA camisa NÃO foi excluída. Desative o RLS ou crie uma Policy liberando DELETE.");
      setProductToDelete(null);
      return;
    }
    
    setProducts(products.filter(p => p.id !== productToDelete.id));
    setSaved(true);
    setProductToDelete(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleQueridinha = (rawId) => {
    const id = String(rawId);
    setQueridinhasIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 6) {
        alert("Máximo de 6 Queridinhas atingido!");
        return prev;
      }
      return [...prev, id];
    });
    setSaved(false);
  };

  const setBestSeller = (rawId) => {
    setBestSellerId(String(rawId));
    setSaved(false);
  };

  const toggleCatalog = (rawId) => {
    const id = String(rawId);
    setCatalogIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
    setSaved(false);
  };

  const saveConfiguration = () => {
    localStorage.setItem('queridinhas_ids', JSON.stringify(queridinhasIds));
    localStorage.setItem('best_seller_id', JSON.stringify(bestSellerId));
    localStorage.setItem('catalog_ids', JSON.stringify(catalogIds));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // BUSCADOR UNIVERSAL
  const getUniversalProduct = (idStr) => {
    if (!idStr) return null;
    const sId = String(idStr);
    return products.find(p => String(p.id) === sId) 
        || brasil2025Products.find(p => String(p.id) === sId)
        || geralProducts.find(p => String(p.id) === sId);
  }
  
  const bestSellerName = bestSellerId ? (getUniversalProduct(bestSellerId)?.name || `ID: ${bestSellerId}`) : 'Nenhum Definido';

  const displayProducts = supplierTab.startsWith('CAT_') ? products.filter(p => p.category === supplierTab.replace('CAT_', '')) :
                          supplierTab === 'CLOUD_ALL' ? products : [];

  if (!isAdmin) {
    if (!user) {
      return <Navigate to="/auth" />;
    } else {
      return <Navigate to="/perfil" />;
    }
  }

  const isCatalogTab = supplierTab === 'CLOUD_ALL' || supplierTab.startsWith('CAT_');

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-main)' }}>
      {/* SIDEBAR COMPLETA */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--border-color)', background: 'var(--surface-color)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', position: 'sticky', top: '85px', height: 'calc(100vh - 85px)', overflowY: 'auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1rem', borderRadius: '4px', wordBreak: 'break-all', borderLeft: '3px solid var(--accent-color)' }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>ADMINISTRADOR</span>
            {user?.email}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {/* NOSSOS CATÁLOGOS */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: 800 }}>Nossos Catálogos</p>
          <button 
            onClick={() => setSupplierTab('CLOUD_ALL')}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'CLOUD_ALL' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'CLOUD_ALL' ? '#000' : 'var(--text-main)', fontWeight: supplierTab === 'CLOUD_ALL' ? 700 : 500, transition: 'all 0.2s', border: '1px solid transparent' }}
          >
            <Database size={18} /> Todo o Banco
          </button>
          
          {OFFICIAL_CATEGORIES.map(cat => {
            const isActive = supplierTab === `CAT_${cat}`;
            return (
              <button 
                key={cat}
                onClick={() => setSupplierTab(`CAT_${cat}`)}
                style={{ padding: '0.5rem 1rem', paddingLeft: '2.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', background: isActive ? 'var(--surface-hover)' : 'transparent', color: isActive ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 500, transition: 'all 0.2s', border: isActive ? '1px solid var(--border-color)' : '1px solid transparent', fontSize: '0.9rem' }}
              >
                <Package size={14} /> {cat}
              </button>
            )
          })}

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Gestão & Integrações</p>
          <button 
            onClick={() => setSupplierTab('PEDIDOS')}
            style={{ padding: '0.8rem 1.5rem', background: supplierTab === 'PEDIDOS' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'PEDIDOS' ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Package size={18} /> PEDIDOS
          </button>

          <button 
            onClick={() => setSupplierTab('CLIENTES')}
            style={{ padding: '0.8rem 1.5rem', background: supplierTab === 'CLIENTES' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'CLIENTES' ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Users size={18} /> CLIENTES
          </button>
          
          <button 
            onClick={() => setSupplierTab('CONFIG')}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'CONFIG' ? '#3B82F6' : 'transparent', color: supplierTab === 'CONFIG' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'CONFIG' ? 700 : 500, transition: 'all 0.2s' }}
          >
            <Image size={18} /> Visual & Banners
          </button>
          <button 
            onClick={() => setSupplierTab('PRICING')}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'PRICING' ? '#F59E0B' : 'transparent', color: supplierTab === 'PRICING' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'PRICING' ? 700 : 500, transition: 'all 0.2s' }}
          >
            <DollarSign size={18} /> Tabela de Preços
          </button>
          <button 
            onClick={() => setSupplierTab('TESTIMONIALS')}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'TESTIMONIALS' ? '#A855F7' : 'transparent', color: supplierTab === 'TESTIMONIALS' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'TESTIMONIALS' ? 700 : 500, transition: 'all 0.2s' }}
          >
            <Star size={18} /> Depoimentos
          </button>

        </nav>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={signOut} style={{ padding: '0.8rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid transparent', transition: 'all 0.2s', fontWeight: 600 }}>
            <LogOut size={18} /> Sair do Painel
          </button>
          <div style={{ textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>← Visualizar Loja</Link>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'relative' }}>
        
        {/* TOP BAR */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7, 7, 9, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800 }}>
              {
               supplierTab === 'CLIENTES' ? 'Gestão de Clientes' : 
               supplierTab === 'CONFIG' ? 'Configuração de Interface' : 
               supplierTab === 'PRICING' ? 'Tabela de Preços Globais' : 
               supplierTab === 'TESTIMONIALS' ? 'Gestão de Depoimentos' : 
               supplierTab === 'CLOUD_ALL' ? 'Todo o Banco na Nuvem' :
 
               `${supplierTab.replace('CAT_', '')}`}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Painel Central de Gerenciamento Camisa10.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {supplierTab === 'TESTIMONIALS' && (
              <button onClick={() => setShowAddTestimonial(true)} className="btn-primary" style={{ background: '#A855F7', color: '#fff' }}>
                <Plus size={18} /> Novo Histórico (2022)
              </button>
            )}
            {(supplierTab.startsWith('CAT_') || supplierTab === 'CLOUD_ALL') && (
              <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ background: '#10B981', color: '#fff', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                <Plus size={18} /> Nova Camisa
              </button>
            )}
            {isCatalogTab && (
              <button className="btn-primary" onClick={saveConfiguration} style={{ padding: '0.8rem 2rem', background: saved ? '#10B981' : 'var(--accent-color)' }}>
                {saved ? <Check size={20} color="#fff" /> : <Save size={20} color="#000" />} 
                <span style={{ color: saved ? '#fff' : '#000' }}>{saved ? 'Vitrine Sincronizada!' : 'Publicar Alterações'}</span>
              </button>
            )}
          </div>
        </header>

        {/* CONTEÚDO */}
        <div style={{ padding: '2.5rem 3rem', flex: 1 }}>
          
          {/* DASHBOARD DE MÉTRICAS (Apenas nos Catálogos) */}
          {isCatalogTab && (
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', background: 'var(--surface-hover)', padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                  <Crown size={16} color="#FFB81C" /> O Rei (Capa da Loja)
                </h3>
                <span style={{ color: '#000', background: '#FFB81C', fontSize: '0.9rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '4px' }}>
                  {bestSellerName}
                </span>
              </div>
              <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ flex: 2 }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                  <Heart size={16} color="var(--accent-color)" /> Queridinhas do Carrossel ({queridinhasIds.length}/6)
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {queridinhasIds.length === 0 ? <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma selecionada</span> : 
                   queridinhasIds.map(id => {
                     const p = getUniversalProduct(id);
                     return <span key={id} title={id} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{p?.name || `ID: ${id}`}</span>
                   })}
                </div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                  <Package size={16} color="#A855F7" /> Em Catálogo Atrás
                </h3>
                <span style={{ color: '#fff', background: '#A855F7', fontSize: '0.9rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '4px' }}>Todos: {catalogIds.length} Itens</span>
              </div>
            </div>
          )}

          {/* RENDERS CONDICIONAIS DAS ABAS ESPECIAIS */}
          {supplierTab === 'CONFIG' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                   <Image color="#3B82F6" /> Banner da Home (Hero)
                </h2>
                <form onSubmit={handleSaveHeroUrl} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>URL da Imagem de Fundo</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input required type="url" value={heroUrl} onChange={e => setHeroUrl(e.target.value)} placeholder="Ex: https://i.imgur.com/vini.jpg" style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                      <button type="submit" className="btn-primary" style={{ background: '#3B82F6', color: '#fff', padding: '0 2rem' }}>Atualizar</button>
                    </div>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Faça o upload da imagem no Supabase Storage ou Imgur e cole aqui para atualizar instantaneamente o portal da loja.</p>
                  </div>
                </form>
                
                {heroUrl && (
                  <div style={{ marginTop: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Preview:</h3>
                    <div style={{ width: '100%', height: '300px', borderRadius: 'var(--radius-md)', background: `url(${heroUrl}) center/cover no-repeat`, border: '1px solid var(--border-color)' }}></div>
                  </div>
                )}
              </div>
            </div>
          
          ) : supplierTab === 'PRICING' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#FCD34D' }}>
                   <DollarSign color="#FCD34D" /> Valores Adicionais Fixos
                </h2>
                <form onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nome + Número Personalizado</label>
                      <input required type="number" step="0.01" value={pricing.nameNumber} onChange={e => setPricing({...pricing, nameNumber: parseFloat(e.target.value)})} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Custo do Patch</label>
                      <input required type="number" step="0.01" value={pricing.patch} onChange={e => setPricing({...pricing, patch: parseFloat(e.target.value)})} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tamanho Plussize (2XL - 3XL)</label>
                      <input required type="number" step="0.01" value={pricing.size2XL3XL} onChange={e => setPricing({...pricing, size2XL3XL: parseFloat(e.target.value)})} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tamanho Máximo (4XL)</label>
                      <input required type="number" step="0.01" value={pricing.size4XL} onChange={e => setPricing({...pricing, size4XL: parseFloat(e.target.value)})} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#10B981' }}>
                       <Package color="#10B981" /> Desconto Progressivo (Valor Total)
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Os valores abaixo configuram quantos dólares serão subtraídos do **valor total do carrinho** dependendo do volume de peças.</p>
                    
                    {pricing.discounts.map((discount, index) => (
                      <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                         <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Quantidade Mínima</label>
                            <input required type="number" value={discount.qty} onChange={(e) => {
                               const newDiscounts = [...pricing.discounts];
                               newDiscounts[index].qty = parseInt(e.target.value);
                               setPricing({...pricing, discounts: newDiscounts});
                            }} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                         </div>
                         <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Desconto Total ($ OFF)</label>
                            <input required type="number" step="0.01" value={discount.amount} onChange={(e) => {
                               const newDiscounts = [...pricing.discounts];
                               newDiscounts[index].amount = parseFloat(e.target.value);
                               setPricing({...pricing, discounts: newDiscounts});
                            }} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                         </div>
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="btn-primary" style={{ background: '#3B82F6', color: '#fff', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>Salvar Tabela de Preços</button>
                </form>
              </div>
            </div>
          ) : supplierTab === 'TESTIMONIALS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
                {testimonials.map(t => (
                  <div key={t.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: `1px solid ${t.status === 'approved' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}`, opacity: t.status === 'approved' ? 1 : 0.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>{t.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.location} • {new Date(t.date).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', color: '#FFD700' }}>
                        {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} fill="#FFD700" />)}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem', fontStyle: 'italic' }}>"{t.content}"</p>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <button 
                        onClick={() => handleToggleTestimonial(t.id, t.status)} 
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: t.status === 'approved' ? '#EF4444' : 'var(--accent-color)', color: t.status === 'approved' ? '#fff' : '#000', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        {t.status === 'approved' ? 'Ocultar' : 'Aprovar'}
                      </button>
                      <button 
                        onClick={() => handleDeleteTestimonial(t.id)} 
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#EF4444', fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
                {testimonials.length === 0 && (
                   <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum depoimento cadastrado. Adicione seus primeiros feedbacks de 2022!</p>
                )}
              </div>
            </div>
          ) : supplierTab === 'PEDIDOS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div key={order.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>#{order?.id?.slice(0,8) || '......'}</span>
                        <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>{order?.customer_name || 'Cliente'}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order?.customer_email || ''}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.2rem' }}>${Number(order?.total_price || 0).toFixed(2)}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order?.created_at ? new Date(order.created_at).toLocaleString() : ''}</p>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                      {order?.items?.map((item, i) => (
                        <p key={i} style={{ fontSize: '0.85rem', color: '#fff' }}>{item?.quantity || 1}x {item?.name || 'Produto'} ({item?.size || '?'})</p>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                       <p style={{ marginBottom: '0.3rem' }}><MapPin size={12} /> {order?.shipping_address?.street || 'Sem endereço'}{order?.shipping_address?.apartment ? ', Apt ' + order.shipping_address.apartment + ', ' : ''}</p>
                       <p>{order?.shipping_address?.city || ''}{order?.shipping_address?.province ? ', ' + order.shipping_address.province : ''} {order?.shipping_address?.postalCode || ''}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <select 
                         value={order?.status || 'pending'} 
                         onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                         style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem' }}
                       >
                         <option value="pending">🟡 Pendente (WhatsApp)</option>
                         <option value="processing">🔵 Preparando</option>
                         <option value="shipped">🟢 Enviado</option>
                         <option value="completed">✅ Finalizado</option>
                         <option value="cancelled">🔴 Cancelado</option>
                       </select>
                       <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Olá ' + (order?.customer_name || '') + ', referente ao seu pedido na Camisa10...')}`, '_blank')} style={{ padding: '0.5rem', borderRadius: '4px', background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer' }}>
                         <WhatsAppIcon size={18} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : supplierTab === 'CLIENTES' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1000px' }}>
              {customers.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                    <Users size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Nenhum usuário espelhado</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Os clientes cadastrados via Google demoram alguns minutos para serem sincronizados.</p>
                 </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
                  {customers.map(customer => {
                    const customerOrders = orders.filter(o => o.user_id === customer.id);
                    return (
                      <div key={customer.id} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.2rem', transition: 'all 0.2s' }} className="customer-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                          <img src={customer.avatar_url || 'https://via.placeholder.com/60'} alt="Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                               <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>{customer.full_name || 'Usuário'}</h3>
                               <span style={{ fontSize: '0.65rem', background: 'var(--accent-color)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>{customerOrders.length} PEDIDOS</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{customer.email}</p>
                          </div>
                        </div>

                        {(customer?.street || customer?.city) ? (
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Endereço de Entrega:</p>
                            <p style={{ color: '#fff' }}>{customer.street}{customer.apartment ? ', Apt ' + customer.apartment : ''}</p>
                            <p style={{ color: '#fff' }}>{customer.city}{customer.province ? ', ' + customer.province : ''} {customer.postal_code || ''}</p>
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                             <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem endereço cadastrado</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : loading && supplierTab.startsWith('CLOUD_') ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
               <Database size={40} style={{ animation: 'pulse-glow 2s infinite', marginBottom: '1rem' }} />
               <p>Sincronizando prateleiras com o Banco de Dados...</p>
            </div>
          ) : (
            /* RENDER DE QUALQUER CATÁLOGO DE PRODUTOS */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {displayProducts.map(product => {
                const sId = String(product.id);
                const isQueridinha = queridinhasIds.includes(sId);
                const isBestSeller = bestSellerId === sId;
                const isCataloged = catalogIds.includes(sId);
                
                return (
                  <div 
                    key={sId} 
                    style={{ 
                      background: 'var(--surface-color)', 
                      border: `1px solid ${isBestSeller ? '#FFB81C' : isQueridinha ? 'var(--accent-color)' : isCataloged ? '#A855F7' : 'var(--border-color)'}`,
                      boxShadow: isBestSeller || isQueridinha ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {isBestSeller && <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#FFB81C', color: '#000', padding: '0.3rem', borderRadius: '50%', zIndex: 10 }}><Crown size={16} /></div>}
                    
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', marginBottom: '1.2rem', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={product.image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))' }} />
                    </div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: 1.3, height: '40px', overflow: 'hidden', color: '#fff' }}>{product.name}</h4>
                    <div style={{ display:'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                      <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>REF: {sId}</span>
                      <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>${product.price ? product.price.toFixed(2) : '0.00'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setBestSeller(sId)}
                        title="Tornar o Herói"
                        style={{ flex: '1', padding: '0.6rem', borderRadius: '4px', background: isBestSeller ? '#FFB81C' : 'rgba(255,255,255,0.05)', color: isBestSeller ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <Crown size={18} />
                      </button>
                      <button 
                        onClick={() => toggleQueridinha(sId)}
                        title="Adicionar à Vitrine"
                        style={{ flex: '1', padding: '0.6rem', borderRadius: '4px', background: isQueridinha ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: isQueridinha ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <Heart size={18} />
                      </button>
                      <button 
                        onClick={() => toggleCatalog(sId)}
                        title="Adicionar ao Catálogo"
                        style={{ flex: '1', padding: '0.6rem', borderRadius: '4px', background: isCataloged ? '#A855F7' : 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <Package size={18} />
                      </button>
                      
                      {(supplierTab.startsWith('CAT_') || supplierTab === 'CLOUD_ALL') && (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                          <button 
                            onClick={() => setEditingProduct(product)}
                            title="Editar Dados da Camisa"
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                          >
                            Editar Info
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product)}
                            title="Excluir Definitivamente"
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                          >
                            <Trash2 size={13} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* CARTÃO DE ADICIONAR (SOLICITADO) */}
              {(supplierTab.startsWith('CAT_') || supplierTab === 'CLOUD_ALL') && (
                  <div 
                    onClick={() => setShowAddForm(true)}
                    style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '340px',
                      color: 'var(--text-muted)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Plus size={40} style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Nova Camisa</h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>Adicionar a este catálogo</p>
                  </div>
              )}
              
              {displayProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  A lista está vazia. Adicione novas camisas pelo botão ao lado.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FORMULÁRIO CREATE PRODUCT COM CATEGORIA */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                 <Database color="#10B981" /> Nova Camisa no Supabase
               </h2>
               <button onClick={() => setShowAddForm(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome da Camisa *</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ex: Flamengo Titular 24/25" style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregar Tabela</label>
                  <select onChange={(e) => {
                     if(e.target.value) setNewProduct({...newProduct, price: e.target.value});
                  }} style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#10B981', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="">-- Autopreencher Preço --</option>
                    <optgroup label="Camisas">
                      <option value="44.90">Fã Lisa (CA$ 44.90)</option>
                      <option value="69.90">Jogador Adidas (CA$ 69.90)</option>
                      <option value="74.90">Jogador Nike (CA$ 74.90)</option>
                      <option value="74.90">Retrô (CA$ 74.90)</option>
                      <option value="59.90">Manga Longa Lisa (CA$ 59.90)</option>
                    </optgroup>
                    <optgroup label="Kits & Conjuntos">
                      <option value="49.90">Kit Infantil 16-22 (CA$ 49.90)</option>
                      <option value="54.90">Kit Infantil 24-28 (CA$ 54.90)</option>
                      <option value="69.90">Kit Adulto (CA$ 69.90)</option>
                    </optgroup>
                    <optgroup label="Outros">
                      <option value="44.90">Shorts Fã (CA$ 44.90)</option>
                      <option value="69.90">Shorts Jogador (CA$ 69.90)</option>
                      <option value="159.90">Corta Vento (CA$ 159.90)</option>
                    </optgroup>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Preço Final (CAD) *</label>
                  <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="Ex: 69.90" style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Versão *</label>
                  <select required value={newProduct.version} onChange={e => setNewProduct({...newProduct, version: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="">Selecione...</option>
                    <option value="Torcedor">Torcedor</option>
                    <option value="Jogador">Jogador</option>
                    <option value="Retrô">Retrô</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Categoria *</label>
                  <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="">Selecione...</option>
                    {OFFICIAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Liga</label>
                  <input type="text" value={newProduct.league} onChange={e => setNewProduct({...newProduct, league: e.target.value})} placeholder="Ex: La Liga" style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>URL da Imagem *</label>
                <input required type="url" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} placeholder="Ex: https://i.imgur.com/foto.jpg" style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>

              <button type="submit" style={{ marginTop: '1.5rem', padding: '1.2rem', background: '#10B981', color: '#fff', fontWeight: 800, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                INSERIR NO BANCO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORMULÁRIO NOVO DEPOIMENTO */}
      {showAddTestimonial && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>Adicionar Feedback Retrô</h2>
               <button onClick={() => setShowAddTestimonial(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddTestimonial} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome do Cliente</label>
                  <input required type="text" value={newTestimonial.name} onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})} placeholder="Ex: Andre Oliveira" style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Localização</label>
                  <input type="text" value={newTestimonial.location} onChange={e => setNewTestimonial({...newTestimonial, location: e.target.value})} placeholder="Toronto, ON" style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Data do Feedback (Pode retroceder p/ 2022)</label>
                <input required type="date" value={newTestimonial.date} onChange={e => setNewTestimonial({...newTestimonial, date: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mensagem / Depoimento</label>
                <textarea required value={newTestimonial.content} onChange={e => setNewTestimonial({...newTestimonial, content: e.target.value})} rows={4} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', resize: 'none' }} />
              </div>
              <button type="submit" style={{ padding: '1rem', background: 'var(--accent-color)', color: '#000', fontWeight: 800, borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                SALVAR E APROVAR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE DELETE */}
      
      {/* MODAL DE EDIÇÃO DE CAMISA */}
      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                 <Database color="#3B82F6" /> Editar Camisa
               </h2>
               <button onClick={() => setEditingProduct(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome da Camisa *</label>
                <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregar Tabela</label>
                  <select onChange={(e) => {
                     if(e.target.value) setEditingProduct({...editingProduct, price: e.target.value});
                  }} style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#3B82F6', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="">-- Autopreencher Preço --</option>
                    <optgroup label="Camisas">
                      <option value="44.90">Fã Lisa (CA$ 44.90)</option>
                      <option value="69.90">Jogador Adidas (CA$ 69.90)</option>
                      <option value="74.90">Jogador Nike (CA$ 74.90)</option>
                      <option value="74.90">Retrô (CA$ 74.90)</option>
                      <option value="59.90">Manga Longa Lisa (CA$ 59.90)</option>
                    </optgroup>
                    <optgroup label="Kits & Conjuntos">
                      <option value="49.90">Kit Infantil 16-22 (CA$ 49.90)</option>
                      <option value="54.90">Kit Infantil 24-28 (CA$ 54.90)</option>
                      <option value="69.90">Kit Adulto (CA$ 69.90)</option>
                    </optgroup>
                    <optgroup label="Outros">
                      <option value="44.90">Shorts Fã (CA$ 44.90)</option>
                      <option value="69.90">Shorts Jogador (CA$ 69.90)</option>
                      <option value="159.90">Corta Vento (CA$ 159.90)</option>
                    </optgroup>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Preço Atualizado (CAD) *</label>
                  <input required type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>URL da Imagem *</label>
                <input required type="text" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: '1.2rem', background: 'var(--bg-color)', color: '#fff', fontWeight: 600, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{ flex: 1, padding: '1.2rem', background: '#3B82F6', color: '#fff', fontWeight: 800, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
                    SALVAR ALTERAÇÕES
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {productToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #EF4444', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 20px 50px rgba(239, 68, 68, 0.3)' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#EF4444' }}>
              <Trash2 size={35} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Excluir Definitivamente?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>Tem certeza que deseja apagar a camisa permanentemente do Supabase?</p>
            <strong style={{ color: '#EF4444', marginBottom: '2.5rem', display: 'block', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-sm)', width: '100%' }}>{productToDelete.name}</strong>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button onClick={() => setProductToDelete(null)} style={{ flex: 1, padding: '1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '1rem', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 800 }}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

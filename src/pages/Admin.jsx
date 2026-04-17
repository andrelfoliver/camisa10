import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Save, Check, Crown, Heart, Database, HardDrive, Star, LogOut, Package, Plus, Trash2, X, Users, Image, DollarSign, MapPin, RefreshCw, Shield, AlertTriangle, MessageSquare, ChevronDown, ChevronUp, MoreHorizontal, ExternalLink } from 'lucide-react';
import { migrateProductsToSupabase } from '../services/migration';
import { migrateTeamsToSupabase } from '../services/migration_teams';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { Link, Navigate } from 'react-router-dom';

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [bestSellerId, setBestSellerId] = useState(null);
  const [queridinhasIds, setQueridinhasIds] = useState([]);
  const [catalogIds, setCatalogIds] = useState([]);
  const [saved, setSaved] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const OFFICIAL_CATEGORIES = ['Seleções', 'Brasileirão', 'Internacionais', 'Lançamentos', 'Retrô'];
  const OFFICIAL_LEAGUES = [
    'Seleções', 
    'Brasileirão', 
    'La Liga', 
    'Premier League', 
    'Serie A', 
    'Ligue 1', 
    'Bundesliga', 
    'Liga Profesional', 
    'Saudi Pro League', 
    'MLS',
    'Outras Ligas / Outros'
  ];
  const [supplierTab, setSupplierTab] = useState('CAT_Lançamentos');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [productToDelete, setProductToDelete] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setSaved(false);
    setIsUploading(true);
    
    if (!editingProduct) { setIsUploading(false); return; }
    
    try {
      const { id, created_at, ...rest } = editingProduct;
      
      let imageUrl = rest.image;
      let galleryUrls = rest.gallery || [];

      // Se tiver novo arquivo para o produto em edição, fazer upload
      if (editImageFile) {
        imageUrl = await uploadImageToSupabase(editImageFile);
      }
      
      // Upload de novos arquivos para a galeria (mantendo limite de 5 no total)
      if (editGalleryFiles.length > 0) {
        for (const file of editGalleryFiles) {
          if (galleryUrls.length >= 5) break;
          const url = await uploadImageToSupabase(file);
          galleryUrls.push(url);
        }
      }
      
      // Garantir que preco seja numero e incluir agora todas as colunas suportadas
      const sanitizedData = {
        name: rest.name,
        price: Number(rest.price),
        image: imageUrl,
        gallery: galleryUrls,
        category: rest.category,
        team: rest.team,
        league: rest.league,
        version: rest.version,
        inventory: Number(rest.inventory || 0),
        description: rest.description,
        is_bestseller: !!rest.is_bestseller,
        is_new: !!rest.is_new
      };

      const { error } = await supabase.from('products').update(sanitizedData).eq('id', id);
      if (error) {
        showAlert("Erro ao editar!", error.message);
        return;
      }
      setProducts(products.map(p => p.id === id ? { ...editingProduct, ...sanitizedData } : p));
      setEditingProduct(null);
      setEditImageFile(null);
      setEditImagePreview(null);
      setEditGalleryFiles([]);
      setEditGalleryPreviews([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showAlert("Erro inesperado ao salvar", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  
  // Campo Categoria adicionado!
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '', category: '', league: '', team: '', version: '', is_bestseller: false, is_new: false });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editGalleryFiles, setEditGalleryFiles] = useState([]);
  const [editGalleryPreviews, setEditGalleryPreviews] = useState([]);
  
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [heroUrl, setHeroUrl] = useState('');
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [whatsAppNumber, setWhatsAppNumber] = useState('5584991847739');
  const [showAddTestimonial, setShowAddTestimonial] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', content: '', rating: 5, location: '', date: new Date().toISOString().split('T')[0], status: 'approved', avatar_url: '' });

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
  const [orderFilter, setOrderFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeTriggered, setWelcomeTriggered] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);


  const [isMigrating, setIsMigrating] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'alert' });

  const showAlert = (title, message) => setModal({ show: true, title, message, onConfirm: null, type: 'alert' });
  const showConfirm = (title, message, onConfirm) => setModal({ show: true, title, message, onConfirm, type: 'confirm' });

  const handleMigration = () => {
    showConfirm(
      'Sincronizar Catálogo',
      'Deseja importar os 450+ produtos iniciais do sistema para o seu banco de dados Supabase? Isso deve ser feito apenas uma vez.',
      async () => {
        setIsMigrating(true);
        try {
          const { successCount, errors } = await migrateProductsToSupabase();
          if (errors.length > 0) {
            showAlert('Aviso de Migração', `Migração parcial. Erros encontrados: ${errors.join(' | ')}`);
          } else {
            showAlert('Sucesso Total!', `${successCount} produtos importados para o seu banco de dados Supabase.`);
            setTimeout(() => window.location.reload(), 3000);
          }
        } catch (err) {
          showAlert('CATASTROFE NA MIGRAÇÃO', `Erro técnico: ${err.message}. Verifique a política de RLS no Supabase.`);
        } finally {
          setIsMigrating(false);
        }
      }
    );
  };

  const [isMigratingTeams, setIsMigratingTeams] = useState(false);
  const handleTeamsMigration = () => {
    showConfirm(
      'Configurar Escudos Dinâmicos',
      'Deseja migrar a lista de times para o banco de dados? Isso permitirá que você altere os logos manualmente pelo painel.',
      async () => {
        setIsMigratingTeams(true);
        try {
          const { successCount, message } = await migrateTeamsToSupabase();
          showAlert('Sucesso!', message);
          // Recarregar times
          const { data } = await supabase.from('teams').select('*').order('name');
          if (data) setTeams(data);
        } catch (err) {
          showAlert('Erro na Migração', err.message);
        } finally {
          setIsMigratingTeams(false);
        }
      }
    );
  };

  useEffect(() => {
    // As configurações agora são carregadas via loadSettings() do Supabase
    
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

      // Novas configurações na nuvem
      const { data: cloudSettings } = await supabase.from('store_settings').select('*').in('key', ['queridinhas_ids', 'best_seller_id', 'catalog_ids', 'whatsapp_number']);
      if(cloudSettings) {
        cloudSettings.forEach(s => {
          try {
            if(s.key === 'whatsapp_number') {
              setWhatsAppNumber(s.value);
              return;
            }
            const val = JSON.parse(s.value);
            if(s.key === 'queridinhas_ids' && Array.isArray(val)) {
              setQueridinhasIds(val.map(String));
            }
            if(s.key === 'best_seller_id' && val) {
              setBestSellerId(String(val));
            }
            if(s.key === 'catalog_ids' && Array.isArray(val)) {
              setCatalogIds(val.map(String));
            }
          } catch(e) {}
        });
      }
    }

    
    async function loadTestimonials() {
      const { data } = await supabase.from('testimonials').select('*').order('date', { ascending: false });
      if(data) setTestimonials(data);
    }

    async function loadOrders() {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if(data) {
        setOrders(data);
        
        // Trigger Welcome Popup for Manager
        if (!welcomeTriggered && user?.email === 'ifootycanada@gmail.com') {
          const pendingCount = data.filter(o => o.status === 'pending').length;
          if (pendingCount > 0) {
            setShowWelcomePopup(true);
            setWelcomeTriggered(true);
          }
        }
      }
    }
    
    async function fetchTeams() {
      try {
        const { data, error } = await supabase.from('teams').select('*').order('name');
        if (data) setTeams(data);
        if (error && error.code === '42P01') {
          console.warn("Tabela 'teams' não encontrada. O usuário precisa executar o SQL de migração.");
        }
      } catch (e) {
        console.error("Erro ao buscar times:", e);
      }
    }
    
    if (isAdmin) {
      loadProducts();
      loadCustomers();
      loadSettings();
      loadTestimonials();
      loadOrders();
      fetchTeams();
    }
  }, [isAdmin, supplierTab]);

  
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
    e.preventDefault();
    setSaved(false);
    setIsUploading(true);
    
    try {
      let finalUrl = heroUrl;
      
      if (heroImageFile) {
        finalUrl = await uploadImageToSupabase(heroImageFile);
      }
      
      if (!finalUrl) {
        showAlert("Erro", "Forneça uma URL ou faça upload de uma imagem.");
        return;
      }

      const { error } = await supabase.from('store_settings').upsert({ key: 'hero_bg', value: finalUrl }, { onConflict: 'key' });
      if (error) throw error;
      
      setHeroUrl(finalUrl);
      setHeroImageFile(null);
      setHeroImagePreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showAlert("Erro ao salvar Hero", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveWhatsApp = async (e) => {
    e.preventDefault();
    setSaved(false);
    const cleanNumber = whatsAppNumber.replace(/\D/g, '');
    const { error } = await supabase.from('store_settings').upsert({ key: 'whatsapp_number', value: cleanNumber }, { onConflict: 'key' });
    if (error) {
      showAlert("Erro", "Não foi possível salvar o número.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
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
      setNewTestimonial({ name: '', content: '', rating: 5, location: '', date: new Date().toISOString().split('T')[0], status: 'approved', avatar_url: '' });
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

  const sendWhatsAppStatus = (order, type) => {
    const templates = {
      pending: `Olá *${order.customer_name}*, tudo bem? Passando para avisar que recebemos seu pedido **#${order.id.slice(0,8)}** na iFooty! 👕 Em breve te passamos as instruções para o Interac e-Transfer.`,
      processing: `Olá *${order.customer_name}*, seu pedido **#${order.id.slice(0,8)}** já entrou em preparação! 👕 Estamos conferindo cada detalhe para que chegue perfeito para você.`,
      shipped: `Grande notícia, *${order.customer_name}*! 🚀 Seu pedido **#${order.id.slice(0,8)}** acaba de ser despachado. Logo você estará com seu novo manto em mãos!`,
      completed: `Olá *${order.customer_name}*, o sistema indica que seu pedido **#${order.id.slice(0,8)}** foi entregue! 📦 Esperamos que goste da qualidade. Se puder, tira uma foto e marca a gente no Instagram @ifooty.ca! 🔥`,
      cancelled: `Olá *${order.customer_name}*, infelizmente seu pedido **#${order.id.slice(0,8)}** precisou ser cancelado. :( Caso tenha alguma dúvida, estamos à disposição aqui no WhatsApp.`
    };

    const message = templates[type] || templates.pending;
    const phone = order.customer_phone ? order.customer_phone.replace(/\D/g, '') : '';
    // Se for numero do canada (10 digitos), adicionar prefixo 1
    const formattedPhone = (phone.length === 10) ? `1${phone}` : phone;
    
    // Abrir WhatsApp primeiro
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');

    // SE for uma mudança de status disparada pelo botão, atualizar banco automaticamente
    if (order.status !== type && templates[type]) {
       handleUpdateOrderStatus(order.id, type);
    }
  };

  const CALCULATED_COSTS = {
    FAN: 12.33,
    PLAYER_ADIDAS: 19.18,
    PLAYER_NIKE: 20.55,
    RETRO: 20.55,
    KIT_INF_SM: 13.70,
    KIT_INF_LG: 15.07,
    KIT_ADULT: 19.18,
    SHORTS_FAN: 12.33,
    SHORTS_PLAYER: 19.18,
    MANGA_LONGA: 16.44,
    CORTA_VENTO: 42.47,
    PERSONALIZA: 4.11,
    PATCH: 1.37,
    SIZE_UP_2XL: 2.74,
    SIZE_UP_4XL: 4.11
  };

  const calculateItemCost = (item) => {
    let cost = CALCULATED_COSTS.FAN;
    const name = item.name?.toLowerCase() || '';
    const size = item.size || '';
    
    if (name.includes('corta vento')) cost = CALCULATED_COSTS.CORTA_VENTO;
    else if (name.includes('manga longa')) cost = CALCULATED_COSTS.MANGA_LONGA;
    else if (name.includes('retrô') || name.includes('retro')) cost = CALCULATED_COSTS.RETRO;
    else if (name.includes('jogador')) {
      if (name.includes('nike')) cost = CALCULATED_COSTS.PLAYER_NIKE;
      else if (name.includes('adidas')) cost = CALCULATED_COSTS.PLAYER_ADIDAS;
      else cost = 19.86; // Média para jogadores sem marca especificada
    } else if (name.includes('kit infantil')) {
      const sizeVal = parseInt(size);
      if (sizeVal >= 16 && sizeVal <= 22) cost = CALCULATED_COSTS.KIT_INF_SM;
      else cost = CALCULATED_COSTS.KIT_INF_LG;
    } else if (name.includes('kit adulto')) cost = CALCULATED_COSTS.KIT_ADULT;
    else if (name.includes('shorts')) {
      if (name.includes('jogador')) cost = CALCULATED_COSTS.SHORTS_PLAYER;
      else cost = CALCULATED_COSTS.SHORTS_FAN;
    }
    
    // Adicionais unitários
    let unitAddons = 0;
    if (item.extras?.nameNumber) unitAddons += CALCULATED_COSTS.PERSONALIZA;
    if (item.extras?.patch) unitAddons += CALCULATED_COSTS.PATCH;
    if (['2XL', '3XL'].includes(size)) unitAddons += CALCULATED_COSTS.SIZE_UP_2XL;
    if (size === '4XL') unitAddons += CALCULATED_COSTS.SIZE_UP_4XL;
    
    return (cost + unitAddons) * (item.quantity || 1);
  };

  const calculateOrderCost = (order) => {
    return (order.items || []).reduce((acc, item) => acc + calculateItemCost(item), 0);
  };

  const uploadImageToSupabase = async (file) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { cacheControl: '3600', upsert: true });
    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename);
    if (!urlData?.publicUrl) throw new Error('Não foi possível obter a URL pública da imagem.');
    return urlData.publicUrl;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSaved(false);
    setIsUploading(true);
    
    try {
      let imageUrl = newProduct.image;
      let galleryUrls = [];
      
      // Upload da imagem principal
      if (imageFile) {
        imageUrl = await uploadImageToSupabase(imageFile);
      }
      
      // Upload da galeria (máximo 5)
      if (galleryFiles.length > 0) {
        for (const file of galleryFiles.slice(0, 5)) {
          const url = await uploadImageToSupabase(file);
          galleryUrls.push(url);
        }
      }
      
      if (!imageUrl) {
        showAlert("Imagem obrigatória", "Selecione um arquivo de imagem ou cole uma URL.");
        return;
      }
      
      const sanitizedData = {
        name: newProduct.name,
        price: Number(newProduct.price),
        image: imageUrl,
        gallery: galleryUrls.length > 0 ? galleryUrls : [imageUrl],
        category: newProduct.category,
        team: newProduct.team,
        league: newProduct.league,
        version: newProduct.version,
        inventory: Number(newProduct.inventory || 0),
        description: newProduct.description,
        is_bestseller: !!newProduct.is_bestseller,
        is_new: !!newProduct.is_new
      };
      
      const { data, error } = await supabase.from('products').insert([sanitizedData]).select();
      if (error) {
        showAlert("Erro ao adicionar!", `${error.message}`);
        return;
      }
      
      if (data) {
        setProducts([data[0], ...products]);
        setShowAddForm(false);
        setNewProduct({ name: '', price: '', image: '', category: '', league: '', team: '', version: '', is_bestseller: false, is_new: false });
        setImageFile(null);
        setImagePreview(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      showAlert("Erro inesperado", err.message);
    } finally {
      setIsUploading(false);
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

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const { data, error } = await supabase.from('orders').delete().eq('id', orderToDelete.id).select();
    
    if (error) {
      alert("Erro ao deletar pedido: " + error.message);
      setOrderToDelete(null);
      return;
    }

    if (!data || data.length === 0) {
      alert("⚠️ ALERTA: O pedido NÃO foi excluído. Verifique as permissões de DELETE no Supabase.");
      setOrderToDelete(null);
      return;
    }
    
    setOrders(orders.filter(o => o.id !== orderToDelete.id));
    setSaved(true);
    setOrderToDelete(null);
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

  const saveConfiguration = async () => {
    setSaved(false);
    
    const settings = [
      { key: 'queridinhas_ids', value: JSON.stringify(queridinhasIds) },
      { key: 'best_seller_id', value: JSON.stringify(bestSellerId) },
      { key: 'catalog_ids', value: JSON.stringify(catalogIds) }
    ];

    const { error } = await supabase.from('store_settings').upsert(settings, { onConflict: 'key' });
    
    if (error) {
      console.error("❌ Erro ao salvar configurações:", error);
      // Fallback manual caso upsert falhe
      let success = true;
      for (const s of settings) {
        const { error: singleError } = await supabase.from('store_settings').upsert(s, { onConflict: 'key' });
        if (singleError) {
          success = false;
          console.error(`❌ Erro individual (${s.key}):`, singleError);
        }
      }
      
      if (!success) {
        showAlert("Erro Parcial", "Algumas configurações não puderam ser salvas no banco. Verifique o console.");
      } else {
        setSaved(true);
      }
    } else {
      console.log("✅ Configurações salvas com sucesso no Supabase.");
      setSaved(true);
    }
    
    setTimeout(() => setSaved(false), 3000);
  };

  const cleanOrphanedIds = () => {
    const validIds = new Set(products.map(p => String(p.id)));
    const invalidCountQ = queridinhasIds.filter(id => !validIds.has(String(id))).length;
    const invalidCountC = catalogIds.filter(id => !validIds.has(String(id))).length;

    if (invalidCountQ === 0 && invalidCountC === 0) {
      showAlert("Tudo em Ordem", "Não foram encontrados IDs órfãos em suas listas.");
      return;
    }

    const newQueridinhas = queridinhasIds.filter(id => validIds.has(String(id)));
    const newCatalog = catalogIds.filter(id => validIds.has(String(id)));
    
    setQueridinhasIds(newQueridinhas);
    setCatalogIds(newCatalog);
    setSaved(false);
    showAlert("Reparo Concluído", `Removidos ${invalidCountQ + invalidCountC} IDs inválidos. Note que as alterações só serão permanentes após clicar em 'Publicar Alterações'.`);
  };

  const handleAutoFill = (productState, setter) => {
    if (!productState.name) return;
    const lowerName = productState.name.toLowerCase();
    let updates = {};
    
    // Identifica Versão
    if (lowerName.includes('jogador') || lowerName.includes('player')) updates.version = 'Jogador';
    else if (lowerName.includes('retrô') || lowerName.includes('retro')) updates.version = 'Retrô';
    else updates.version = 'Torcedor';
    
    // Identifica Time e Liga
    if (teams && teams.length > 0) {
      const matchedTeam = [...teams].sort((a,b) => b.name.length - a.name.length).find(t => lowerName.includes(t.name.toLowerCase()));
      if (matchedTeam) {
         updates.team = matchedTeam.name;
         updates.league = matchedTeam.league;
         // Categorias oficiais ['Seleções', 'Brasileirão', 'Internacionais', 'Lançamentos', 'Retrô']
         if (matchedTeam.league === 'Brasileirão' || matchedTeam.league === 'Seleções') {
             updates.category = matchedTeam.league;
         } else {
             updates.category = 'Internacionais';
         }
      } else {
         if (lowerName.includes('seleção') || lowerName.includes('selecao') || lowerName.includes('espanha') || lowerName.includes('argentina') || lowerName.includes('brasil')) {
            updates.category = 'Seleções';
            updates.league = 'Seleções';
         }
      }
    }
    
    setter({ ...productState, ...updates });
  };

  // BUSCADOR UNIVERSAL
  const getUniversalProduct = (idStr) => {
    if (!idStr) return null;
    const sId = String(idStr);
    return products.find(p => String(p.id) === sId);
  }
  
  const bestSellerName = bestSellerId ? (getUniversalProduct(bestSellerId)?.name || `ID: ${bestSellerId}`) : 'Nenhum Definido';

  const displayProducts = !supplierTab.startsWith('CAT_') ? (supplierTab === 'CLOUD_ALL' ? products : []) :
    products.filter(p => {
      const catTarget = supplierTab.replace('CAT_', '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pTeam = (p.team || '').toLowerCase();
      
      if (catTarget === 'brasileirão') {
        return pCat === 'brasileirão' || p.league === 'Brasileirão';
      }
      
      if (catTarget === 'seleções') {
        const isSelecao = pCat === 'seleções' || pCat === 'selecoes' || pName.includes('seleção') || pName.includes('selecao') || p.league === 'Seleções';
        return isSelecao;
      }

      if (catTarget === 'lançamentos') {
        return pCat === 'lançamentos' || pCat === 'lancamentos';
      }

      return pCat === catTarget;
    });

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
          <button 
            onClick={() => setSupplierTab('TEAMS')}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'TEAMS' ? '#10B981' : 'transparent', color: supplierTab === 'TEAMS' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'TEAMS' ? 700 : 500, transition: 'all 0.2s' }}
          >
            <Shield size={18} /> Escudos Oficiais
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
               supplierTab === 'TEAMS' ? 'Gestão de Escudos Oficiais' :
               supplierTab === 'CLOUD_ALL' ? 'Todo o Banco na Nuvem' :
 
               `${supplierTab.replace('CAT_', '')}`}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Painel Central de Gerenciamento iFooty.</p>
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
            {supplierTab === 'TEAMS' && teams.length === 0 && (
              <button 
                onClick={handleTeamsMigration} 
                disabled={isMigratingTeams}
                className="btn-primary" 
                style={{ background: '#10B981', color: '#fff' }}
              >
                <RefreshCw size={18} className={isMigratingTeams ? 'spinning' : ''} /> 
                {isMigratingTeams ? 'IMPORTANDO...' : 'IMPORTAR ESCUDOS OFICIAIS'}
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
          {/* DASHBOARD DE MÉTRICAS (Apenas nos Catálogos) */}
          {isCatalogTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', gap: '2rem', background: 'var(--surface-hover)', padding: '1.5rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', position: 'relative' }}>
                
                <div style={{ flex: 1.5 }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                    <Crown size={16} color="#FFB81C" /> O Rei (Capa da Loja)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#000', background: '#FFB81C', fontSize: '0.9rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '4px' }}>
                      {bestSellerName}
                    </span>
                    {bestSellerId && !products.find(p => String(p.id) === String(bestSellerId)) && (
                      <button onClick={() => { setBestSellerId(null); setSaved(false); }} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#EF4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Limpar Inválido</button>
                    )}
                  </div>
                </div>

                <div style={{ width: '1px', background: 'var(--border-color)' }}></div>

                <div style={{ flex: 3 }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                    <Heart size={16} color="var(--accent-color)" /> Queridinhas do Carrossel ({queridinhasIds.length}/6)
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {queridinhasIds.length === 0 ? <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma selecionada</span> : 
                      queridinhasIds.map(id => {
                        const p = getUniversalProduct(id);
                        const isInvalid = !p;
                        return (
                          <div key={id} style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.3rem 0.6rem', 
                            background: isInvalid ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.5)', 
                            border: `1px solid ${isInvalid ? '#EF4444' : 'var(--border-color)'}`, 
                            borderRadius: '4px', color: isInvalid ? '#EF4444' : '#fff' 
                          }}>
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || `ID Inválido: ${id}`}</span>
                            <button 
                              onClick={() => { setQueridinhasIds(queridinhasIds.filter(qid => qid !== id)); setSaved(false); }}
                              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div style={{ width: '1px', background: 'var(--border-color)' }}></div>

                <div style={{ flex: 1.5 }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                    <Package size={16} color="#A855F7" /> Catálogo ({catalogIds.filter(id => products.find(p => String(p.id) === String(id))).length} Válidos)
                  </h3>
                  <span style={{ color: '#fff', background: '#A855F7', fontSize: '0.9rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '4px', display: 'inline-block' }}>
                    {catalogIds.length} IDs no Total
                  </span>
                </div>
              </div>

              {/* BARRA DE FERRAMENTAS DE REPARO */}
              {(queridinhasIds.some(id => !products.find(p => String(p.id) === String(id))) || 
                catalogIds.some(id => !products.find(p => String(p.id) === String(id)))) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#EF4444' }}>
                    <AlertTriangle size={20} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Detectamos IDs de produtos que foram excluídos ou não existem mais.</span>
                  </div>
                  <button onClick={cleanOrphanedIds} className="btn-secondary" style={{ color: '#EF4444', borderColor: '#EF4444', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Limpar Todos IDs Inválidos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RENDERS CONDICIONAIS DAS ABAS ESPECIAIS */}
          {supplierTab === 'CONFIG' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
              
              {/* CONFIGURAÇÃO WHATSAPP */}
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                   <WhatsAppIcon size={24} color="#25D366" /> Contato de Vendas (WhatsApp)
                </h2>
                <form onSubmit={handleSaveWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Número Oficial da Loja</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input 
                        required 
                        type="text" 
                        value={whatsAppNumber} 
                        onChange={e => setWhatsAppNumber(e.target.value)} 
                        placeholder="Ex: 5584991847739" 
                        style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} 
                      />
                      <button type="submit" className="btn-primary" style={{ background: '#25D366', color: '#fff', padding: '0 2rem' }}>Salvar Número</button>
                    </div>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Este número será usado no botão flutuante, no Checkout e para envio de notificações aos clientes.</p>
                  </div>
                </form>
              </div>

              {/* CONFIGURAÇÃO HERO BANNER */}
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                   <Image color="#3B82F6" /> Banner da Home (Hero)
                </h2>
                
                <form onSubmit={handleSaveHeroUrl} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Upgrade: Upload de Arquivo para o Hero */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      📸 Upload de Background
                    </label>
                    <label
                      htmlFor="hero-upload"
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: `2px dashed ${heroImagePreview ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)', padding: '1.5rem', cursor: 'pointer',
                        background: heroImagePreview ? 'rgba(164,210,51,0.05)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                      }}
                    >
                      <input
                        id="hero-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setHeroImageFile(file);
                            setHeroImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {heroImagePreview ? (
                        <div style={{ width: '100%', textAlign: 'center' }}>
                          <img src={heroImagePreview} alt="Preview" style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700 }}>✅ Imagem selecionada</p>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                          <p style={{ fontSize: '0.85rem', color: '#fff' }}>Arraste o novo banner aqui</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ou use uma URL externa</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>URL da Imagem</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input 
                        type="url" 
                        value={heroUrl} 
                        onChange={e => { setHeroUrl(e.target.value); if(e.target.value) { setHeroImageFile(null); setHeroImagePreview(null); } }} 
                        placeholder="Ex: https://..." 
                        style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} 
                      />
                      <button type="submit" disabled={isUploading} className="btn-primary" style={{ background: '#3B82F6', color: '#fff', padding: '0 2rem' }}>
                        {isUploading ? 'Salvando...' : 'Atualizar Banner'}
                      </button>
                    </div>
                  </div>
                </form>
                
                {(heroUrl || heroImagePreview) && (
                  <div style={{ marginTop: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Preview em Tempo Real:</h3>
                    <div style={{ width: '100%', height: '300px', borderRadius: 'var(--radius-md)', background: `url(${heroImagePreview || heroUrl}) center/cover no-repeat`, border: '1px solid var(--border-color)' }}></div>
                  </div>
                )}
              </div>
            </div>
          ) : supplierTab === 'TEAMS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* ALERTA DE TABELA AUSENTE */}
              {teams.length === 0 && !isMigratingTeams && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid #EF4444', textAlign: 'center' }}>
                  <Shield size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Tabela de Escudos não encontrada</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                    Parece que você ainda não executou o script SQL no Supabase. Para gerenciar os escudos, clique no botão abaixo para tentar criar e importar os dados iniciais.
                  </p>
                  <button 
                    onClick={handleTeamsMigration} 
                    className="btn-primary" 
                    style={{ background: '#EF4444', color: '#fff' }}
                  >
                    <RefreshCw size={18} className={isMigratingTeams ? 'spinning' : ''} /> 
                    {isMigratingTeams ? 'CONFIGURANDO...' : 'CONFIGURAR BANCO DE ESCUDOS'}
                  </button>
                </div>
              )}

              {teams.length > 0 && (
                <>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
                    <p style={{ color: '#10B981', fontSize: '0.9rem', margin: 0 }}>
                      <strong>Dica Profissional:</strong> Você pode usar URLs da Wikipedia (Wikimedia) ou subir seus próprios logos no Storage. Os logos aqui definidos aparecem nos filtros e carrosséis da loja.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {teams.map(team => (
                      <div key={team.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                          <img src={team.logo} alt={team.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>{team.name}</h4>
                          <button 
                            onClick={() => setEditingTeam(team)}
                            style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Trocar Escudo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {editingTeam && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zInex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(10px)' }}>
                  <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '500px' }}>
                    <h2 style={{ color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <Shield color="var(--accent-color)" /> Alterar Escudo: {editingTeam.name}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>URL do Novo Escudo (SVG ou PNG c/ transparência)</label>
                        <input 
                          type="url" 
                          value={editingTeam.logo} 
                          onChange={e => setEditingTeam({...editingTeam, logo: e.target.value})}
                          placeholder="https://..." 
                          style={{ width: '100%', padding: '1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        />
                      </div>
                      
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PREVIEW NO FUNDO ESCURO:</span>
                        <div style={{ width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={editingTeam.logo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                      </div>
                      
                      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#000' }}>PREVIEW NO FUNDO BRANCO:</span>
                        <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={editingTeam.logo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setEditingTeam(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Cancelar</button>
                        <button 
                          onClick={async () => {
                            const { error } = await supabase.from('teams').update({ logo: editingTeam.logo }).eq('id', editingTeam.id);
                            if (error) showAlert('Erro', error.message);
                            else {
                              showAlert('Sucesso', 'Escudo atualizado com sucesso!');
                              setTeams(teams.map(t => t.id === editingTeam.id ? editingTeam : t));
                              setEditingTeam(null);
                            }
                          }}
                          style={{ flex: 1, padding: '1rem', background: 'var(--accent-color)', color: '#000', fontWeight: 800, border: 'none', borderRadius: '4px' }}
                        >
                          Salvar Alteração
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.name} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-color)' }} />
                        ) : (
                          <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-color), #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: '1rem' }}>
                            {t.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>{t.name}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.location} • {new Date(t.date).toLocaleDateString()}</p>
                        </div>
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
          ) : supplierTab === 'PEDIDOS' ? (() => {
            const filteredOrders = orders.filter(o => {
              const orderDate = new Date(o.created_at).toISOString().split('T')[0];
              const matchesDate = (!dateRange.start || orderDate >= dateRange.start) &&
                                  (!dateRange.end || orderDate <= dateRange.end);
              const matchesStatus = statusFilter === 'all' || 
                                    (statusFilter === 'completed' ? ['shipped', 'completed'].includes(o.status) : o.status === statusFilter);
              const matchesCustomer = !orderFilter || o.user_id === orderFilter;
              return matchesDate && matchesStatus && matchesCustomer;
            });

            const totalRevenue = filteredOrders.reduce((acc, o) => acc + Number(o.total_price || 0), 0);
            const totalCost = filteredOrders.reduce((acc, order) => acc + calculateOrderCost(order), 0);
            const totalProfit = totalRevenue - totalCost;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px' }}>
                
                {/* DATE FILTER CONTROLS */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 800, textTransform: 'uppercase' }}>De:</label>
                    <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 800, textTransform: 'uppercase' }}>Até:</label>
                    <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                  </div>
                  <button onClick={() => { setDateRange({start: '', end: ''}); setStatusFilter('all'); setOrderFilter(null); }} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Limpar Filtros</button>
                </div>

                {/* STATS SUMMARY BAR */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                  <div 
                    onClick={() => setStatusFilter('all')} 
                    className="glass-panel" 
                    style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #fff', cursor: 'pointer', outline: statusFilter === 'all' ? '2px solid rgba(255,255,255,0.3)' : 'none', opacity: statusFilter === 'all' ? 1 : 0.6 }}
                  >
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Total Pedidos</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>{filteredOrders.length}</h3>
                  </div>
                  <div 
                    onClick={() => setStatusFilter('pending')} 
                    className="glass-panel" 
                    style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #FFB81C', cursor: 'pointer', outline: statusFilter === 'pending' ? '2px solid #FFB81C' : 'none', opacity: statusFilter === 'pending' ? 1 : statusFilter === 'all' ? 1 : 0.6 }}
                  >
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Novos</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>{filteredOrders.filter(o => o.status === 'pending').length}</h3>
                  </div>
                  <div 
                    onClick={() => setStatusFilter('processing')} 
                    className="glass-panel" 
                    style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #3B82F6', cursor: 'pointer', outline: statusFilter === 'processing' ? '2px solid #3B82F6' : 'none', opacity: statusFilter === 'processing' ? 1 : statusFilter === 'all' ? 1 : 0.6 }}
                  >
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Preparação</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>{filteredOrders.filter(o => o.status === 'processing').length}</h3>
                  </div>
                  <div 
                    onClick={() => setStatusFilter('completed')} 
                    className="glass-panel" 
                    style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #10B981', cursor: 'pointer', outline: statusFilter === 'completed' ? '2px solid #10B981' : 'none', opacity: statusFilter === 'completed' ? 1 : statusFilter === 'all' ? 1 : 0.6 }}
                  >
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Concluídos</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>{filteredOrders.filter(o => ['shipped', 'completed'].includes(o.status)).length}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Receita</p>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', margin: 0 }}>${totalRevenue.toFixed(2)}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #64748b' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Custo</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>${totalCost.toFixed(2)}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #22c55e' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Lucro</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#22c55e', margin: 0 }}>${totalProfit.toFixed(2)}</h3>
                  </div>
                </div>

                {orderFilter && (
                  <div style={{ background: 'rgba(164, 210, 51, 0.1)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid var(--accent-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <p style={{ margin: 0, fontWeight: 700, color: 'var(--accent-color)', fontSize: '0.9rem' }}>
                       Filtro Ativo: Clientes {customers.find(c => c.id === orderFilter)?.full_name || '...'}
                     </p>
                     <button onClick={() => setOrderFilter(null)} style={{ background: 'var(--accent-color)', color: '#000', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>Limpar Filtro</button>
                  </div>
                )}

              {/* TABLE LIST VIEW */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* TABLE HEADER */}
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 100px 150px 40px', padding: '0.8rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <span>REF</span>
                  <span>CLIENTE</span>
                  <span>DATA</span>
                  <span>TOTAL</span>
                  <span>STATUS</span>
                  <span></span>
                </div>

                {filteredOrders.map(order => {
                  const isExpanded = expandedOrderId === order.id;
                  const statusColors = {
                    pending: '#FFB81C',
                    processing: '#3B82F6',
                    shipped: '#10B981',
                    completed: '#A855F7',
                    cancelled: '#EF4444'
                  };
                  const statusLabels = {
                    pending: 'Pendente',
                    processing: 'Preparando',
                    shipped: 'Enviado',
                    completed: 'Finalizado',
                    cancelled: 'Cancelado'
                  };

                  return (
                    <div key={order.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* SUMMARY ROW */}
                      <div 
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '80px 1.5fr 1fr 100px 150px 40px', 
                          padding: '1.2rem 1.5rem', 
                          background: isExpanded ? 'rgba(255,255,255,0.05)' : 'var(--surface-color)', 
                          borderRadius: '8px', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          border: isExpanded ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                          transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
                          marginBottom: isExpanded ? '0' : '0.2rem'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>#{order.id.slice(0,5)}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#fff' }}>{order.customer_name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customer_email}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                        <span style={{ fontWeight: 800, color: 'var(--accent-color)' }}>${Number(order.total_price).toFixed(2)}</span>
                        <div>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            background: `${statusColors[order.status] || '#eee'}22`, 
                            color: statusColors[order.status] || '#eee',
                            border: `1px solid ${statusColors[order.status] || '#eee'}44`,
                            fontWeight: 900,
                            textTransform: 'uppercase'
                          }}>
                            {statusLabels[order.status]}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* EXPANDED CONTENT */}
                      {isExpanded && (
                        <div style={{ 
                          background: 'rgba(0,0,0,0.2)', 
                          padding: '2rem 1.5rem', 
                          borderRadius: '0 0 8px 8px', 
                          border: '1px solid var(--accent-color)',
                          borderTop: 'none',
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr',
                          gap: '2rem',
                          animation: 'slideDown 0.3s ease-out'
                        }}>
                          {/* LEFT: ITEMS & ADDRESS */}
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Itens do Pedido</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                              {order.items?.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                   <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Package size={20} color="var(--text-muted)" />
                                   </div>
                                   <div style={{ flex: 1 }}>
                                      <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{item.quantity}x {item.name}</p>
                                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tamanho: {item.size}</p>
                                      {item.extras?.customization && (
                                        <p style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: 800 }}>Custom: {item.extras.customization.name} / {item.extras.customization.number}</p>
                                      )}
                                   </div>
                                </div>
                              ))}
                            </div>

                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Endereço de Entrega</p>
                            <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                               <p>{order.shipping_address?.street}{order.shipping_address?.apartment ? `, Apt ${order.shipping_address.apartment}` : ''}</p>
                               <p>{order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postalCode}</p>
                               <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}><MapPin size={12} /> {order.customer_phone}</p>
                            </div>
                          </div>

                          {/* RIGHT: ACTIONS */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Gestão de Status</p>
                            <select 
                              value={order.status} 
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                            >
                              <option value="pending">🟡 Pendente</option>
                              <option value="processing">🔵 Preparando</option>
                              <option value="shipped">🟢 Enviado</option>
                              <option value="completed">✅ Finalizado</option>
                              <option value="cancelled">🔴 Cancelado</option>
                            </select>

                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '1rem' }}>Ações Rápidas (Auto-Sync)</p>
                            <button 
                              onClick={() => sendWhatsAppStatus(order, 'processing')}
                              style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid #3B82F6', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              MARCAR COMO PREPARANDO
                            </button>
                            <button 
                              onClick={() => sendWhatsAppStatus(order, 'shipped')}
                              style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid #10B981', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              MARCAR COMO ENVIADO
                            </button>
                            <button 
                              onClick={() => sendWhatsAppStatus(order, 'completed')}
                              style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', border: '1px solid #A855F7', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              MARCAR COMO ENTREGUE
                            </button>
                            <button 
                              onClick={() => setOrderToDelete(order)}
                              style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', marginTop: '1rem' }}
                            >
                              <Trash2 size={14} style={{ marginRight: '0.5rem' }} /> EXCLUIR PEDIDO
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

                {filteredOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                     <Package size={48} style={{ marginBottom: '1rem' }} />
                     <p>Nenhum pedido encontrado no período ou status selecionado.</p>
                  </div>
                )}
              </div>
            );
          })()
            : supplierTab === 'CLIENTES' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1000px' }}>
              {customers.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                    <Users size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Nenhum usuário espelhado</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Os clientes cadastrados via Google demoram alguns minutos para serem sincronizados.</p>
                 </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* HEADER */}
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1.5fr 1.5fr 100px 40px', padding: '0.8rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    <span></span>
                    <span>Nome Completo</span>
                    <span>E-mail</span>
                    <span>Pedidos</span>
                    <span></span>
                  </div>

                  {customers.map(customer => {
                    const isExpanded = expandedCustomerId === customer.id;
                    const customerOrders = orders.filter(o => o.user_id === customer.id);
                    
                    return (
                      <div key={customer.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* SUMMARY ROW */}
                        <div 
                          onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                          style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '60px 1.5fr 1.5fr 100px 40px', 
                            padding: '1rem 1.5rem', 
                            background: isExpanded ? 'rgba(255,255,255,0.05)' : 'var(--surface-color)', 
                            borderRadius: '8px', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            border: isExpanded ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                            transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
                            marginBottom: isExpanded ? '0' : '0.2rem'
                          }} 
                        >
                          <img src={customer.avatar_url || 'https://via.placeholder.com/40'} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <span style={{ fontWeight: 700, color: '#fff' }}>{customer.full_name || 'Usuário'}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{customer.email}</span>
                          <div>
                            <span style={{ fontSize: '0.7rem', background: 'var(--accent-color)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>{customerOrders.length}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>

                        {/* EXPANDED CONTENT */}
                        {isExpanded && (
                          <div style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            padding: '1.5rem', 
                            borderRadius: '0 0 8px 8px', 
                            border: '1px solid var(--accent-color)',
                            borderTop: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            animation: 'slideDown 0.3s ease-out'
                          }}>
                            <div>
                               <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Endereço Registrado</p>
                               {customer.street ? (
                                 <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                                    <p>{customer.street}{customer.apartment ? `, Apt ${customer.apartment}` : ''}</p>
                                    <p>{customer.city}, {customer.province} {customer.postal_code}</p>
                                 </div>
                               ) : (
                                 <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum endereço cadastrado para este perfil.</p>
                               )}
                            </div>
                            
                            <button 
                              onClick={(e) => { e.stopPropagation(); setOrderFilter(customer.id); setSupplierTab('PEDIDOS'); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                              <ExternalLink size={16} /> Ver Histórico de Pedidos
                            </button>
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
                    <div style={{ display:'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                      <span style={{ maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>REF: {sId}</span>
                      {product.team && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          <img 
                            src={teams.find(t => t.name === product.team)?.logo} 
                            alt="" 
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }} 
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                          <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.65rem' }}>{product.team}</span>
                        </div>
                      )}
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
                            onClick={() => {
                              const productToEdit = { ...product };
                              setEditingProduct(productToEdit);
                            }}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome da Camisa *</label>
                  <button 
                    type="button" 
                    onClick={() => handleAutoFill(newProduct, setNewProduct)}
                    style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#D8B4FE', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    🪄 Autopreencher Info
                  </button>
                </div>
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
                  <select 
                    value={newProduct.league} 
                    onChange={e => setNewProduct({...newProduct, league: e.target.value})} 
                    style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">Selecione a Liga...</option>
                    {OFFICIAL_LEAGUES.map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Time</label>
                      <select 
                        value={newProduct.team} 
                        onChange={e => setNewProduct({...newProduct, team: e.target.value})} 
                        style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <option value="">Nacional / Outros</option>
                        {teams
                          .filter(team => !newProduct.league || team.league === newProduct.league)
                          .map(team => (
                            <option key={team.id} value={team.name}>{team.name}</option>
                          ))
                        }
                      </select>
                    </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={newProduct.is_bestseller} 
                    onChange={e => setNewProduct({...newProduct, is_bestseller: e.target.checked})}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#EF4444' }}
                  />
                  Mais Vendido 🔥
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={newProduct.is_new} 
                    onChange={e => setNewProduct({...newProduct, is_new: e.target.checked})}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#FFB81C' }}
                  />
                  Novo ⭐
                </label>
              </div>

              {/* === UPLOAD DE IMAGEM === */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  📸 Imagem do Produto
                </label>

                {/* Área de Drop / Click */}
                <label
                  htmlFor="image-upload-new"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: `2px dashed ${imagePreview ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)', padding: '1.5rem', cursor: 'pointer',
                    background: imagePreview ? 'rgba(164,210,51,0.05)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s', marginBottom: '0.75rem', position: 'relative', overflow: 'hidden'
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = imagePreview ? 'var(--accent-color)' : 'var(--border-color)'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                      setNewProduct({...newProduct, image: ''});
                    }
                  }}
                >
                  <input
                    id="image-upload-new"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                        setNewProduct({...newProduct, image: ''});
                      }
                    }}
                  />
                  {imagePreview ? (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700 }}>✅ Imagem pronta para upload</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{imageFile?.name}</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Clique ou arraste uma imagem aqui</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>PNG, JPG, WEBP — upload direto para o Supabase</p>
                    </div>
                  )}
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}
                  >
                    🗑️ Remover imagem selecionada
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ou cole uma URL externa</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={e => { setNewProduct({...newProduct, image: e.target.value}); if(e.target.value) { setImageFile(null); setImagePreview(null); } }}
                  placeholder="Ex: https://i.imgur.com/foto.jpg"
                  disabled={!!imageFile}
                  style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: imageFile ? 'var(--text-muted)' : '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', opacity: imageFile ? 0.5 : 1 }}
                />
                {!imageFile && !newProduct.image && (
                  <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#EF4444' }}>⚠️ Selecione um arquivo ou cole uma URL</p>
                )}
              </div>

              {/* === GALERIA DE IMAGENS (OPCIONAL) === */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>
                  🖼️ Galeria de Imagens (Máx 5 fotos extras)
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  {galleryPreviews.map((prev, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--surface-color)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={prev} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery preview" />
                      <button 
                        type="button"
                        onClick={() => {
                          const newFiles = [...galleryFiles];
                          const newPrevs = [...galleryPreviews];
                          newFiles.splice(idx, 1);
                          newPrevs.splice(idx, 1);
                          setGalleryFiles(newFiles);
                          setGalleryPreviews(newPrevs);
                        }}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', padding: '2px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {galleryFiles.length < 5 && (
                    <label style={{ width: '100%', aspectRatio: '1/1', border: '2px dashed var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          const spaceLeft = 5 - galleryFiles.length;
                          const newFiles = files.slice(0, spaceLeft);
                          const newPreviews = newFiles.map(f => URL.createObjectURL(f));
                          setGalleryFiles([...galleryFiles, ...newFiles]);
                          setGalleryPreviews([...galleryPreviews, ...newPreviews]);
                        }}
                      />
                      <Plus size={20} color="var(--text-muted)" />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading || (!imageFile && !newProduct.image)}
                style={{ marginTop: '1.5rem', padding: '1.2rem', background: isUploading ? '#555' : '#10B981', color: '#fff', fontWeight: 800, borderRadius: 'var(--radius-md)', border: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '1rem', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isUploading ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Fazendo upload...
                  </>
                ) : 'INSERIR NO BANCO'}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>URL da Foto do Cliente (Opcional)</label>
                <input type="url" value={newTestimonial.avatar_url} onChange={e => setNewTestimonial({...newTestimonial, avatar_url: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nome da Camisa *</label>
                  <button 
                    type="button" 
                    onClick={() => handleAutoFill(editingProduct, setEditingProduct)}
                    style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#D8B4FE', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    🪄 Autopreencher Info
                  </button>
                </div>
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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Versão *</label>
                  <select required value={editingProduct.version} onChange={e => setEditingProduct({...editingProduct, version: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="">Selecione...</option>
                    <option value="Torcedor">Torcedor</option>
                    <option value="Jogador">Jogador</option>
                    <option value="Retrô">Retrô</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Categoria *</label>
                  <select required value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="">Selecione...</option>
                    {OFFICIAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Liga</label>
                  <select 
                    value={editingProduct.league} 
                    onChange={e => setEditingProduct({...editingProduct, league: e.target.value})} 
                    style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">Selecione a Liga...</option>
                    {OFFICIAL_LEAGUES.map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Time</label>
                  <select 
                    value={editingProduct.team} 
                    onChange={e => setEditingProduct({...editingProduct, team: e.target.value})} 
                    style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">Nacional / Outros</option>
                    {teams
                      .filter(team => !editingProduct.league || team.league === editingProduct.league)
                      .map(team => (
                        <option key={team.id} value={team.name}>{team.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={editingProduct.is_bestseller} 
                    onChange={e => setEditingProduct({...editingProduct, is_bestseller: e.target.checked})}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#EF4444' }}
                  />
                  Mais Vendido 🔥
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={editingProduct.is_new} 
                    onChange={e => setEditingProduct({...editingProduct, is_new: e.target.checked})}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#FFB81C' }}
                  />
                  Novo ⭐
                </label>
              </div>

              {/* === UPLOAD DE IMAGEM (EDIÇÃO) === */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  📸 Imagem do Produto
                </label>

                {/* Preview da imagem atual */}
                {editingProduct.image && !editImagePreview && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={editingProduct.image}
                      alt="Atual"
                      style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px', background: 'rgba(0,0,0,0.2)' }}
                      onError={(e) => { e.target.src = '/camisas/placeholder.png'; }}
                    />
                    <div>
                      <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Imagem atual</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', wordBreak: 'break-all', maxWidth: '300px' }}>{(editingProduct.image || '').slice(0, 60)}{(editingProduct.image || '').length > 60 ? '...' : ''}</p>
                    </div>
                  </div>
                )}

                {/* Área de Drop / Click */}
                <label
                  htmlFor="image-upload-edit"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: `2px dashed ${editImagePreview ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)', padding: '1.2rem', cursor: 'pointer',
                    background: editImagePreview ? 'rgba(164,210,51,0.05)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s', marginBottom: '0.75rem'
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = editImagePreview ? 'var(--accent-color)' : 'var(--border-color)'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setEditImageFile(file);
                      setEditImagePreview(URL.createObjectURL(file));
                    }
                  }}
                >
                  <input
                    id="image-upload-edit"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditImageFile(file);
                        setEditImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {editImagePreview ? (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <img src={editImagePreview} alt="Preview" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700 }}>✅ Nova imagem pronta para upload</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🔄</div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>Clique para substituir a imagem</p>
                      <p style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>Upload direto para o Supabase Storage</p>
                    </div>
                  )}
                </label>

                {editImagePreview && (
                  <button
                    type="button"
                    onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}
                  >
                    🗑️ Cancelar nova imagem
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ou edite a URL diretamente</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>
                <input
                  type="text"
                  value={editImageFile ? '(arquivo selecionado para upload)' : editingProduct.image}
                  onChange={e => !editImageFile && setEditingProduct({...editingProduct, image: e.target.value})}
                  disabled={!!editImageFile}
                  style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: editImageFile ? 'var(--text-muted)' : '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', opacity: editImageFile ? 0.5 : 1 }}
                />

                {/* === GALERIA NA EDIÇÃO === */}
                <div style={{ marginTop: '1.2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
                    🖼️ Galeria Atual / Nova (Máx 5 total)
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    {/* Imagens Reais do Banco */}
                    {(editingProduct.gallery || []).map((img, idx) => (
                      <div key={`real-${idx}`} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--surface-color)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--accent-color)' }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery" />
                        <button 
                          type="button"
                          onClick={() => {
                            const newGal = [...editingProduct.gallery];
                            newGal.splice(idx, 1);
                            setEditingProduct({...editingProduct, gallery: newGal});
                          }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', padding: '2px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    
                    {/* Novos Previews (Upload Pendente) */}
                    {editGalleryPreviews.map((prev, idx) => (
                      <div key={`new-${idx}`} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--surface-color)', borderRadius: '4px', border: '1px dashed var(--accent-color)', overflow: 'hidden' }}>
                        <img src={prev} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="New preview" />
                        <button 
                          type="button"
                          onClick={() => {
                            const newFiles = [...editGalleryFiles];
                            const newPrevs = [...editGalleryPreviews];
                            newFiles.splice(idx, 1);
                            newPrevs.splice(idx, 1);
                            setEditGalleryFiles(newFiles);
                            setEditGalleryPreviews(newPrevs);
                          }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', padding: '2px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {( (editingProduct.gallery || []).length + editGalleryFiles.length ) < 5 && (
                      <label style={{ width: '100%', aspectRatio: '1/1', border: '2px dashed var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            const currentTotal = (editingProduct.gallery || []).length + editGalleryFiles.length;
                            const spaceLeft = 5 - currentTotal;
                            const newFiles = files.slice(0, spaceLeft);
                            const newPreviews = newFiles.map(f => URL.createObjectURL(f));
                            setEditGalleryFiles([...editGalleryFiles, ...newFiles]);
                            setEditGalleryPreviews([...editGalleryPreviews, ...newPreviews]);
                          }}
                        />
                        <Plus size={20} color="var(--text-muted)" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => { setEditingProduct(null); setEditImageFile(null); setEditImagePreview(null); }} style={{ flex: 1, padding: '1.2rem', background: 'var(--bg-color)', color: '#fff', fontWeight: 600, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    style={{ flex: 1, padding: '1.2rem', background: isUploading ? '#555' : '#3B82F6', color: '#fff', fontWeight: 800, borderRadius: 'var(--radius-md)', border: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {isUploading ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Salvando...
                      </>
                    ) : 'SALVAR ALTERAÇÕES'}
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

      {orderToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid #EF4444', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 20px 50px rgba(239, 68, 68, 0.3)' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#EF4444' }}>
              <AlertTriangle size={35} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Excluir Pedido?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>Tem certeza que deseja apagar este pedido? Esta ação removerá os dados do banco permanentemente e afetará as estatísticas do painel.</p>
            <strong style={{ color: '#EF4444', marginBottom: '2.5rem', display: 'block', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-sm)', width: '100%' }}>Pedido #{orderToDelete.id.slice(0,8)} - {orderToDelete.customer_name}</strong>
            
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button onClick={() => setOrderToDelete(null)} style={{ flex: 1, padding: '1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
                Cancelar
              </button>
              <button onClick={confirmDeleteOrder} style={{ flex: 1, padding: '1rem', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 800 }}>
                CONFIRMAR EXCLUSÃO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SISTEMA (ALERT/CONFIRM) */}
      {/* MANAGER WELCOME POPUP */}
      {showWelcomePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '24px', maxWidth: '500px', width: '100%', border: '1px solid var(--accent-color)', textAlign: 'center', boxShadow: '0 0 50px rgba(164, 210, 51, 0.2)', animation: 'modalIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(164, 210, 51, 0.1)', padding: '1.5rem', borderRadius: '50%', border: '1px solid rgba(164, 210, 51, 0.3)' }}>
                <Package size={64} color="var(--accent-color)" />
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Olá, Gestor! 👋</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
               Identificamos <strong style={{ color: 'var(--accent-color)' }}>{orders.filter(o => o.status === 'pending').length} novos pedidos</strong> aguardando atenção. Vamos despachar esses mantos?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '1.2rem', fontSize: '1.1rem', width: '100%' }}
                onClick={() => { setSupplierTab('PEDIDOS'); setShowWelcomePopup(false); }}
              >
                Ver Pedidos Agora
              </button>
              <button 
                onClick={() => setShowWelcomePopup(false)}
                style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Depois eu vejo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PADRÃO DE ALERTAS */}
      {modal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: modal.type === 'confirm' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,184,28,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: modal.type === 'confirm' ? '#3B82F6' : '#FFB81C' }}>
                <Check size={20} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{modal.title}</h2>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              {modal.message}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {modal.type === 'confirm' && (
                <button 
                  onClick={() => setModal({ ...modal, show: false })}
                  style={{ flex: 1, padding: '1rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  setModal({ ...modal, show: false });
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '1rem', background: modal.type === 'confirm' ? '#3B82F6' : 'var(--accent-color)', color: modal.type === 'confirm' ? '#fff' : '#000', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 800, cursor: 'pointer' }}
              >
                {modal.type === 'confirm' ? 'Confirmar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

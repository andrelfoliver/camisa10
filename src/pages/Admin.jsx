import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Save, Check, Crown, Heart, Database, HardDrive, Star, LogOut, Package, Plus, Trash2, Edit, X, Users, Image, DollarSign, MapPin, RefreshCw, Shield, AlertTriangle, MessageSquare, ChevronDown, ChevronUp, MoreHorizontal, ExternalLink, Settings, Tag, TrendingUp, Truck, BarChart } from 'lucide-react';
import { migrateProductsToSupabase } from '../services/migration';
import { migrateTeamsToSupabase } from '../services/migration_teams';
import WhatsAppIcon from '../components/WhatsAppIcon';
import ProductMedia from '../components/ProductMedia';
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
  const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '16', '18', '20', '22', '24', '26', '28'];
  const DEFAULT_INVENTORY = { 'S': 0, 'M': 0, 'L': 0, 'XL': 0, '2XL': 0, '3XL': 0, '4XL': 0, '16': 0, '18': 0, '20': 0, '22': 0, '24': 0, '26': 0, '28': 0 };
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
  const [supplierTab, setSupplierTab] = useState('PEDIDOS');
  const [showAddForm, setShowAddForm] = useState(false);

  const [productToDelete, setProductToDelete] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockSubTab, setStockSubTab] = useState('ADULTO');


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
        inventory: rest.inventory || { ...DEFAULT_INVENTORY },
        unavailable_sizes: rest.unavailable_sizes || [],
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
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '', category: '', league: '', team: '', version: '', is_bestseller: false, is_new: false, inventory: { ...DEFAULT_INVENTORY }, unavailable_sizes: [] });
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
  const [heroSlides, setHeroSlides] = useState([]);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState('17788061419');
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
    ],
    shippingCost: 0,
    freeShippingThreshold: 0,
    promoBasePrice: 47.90,
    exchangeRateFallback: 1.38,
    costFan: 9.00,
    costPlayer: 15.00,
    costRetro: 15.00,
    costLongSleeve: 12.00,
    costKids: 11.00,
    costBaby: 8.00,
    costTraining: 17.00,
    costShorts: 8.00,
    costNBA: 17.00,
    costNFL: 23.00,
    costAdd2XL: 1.00,
    costAdd3XL4XL: 2.00,
    costAddPatch: 1.00,
    costAddCustom: 3.00,
    surcharge1Item: 5.00,
    surcharge2Items: 4.00,
    surcharge3Items: 3.00,
    affiliateDriveLink: ""
  };
  const [pricing, setPricing] = useState(defaultPricing);
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState(5.00);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState('fixed'); // 'fixed' ou 'percent'
  const [orderFilter, setOrderFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [coupons, setCoupons] = useState([]);
  const [commissionRate, setCommissionRate] = useState(8);
  const [discountRate, setDiscountRate] = useState(5);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', agent_id: '', discount_percent: 5 });
  const [agentSearch, setAgentSearch] = useState('');
  const [showAgentResults, setShowAgentResults] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomeTriggered, setWelcomeTriggered] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);

  // Filtros do Relatório de Produtividade
  const [prodDateRange, setProdDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [prodAgentFilter, setProdAgentFilter] = useState('');


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
      if (data) setProducts(data);
      setLoading(false);
    }

    async function loadCustomers() {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) console.error("Erro ao buscar profiles:", error.message);
      if (data) setCustomers(data);
    }


    async function loadSettings() {
      const { data: heroData } = await supabase.from('store_settings').select('value').eq('key', 'hero_bg').single();
      if (heroData) setHeroUrl(heroData.value);

      const { data: pricingData } = await supabase.from('store_settings').select('value').eq('key', 'pricing').single();
      if (pricingData && pricingData.value) {
        try {
          const parsed = JSON.parse(pricingData.value);
          setPricing(parsed);
        } catch (e) { }
      }

      // Novas configurações na nuvem
      const { data: cloudSettings } = await supabase.from('store_settings').select('*').in('key', ['queridinhas_ids', 'best_seller_id', 'catalog_ids', 'whatsapp_number', 'hero_slides']);
      if (cloudSettings) {
        cloudSettings.forEach(s => {
          try {
            if (s.key === 'whatsapp_number') {
              setWhatsAppNumber(s.value);
              return;
            }
            const val = JSON.parse(s.value);
            if (s.key === 'queridinhas_ids' && Array.isArray(val)) {
              setQueridinhasIds(val.map(String));
            }
            if (s.key === 'best_seller_id' && val) {
              setBestSellerId(String(val));
            }
            if (s.key === 'catalog_ids' && Array.isArray(val)) {
              setCatalogIds(val.map(String));
            }
            if (s.key === 'hero_slides' && Array.isArray(val)) {
              setHeroSlides(val);
            }
            if (s.key === 'agent_commission_percent') setCommissionRate(Number(s.value));
            if (s.key === 'agent_discount_percent') setDiscountRate(Number(s.value));
          } catch (e) { }
        });
      }
    }

    async function loadCoupons() {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (data) setCoupons(data);
    }


    async function loadTestimonials() {
      const { data } = await supabase.from('testimonials').select('*').order('date', { ascending: false });
      if (data) setTestimonials(data);
    }

    async function loadOrders() {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) {
        setOrders(data);

        // Trigger Welcome Popup for Manager
        if (!welcomeTriggered && user?.email === 'camisadez085@gmail.com') {
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
      loadCoupons();
    }
  }, [isAdmin, user]);


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

  const handleCleanOrphanedImages = async () => {
    showConfirm(
      'Limpeza de Storage',
      'Deseja buscar e remover imagens que não estão vinculadas a nenhum produto? Isso ajudará a reduzir o consumo de dados (Egress).',
      async () => {
        setIsMigrating(true);
        try {
          // 1. Coletar todas as imagens em uso (Produtos e Galeria)
          const { data: allProducts } = await supabase.from('products').select('image, gallery');
          const usedImages = new Set();
          
          allProducts?.forEach(p => {
            if (p.image) usedImages.add(p.image.split('/').pop());
            if (p.gallery && Array.isArray(p.gallery)) {
              p.gallery.forEach(img => usedImages.add(img.split('/').pop()));
            }
          });

          // 2. Coletar imagens em uso nas Configurações (Hero Slides e Banner)
          const { data: settings } = await supabase.from('store_settings').select('value').in('key', ['hero_bg', 'hero_slides']);
          settings?.forEach(s => {
            try {
              if (s.value.startsWith('http')) {
                usedImages.add(s.value.split('/').pop());
              } else {
                const parsed = JSON.parse(s.value);
                if (Array.isArray(parsed)) parsed.forEach(img => usedImages.add(img.split('/').pop()));
              }
            } catch(e) {}
          });

          // 3. Listar arquivos no Storage
          const { data: storageFiles, error: storageError } = await supabase.storage.from('product-images').list('', { limit: 1000 });
          if (storageError) throw storageError;

          // 4. Identificar órfãos
          const orphans = storageFiles?.filter(file => !usedImages.has(file.name)) || [];

          if (orphans.length === 0) {
            showAlert('Tudo Limpo!', 'Não foram encontradas imagens órfãs no storage.');
            return;
          }

          // 5. Deletar órfãos
          const filesToDelete = orphans.map(f => f.name);
          const { error: deleteError } = await supabase.storage.from('product-images').remove(filesToDelete);
          
          if (deleteError) throw deleteError;

          showAlert('Sucesso na Limpeza', `${filesToDelete.length} imagens órfãs foram removidas permanentemente.`);
        } catch (err) {
          showAlert('Erro na Limpeza', err.message);
        } finally {
          setIsMigrating(false);
        }
      }
    );
  };

  const handleBulkPriceUpdate = async (multiplier = 1) => {
    const actionLabel = multiplier > 0 ? 'Aumentar' : 'Diminuir';
    showConfirm(
      'Reajuste em Massa',
      `Deseja realmenta ${actionLabel.toLowerCase()} o preço de TODOS os produtos do catálogo em ${bulkAdjustmentType === 'fixed' ? '$' : ''}${bulkAdjustmentValue}${bulkAdjustmentType === 'percent' ? '%' : ''}? Esta ação é irreversível.`,
      async () => {
        setIsMigrating(true);
        try {
          const { data: allProducts, error: fetchError } = await supabase.from('products').select('id, price');
          if (fetchError) throw fetchError;

          const updates = allProducts.map(p => {
            let newPrice;
            const currentPrice = Number(p.price);
            const val = Number(bulkAdjustmentValue) * multiplier;

            if (bulkAdjustmentType === 'fixed') {
              newPrice = currentPrice + val;
            } else {
              newPrice = currentPrice * (1 + (val / 100));
            }

            return {
              id: p.id,
              price: Number(newPrice.toFixed(2))
            };
          });

          // Atualização individual para evitar erros de NOT NULL em colunas ausentes (upsert falha em colunas obrigatórias)
          let successCount = 0;
          for (const up of updates) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ price: up.price })
              .eq('id', up.id);

            if (updateError) throw updateError;
            successCount++;
          }

          showAlert('Sucesso', `${successCount} produtos foram reajustados com sucesso!`);
          // Recarregar produtos locais
          const { data: refreshed } = await supabase.from('products').select('*').order('id', { ascending: false });
          if (refreshed) setProducts(refreshed);
        } catch (err) {
          showAlert('Erro no Reajuste', err.message);
        } finally {
          setIsMigrating(false);
        }
      }
    );
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

  const handleMoveHeroSlide = (index, direction) => {
    const newSlides = [...heroSlides];
    if (direction === 'up' && index > 0) {
      [newSlides[index], newSlides[index - 1]] = [newSlides[index - 1], newSlides[index]];
    } else if (direction === 'down' && index < newSlides.length - 1) {
      [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    }
    setHeroSlides(newSlides);
  };

  const handleRemoveHeroSlide = (index) => {
    const newSlides = heroSlides.filter((_, i) => i !== index);
    setHeroSlides(newSlides);
  };

  const handleUploadHeroSlide = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingHero(true);
    try {
      const url = await uploadImageToSupabase(file);
      setHeroSlides([...heroSlides, url]);
      showAlert("Sucesso", "Imagem adicionada ao pool. Não esqueça de Salvar a Ordem!");
    } catch (err) {
      showAlert("Erro unexpected", err.message);
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleSaveHeroSlides = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('store_settings').upsert({
        key: 'hero_slides',
        value: JSON.stringify(heroSlides)
      }, { onConflict: 'key' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      showAlert("Sucesso!", "Configuração de carrossel salva com sucesso.");
    } catch (err) {
      showAlert("Erro ao salvar", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('coupons').insert([{
        code: newCoupon.code.toUpperCase(),
        agent_id: newCoupon.agent_id,
        discount_percent: Number(newCoupon.discount_percent) || discountRate
      }]);
      if (error) throw error;
      showAlert("Sucesso", "Cupom criado com sucesso!");
      setIsAddingCoupon(false);
      setNewCoupon({ code: '', agent_id: '', discount_percent: discountRate });
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (data) setCoupons(data);
    } catch (err) {
      showAlert("Erro ao criar cupom", err.message);
    }
  };

  const handleSendAgentEmail = async (coupon) => {
    try {
      // Tentar encontrar o cliente pelo nome/id guardado no agent_id
      const customer = customers.find(c => (c.full_name || c.email) === coupon.agent_id);
      if (!customer) {
        showAlert("Erro no Envio", "Não conseguimos localizar o e-mail deste colaborador na base de clientes.");
        return;
      }

      setLoading(true);
      const res = await fetch('/api/send-agent-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: customer.full_name || coupon.agent_id,
          agentEmail: customer.email,
          couponCode: coupon.code,
          discountPercent: coupon.discount_percent,
          commissionPercent: commissionRate
        })
      });

      const result = await res.json();
      if (result.success) {
        // Persistir no banco de dados para sempre
        await supabase.from('coupons').update({ is_notified: true }).eq('id', coupon.id);

        // Atualizar interface localmente
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_notified: true } : c));

        showAlert("Sucesso!", `Convite enviado para ${customer.email} com sucesso.`);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showAlert("Falha no Envio", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    showConfirm("Excluir Cupom", "Tem certeza que deseja remover este cupom?", async () => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) showAlert("Erro", error.message);
      else {
        setCoupons(coupons.filter(c => c.id !== id));
      }
    });
  };

  const handleUpdateRates = async () => {
    setLoading(true);
    try {
      await supabase.from('store_settings').upsert([
        { key: 'agent_commission_percent', value: String(commissionRate) },
        { key: 'agent_discount_percent', value: String(discountRate) }
      ]);
      showAlert("Configuração Salva", "As taxas foram atualizadas com sucesso!");
    } catch (err) {
      showAlert("Erro ao salvar taxas", err.message);
    } finally {
      setLoading(false);
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
    if (error) {
      showAlert("Erro ao Salvar", error.message);
      return;
    }
    if (data) {
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
    if (error) {
      showAlert("Erro de Status", error.message);
    } else {
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const handleDeleteTestimonial = (id) => {
    showConfirm(
      "Excluir Depoimento",
      "Tem certeza que deseja apagar este depoimento definitivamente? Esta ação não pode ser desfeita.",
      async () => {
        const { error: deleteError } = await supabase.from('testimonials').delete().eq('id', id);
        if (deleteError) {
          showAlert("Erro", "Não foi possível excluir o depoimento.");
        } else {
          setTestimonials(testimonials.filter(t => t.id !== id));
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      }
    );
  };


  const handleUpdateTestimonial = async (e) => {
    e.preventDefault();
    setSaved(false);
    if (!editingTestimonial) return;

    try {
      const { id, created_at, ...rest } = editingTestimonial;
      const { error } = await supabase.from('testimonials').update(rest).eq('id', id);

      if (error) {
        showAlert("Erro ao editar depoimento!", error.message);
        return;
      }

      setTestimonials(testimonials.map(t => t.id === id ? editingTestimonial : t));
      setEditingTestimonial(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      showAlert("Erro inesperado", err.message);
    }
  };


  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      showAlert("Erro ao Atualizar", error.message);
    } else {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const sendWhatsAppStatus = (order, type) => {
    const templates = {
      pending: `Olá *${order.customer_name}*, tudo bem? Passando para avisar que recebemos seu pedido **#${order.id.slice(0, 8)}** na iFooty! 👕 Em breve te passamos as instruções para o Interac e-Transfer.`,
      processing: `Olá *${order.customer_name}*, seu pedido **#${order.id.slice(0, 8)}** já entrou em preparação! 👕 Estamos conferindo cada detalhe para que chegue perfeito para você.`,
      shipped: `Grande notícia, *${order.customer_name}*! 🚀 Seu pedido **#${order.id.slice(0, 8)}** acaba de ser despachado. Logo você estará com seu novo manto em mãos!`,
      completed: `Olá *${order.customer_name}*, o sistema indica que seu pedido **#${order.id.slice(0, 8)}** foi entregue! 📦 Esperamos que goste da qualidade. Se puder, tira uma foto e marca a gente no Instagram @ifooty.ca! 🔥`,
      cancelled: `Olá *${order.customer_name}*, infelizmente seu pedido **#${order.id.slice(0, 8)}** precisou ser cancelado. :( Caso tenha alguma dúvida, estamos à disposição aqui no WhatsApp.`
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


  const calculateItemBaseCostUSD = (item) => {
    const name = (item.name || '').toLowerCase();
    const c = pricing;

    if (name.includes('nba')) return c.costNBA || 17;
    if (name.includes('nfl')) return c.costNFL || 23;
    if (name.includes('jogador') || name.includes('player')) return c.costPlayer || 15;
    if (name.includes('retrô') || name.includes('retro')) return c.costRetro || 15;
    if (name.includes('manga longa') || name.includes('long sleeve')) return c.costLongSleeve || 12;
    if (name.includes('kit infantil') || name.includes('kids')) return c.costKids || 11;
    if (name.includes('baby') || name.includes('body')) return c.costBaby || 8;
    if (name.includes('treino') || name.includes('training')) return c.costTraining || 17;
    if (name.includes('short') || name.includes('bermuda')) return c.costShorts || 8;

    return c.costFan || 9; // Fallback para Fan
  };

  const getOrderCommissionBreakdown = (order) => {
    if (!order || !order.referrer) return null;
    
    // Identificar o agente (código do cupom ou agent_id)
    const rawRef = order.referrer || 'Sem Indicação';
    const coupon = coupons.find(c => c.code === rawRef.toUpperCase());
    const agentName = coupon ? (coupon.agent_id || rawRef) : rawRef;
    
    if (!agentName || agentName === 'Sem Indicação') return null;

    // Todas as ordens deste agente para cálculo de nível e bônus meta
    const agentOrders = orders.filter(o => {
      const oRef = o.referrer || 'Sem Indicação';
      const oCoupon = coupons.find(c => c.code === oRef.toUpperCase());
      const oAgent = oCoupon ? (oCoupon.agent_id || oRef) : oRef;
      return oAgent === agentName;
    });

    const agentOrdersCount = agentOrders.length;

    // LÓGICA DE NÍVEIS
    let rate = 0.08;
    if (agentOrdersCount >= 51) rate = 0.15;
    else if (agentOrdersCount >= 26) rate = 0.12;
    else if (agentOrdersCount >= 11) rate = 0.10;

    const base = Number(order.total_price || 0) * rate;

    // Bônus Sazonal
    const orderDateStr = order.created_at?.split('T')[0] || '';
    const isCopaPeriod = orderDateStr >= '2026-06-11' && orderDateStr <= '2026-07-19';
    const seasonal = isCopaPeriod ? Number(order.total_price || 0) * 0.05 : 0;

    // BÔNUS META
    const sortedAgentOrders = [...agentOrders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const orderRank = sortedAgentOrders.findIndex(o => o.id === order.id) + 1;
    
    let performance = 0;
    if (orderRank === 1) performance = 5;
    if (orderRank === 5) performance = 10;
    if (orderRank === 10) performance = 15;

    return {
      agentName,
      base,
      seasonal,
      performance,
      total: base + seasonal + performance,
      rate: rate * 100,
      rank: orderRank
    };
  };

  const calculateOrderCommission = (order) => {
    const breakdown = getOrderCommissionBreakdown(order);
    return breakdown ? breakdown.total : 0;
  };

  const calculateItemCost = (item) => {
    const baseUSD = calculateItemBaseCostUSD(item);
    let addonsUSD = 0;

    const size = item.size || 'M';
    if (size === '2XL') addonsUSD += (pricing.costAdd2XL || 1);
    if (['3XL', '4XL'].includes(size)) addonsUSD += (pricing.costAdd3XL4XL || 2);

    if (item.extras?.nameNumber) addonsUSD += (pricing.costAddCustom || 3);
    if (item.extras?.patch) addonsUSD += (pricing.costAddPatch || 1);

    const totalItemUSD = (baseUSD + addonsUSD);
    const rate = pricing.exchangeRateFallback || 1.38;

    return totalItemUSD * (item.quantity || 1) * rate;
  };

  const calculateOrderCost = (order) => {
    if (!order || !order.items) return 0;
    const rate = order.usd_cad_rate || pricing.exchangeRateFallback || 1.38;
    
    // 1. Calcular o custo individual de cada item (em USD)
    const itemsCostUSD = order.items.reduce((acc, item) => {
      const baseUSD = calculateItemBaseCostUSD(item);
      let addonsUSD = 0;
      const size = item.size || 'M';
      if (size === '2XL') addonsUSD += (pricing.costAdd2XL || 1);
      if (['3XL', '4XL'].includes(size)) addonsUSD += (pricing.costAdd3XL4XL || 2);
      if (item.extras?.nameNumber) addonsUSD += (pricing.costAddCustom || 3);
      if (item.extras?.patch) addonsUSD += (pricing.costAddPatch || 1);
      
      return acc + ((baseUSD + addonsUSD) * (item.quantity || 1));
    }, 0);

    // 2. Aplicar sobretaxa progressiva de frete (USD)
    const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    let surchargeUSD = 0;
    if (totalItems === 1) surchargeUSD = pricing.surcharge1Item || 5;
    else if (totalItems === 2) surchargeUSD = pricing.surcharge2Items || 4;
    else if (totalItems === 3) surchargeUSD = pricing.surcharge3Items || 3;
    
    const baseCostCAD = (itemsCostUSD + surchargeUSD) * rate;

    // 3. Incluir comissão do afiliado (Se houver)
    const commissionCAD = calculateOrderCommission(order);
    
    return baseCostCAD + commissionCAD;
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || file.type === 'video/mp4') return resolve(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1200;

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else resolve(file); // Se falhar a conversão, usa o original
            }, 'image/webp', 0.8);
          } catch (err) {
            console.error('Erro na compressão:', err);
            resolve(file); // Fallback para o original em caso de erro
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToSupabase = async (file) => {
    // 1. Comprime e converte para WebP (Se for imagem)
    const processedFile = await compressImage(file);
    const isWebP = processedFile.type === 'image/webp';
    const ext = isWebP ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
    
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, processedFile, { 
        cacheControl: '31536000', 
        upsert: true,
        contentType: isWebP ? 'image/webp' : undefined
      });
      
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
        inventory: newProduct.inventory || { ...DEFAULT_INVENTORY },
        unavailable_sizes: newProduct.unavailable_sizes || [],
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
        // Reset ALL states for new product
        setNewProduct({ 
          name: '', 
          price: '', 
          image: '', 
          category: '', 
          league: '', 
          team: '', 
          version: '', 
          is_bestseller: false, 
          is_new: false, 
          description: '', 
          inventory: { ...DEFAULT_INVENTORY } 
        });
        setImageFile(null);
        setImagePreview(null);
        setGalleryFiles([]);
        setGalleryPreviews([]);
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
      showAlert("Falha Técnica", error.message);
      setProductToDelete(null);
      return;
    }

    if (!data || data.length === 0) {
      showAlert("Acesso Negado", "A camisa NÃO foi excluída. Verifique as políticas de RLS ou permissões no Supabase.");
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
      showAlert("Erro no Pedido", error.message);
      setOrderToDelete(null);
      return;
    }

    if (!data || data.length === 0) {
      showAlert("Erro de Permissão", "O pedido NÃO foi excluído. Verifique as permissões de DELETE no Supabase.");
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
      const matchedTeam = [...teams].sort((a, b) => b.name.length - a.name.length).find(t => lowerName.includes(t.name.toLowerCase()));
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
      <style>{`
        .admin-sidebar {
          width: 280px;
          border-right: 1px solid var(--border-color);
          background: var(--surface-color);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 85px;
          height: calc(100vh - 85px);
          overflow-y: auto;
        }
        .admin-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .admin-table-header, .admin-order-row {
          display: grid;
          grid-template-columns: 80px 1.5fr 1fr 100px 150px 40px;
          align-items: center;
        }
        .admin-order-detail-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
        }
        .admin-filters-bar {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }
        .admin-logout-btn {
          margin-top: 1rem;
          padding: 0.8rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          color: #fff;
          background: #FF4444;
          border: none;
          transition: all 0.2s;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
        }

        @media (max-width: 992px) {
          .admin-layout {
            flex-direction: column !important;
          }
          .admin-sidebar {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            width: 100% !important;
            height: auto !important;
            padding: 0.5rem !important;
            gap: 0.5rem !important;
            position: sticky !important;
            top: 60px !important;
            z-index: 100 !important;
            background: #0a0a0c !important;
            border-bottom: 1px solid var(--border-color) !important;
            border-right: none !important;
            scrollbar-width: none;
            margin: 0 !important;
          }
          .admin-sidebar::-webkit-scrollbar {
            display: none;
          }
          .admin-sidebar > div:first-child, .admin-sidebar hr, .admin-sidebar p {
            display: none !important;
          }
          .admin-sidebar .admin-logout-btn {
            margin-top: 0 !important;
            padding: 0.6rem 1.2rem !important;
            border-radius: 20px !important;
            width: auto !important;
            font-size: 0.8rem !important;
            background: #FF4444 !important;
            box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4) !important;
          }
          .admin-nav {
            flex-direction: row !important;
            gap: 0.5rem !important;
          }
          .admin-sidebar button {
            white-space: nowrap;
            padding: 0.5rem 1rem !important;
            border-radius: 20px !important;
            font-size: 0.8rem !important;
            background: rgba(255,255,255,0.05) !important;
            color: var(--text-muted) !important;
            width: auto !important;
          }
          .admin-sidebar button.active-tab {
            background: var(--accent-color) !important;
            color: #000 !important;
          }
          .admin-main {
            padding: 1rem !important;
            padding-top: 0 !important;
          }
          .admin-top-bar {
            padding: 1rem !important;
            position: sticky !important;
            top: 0;
            z-index: 101;
          }
          .admin-header-title {
            font-size: 1.1rem !important;
          }
          .hide-mobile {
            display: none !important;
          }
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
          .admin-table-header {
            display: none !important;
          }
          .admin-order-row {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
            padding: 1rem !important;
            position: relative;
          }
          .admin-order-row span {
            display: block;
            width: 100%;
          }
          .admin-order-row span:nth-child(1) { font-weight: 800; color: var(--accent-color); }
          .admin-order-row span:nth-child(2) { font-size: 1.1rem; }
          .admin-order-row span:nth-child(4) { font-weight: 800; color: #fff; font-size: 1.2rem; margin: 0.5rem 0; }
          
          .admin-order-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            padding: 1.5rem 1rem !important;
          }
          .admin-filters-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>

      {/* SIDEBAR COMPLETA */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1rem', borderRadius: '4px', wordBreak: 'break-all', borderLeft: '3px solid var(--accent-color)' }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>ADMINISTRADOR</span>
            {user?.email}
          </div>
        </div>

        <nav className="admin-nav">
          {/* NOSSOS CATÁLOGOS */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: 800 }}>Nossos Catálogos</p>
          <button
            onClick={() => setSupplierTab('CLOUD_ALL')}
            className={supplierTab === 'CLOUD_ALL' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'CLOUD_ALL' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'CLOUD_ALL' ? '#000' : 'var(--text-main)', fontWeight: supplierTab === 'CLOUD_ALL' ? 700 : 500, transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
          >
            <Database size={18} /> Todo o Banco
          </button>

          {OFFICIAL_CATEGORIES.map(cat => {
            const isActive = supplierTab === `CAT_${cat}`;
            return (
              <button
                key={cat}
                onClick={() => setSupplierTab(`CAT_${cat}`)}
                className={isActive ? 'active-tab' : ''}
                style={{ padding: '0.5rem 1rem', paddingLeft: '2.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', background: isActive ? 'var(--surface-hover)' : 'transparent', color: isActive ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 500, transition: 'all 0.2s', border: isActive ? '1px solid var(--border-color)' : '1px solid transparent', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                <Package size={14} /> {cat}
              </button>
            )
          })}

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Gestão & Integrações</p>
          <button
            onClick={() => setSupplierTab('PEDIDOS')}
            className={supplierTab === 'PEDIDOS' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1.5rem', background: supplierTab === 'PEDIDOS' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'PEDIDOS' ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Package size={18} /> PEDIDOS
          </button>

          <button
            onClick={() => setSupplierTab('ESTOQUE')}
            className={supplierTab === 'ESTOQUE' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1.5rem', background: supplierTab === 'ESTOQUE' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'ESTOQUE' ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <HardDrive size={18} /> ESTOQUE
          </button>

          <button
            onClick={() => setSupplierTab('CLIENTES')}
            className={supplierTab === 'CLIENTES' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1.5rem', background: supplierTab === 'CLIENTES' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'CLIENTES' ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Users size={18} /> CLIENTES
          </button>

          <button
            onClick={() => setSupplierTab('CONFIG')}
            className={supplierTab === 'CONFIG' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'CONFIG' ? '#3B82F6' : 'transparent', color: supplierTab === 'CONFIG' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'CONFIG' ? 700 : 500, transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
          >
            <Image size={18} /> Visual & Banners
          </button>
          <button
            onClick={() => setSupplierTab('PRICING')}
            className={supplierTab === 'PRICING' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'PRICING' ? '#F59E0B' : 'transparent', color: supplierTab === 'PRICING' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'PRICING' ? 700 : 500, transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
          >
            <DollarSign size={18} /> Tabela de Preços
          </button>
          <button
            onClick={() => setSupplierTab('TESTIMONIALS')}
            className={supplierTab === 'TESTIMONIALS' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'TESTIMONIALS' ? '#A855F7' : 'transparent', color: supplierTab === 'TESTIMONIALS' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'TESTIMONIALS' ? 700 : 500, transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
          >
            <Star size={18} /> Depoimentos
          </button>
          <button
            onClick={() => setSupplierTab('TEAMS')}
            className={supplierTab === 'TEAMS' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'TEAMS' ? '#10B981' : 'transparent', color: supplierTab === 'TEAMS' ? '#fff' : 'var(--text-main)', fontWeight: supplierTab === 'TEAMS' ? 700 : 500, transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
          >
            <Shield size={18} /> Escudos Oficiais
          </button>
          <button
            onClick={() => setSupplierTab('AGENTS')}
            className={supplierTab === 'AGENTS' ? 'active-tab' : ''}
            style={{ padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', textAlign: 'left', background: supplierTab === 'AGENTS' ? 'var(--accent-color)' : 'transparent', color: supplierTab === 'AGENTS' ? '#000' : 'var(--text-main)', fontWeight: supplierTab === 'AGENTS' ? 700 : 500, transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}
          >
            <Crown size={18} /> Agentes & Vendas
          </button>

          <button 
            onClick={signOut} 
            className="admin-logout-btn"
            style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', color: '#fff', background: '#EF4444', border: 'none', transition: 'all 0.2s', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
          >
            <LogOut size={18} /> Sair do Painel
          </button>

        </nav>

        <div className="hide-mobile" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>← Visualizar Loja</Link>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'relative' }}>

        {/* TOP BAR */}
        <header className="admin-top-bar" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7, 7, 9, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h1 className="admin-header-title" style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800, margin: 0 }}>
                {
                  supplierTab === 'CLIENTES' ? 'Gestão de Clientes' :
                    supplierTab === 'CONFIG' ? 'Configuração de Interface' :
                      supplierTab === 'PRICING' ? 'Tabela de Preços Globais' :
                        supplierTab === 'TESTIMONIALS' ? 'Gestão de Depoimentos' :
                          supplierTab === 'TEAMS' ? 'Gestão de Escudos Oficiais' :
                            supplierTab === 'CLOUD_ALL' ? 'Todo o Banco na Nuvem' :
                              supplierTab === 'ESTOQUE' ? 'Gestão de Estoque' :
                                supplierTab === 'AGENTS' ? 'Agentes & Vendas' :
                                  `${supplierTab.replace('CAT_', '')}`}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }} className="hide-mobile">Painel Central de Gerenciamento iFooty.</p>
            </div>
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
            {supplierTab === 'TEAMS' && (
              <button
                onClick={handleTeamsMigration}
                disabled={isMigratingTeams}
                className="btn-primary"
                style={{ background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={18} className={isMigratingTeams ? 'spinning' : ''} />
                {isMigratingTeams ? 'SINCRONIZANDO...' : 'SINCRONIZAR ESCUDOS'}
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
              
              {/* FERRAMENTAS DE MANUTENÇÃO E STORAGE */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={handleMigration} 
                  className="btn-secondary" 
                  disabled={isMigrating}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isMigrating ? 0.5 : 1, fontSize: '0.85rem' }}
                >
                  <RefreshCw size={16} className={isMigrating ? 'animate-spin' : ''} />
                  Sincronizar Base
                </button>
                <button 
                  onClick={handleTeamsMigration} 
                  className="btn-secondary" 
                  disabled={isMigratingTeams}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isMigratingTeams ? 0.5 : 1, fontSize: '0.85rem' }}
                >
                  <Shield size={16} className={isMigratingTeams ? 'animate-spin' : ''} />
                  Sincronizar Escudos
                </button>
                <button 
                  onClick={handleCleanOrphanedImages} 
                  className="btn-secondary" 
                  disabled={isMigrating}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', fontSize: '0.85rem' }}
                >
                  <Trash2 size={16} />
                  Limpar Imagens Não Utilizadas
                </button>
              </div>
            </div>
          )}

          {/* RENDERS CONDICIONAIS DAS ABAS ESPECIAIS */}
          {supplierTab === 'CONFIG' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>

              {/* CONFIGURAÇÃO MATERIAL AFILIADO */}
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                  <Database size={24} color="var(--accent-color)" /> Material de Divulgação (Drive)
                </h2>
                <form onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Link da Pasta Mestre (Google Drive / Dropbox)</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input
                        required
                        type="url"
                        value={pricing.affiliateDriveLink || ''}
                        onChange={e => setPricing({ ...pricing, affiliateDriveLink: e.target.value })}
                        placeholder="https://drive.google.com/drive/folders/..."
                        style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                      />
                      <button type="submit" className="btn-primary" style={{ background: 'var(--accent-color)', color: '#000', padding: '0 2rem' }}>Salvar Link</button>
                    </div>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Este link será aberto quando o afiliado clicar no botão "Material de Divulgação" no dashboard dele.</p>
                  </div>
                </form>
              </div>

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
                        placeholder="Ex: 17788061419"
                        style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                      />
                      <button type="submit" className="btn-primary" style={{ background: '#25D366', color: '#fff', padding: '0 2rem' }}>Salvar Número</button>
                    </div>
                    <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Este número será usado no botão flutuante, no Checkout e para envio de notificações aos clientes.</p>
                  </div>
                </form>
              </div>

              {/* GESTÃO DO CARROSSEL HERO */}
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                  <Image color="#3B82F6" /> Carrossel da Home (Imagens de Fundo)
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                  Gerencie as imagens que aparecem no fundo da tela inicial. Arraste para reordenar (em breve) ou use as setas.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {heroSlides.map((src, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>
                        {index + 1}
                      </div>

                      <div style={{ width: '120px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', margin: 0 }}>{src.split('/').pop()}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleMoveHeroSlide(index, 'up')}
                          disabled={index === 0}
                          style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          onClick={() => handleMoveHeroSlide(index, 'down')}
                          disabled={index === heroSlides.length - 1}
                          style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: index === heroSlides.length - 1 ? 'not-allowed' : 'pointer', opacity: index === heroSlides.length - 1 ? 0.3 : 1 }}
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          onClick={() => handleRemoveHeroSlide(index)}
                          style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {heroSlides.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                      Nenhuma imagem no carrossel. Use o botão abaixo para adicionar.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.8rem',
                    padding: '1.2rem',
                    background: isUploadingHero ? '#555' : 'var(--surface-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-color)',
                    cursor: isUploadingHero ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}>
                    <input type="file" accept="image/*" onChange={handleUploadHeroSlide} disabled={isUploadingHero} style={{ display: 'none' }} />
                    {isUploadingHero ? (
                      <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <>
                        <Plus size={20} /> Adicionar Nova Imagem
                      </>
                    )}
                  </label>

                  <button
                    onClick={handleSaveHeroSlides}
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1, padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                  >
                    <Save size={20} /> SALVAR ORDEM E ALTERAÇÕES
                  </button>
                </div>
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
                          onChange={e => setEditingTeam({ ...editingTeam, logo: e.target.value })}
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
          ) : supplierTab === 'AGENTS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* CONFIGURAÇÕES GLOBAIS */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
                  <Settings size={20} /> Configurações de Comissionamento
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Desconto p/ Cliente (Ex: 5%)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={discountRate}
                        onChange={e => setDiscountRate(e.target.value)}
                        style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>%</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Comissão p/ Agente (Ex: 10%)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={commissionRate}
                        onChange={e => setCommissionRate(e.target.value)}
                        style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={handleUpdateRates} className="btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                      <Save size={18} /> ATUALIZAR TAXAS
                    </button>
                  </div>
                </div>
              </div>

              {/* GESTÃO DE CUPONS */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#fff' }}>
                    <Tag size={20} /> Cupons Ativos
                  </h3>
                  <button onClick={() => setIsAddingCoupon(true)} className="btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> NOVO CUPOM
                  </button>
                </div>

                {isAddingCoupon && (
                  <form onSubmit={handleCreateCoupon} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Código (Ex: IF10)</label>
                      <input
                        required
                        type="text"
                        value={newCoupon.code}
                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Buscar Colaborador / Agente</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Digite nome ou e-mail..."
                          value={agentSearch || newCoupon.agent_id}
                          onChange={e => {
                            setAgentSearch(e.target.value);
                            setShowAgentResults(true);
                            if (e.target.value === '') setNewCoupon({ ...newCoupon, agent_id: '' });
                          }}
                          onFocus={() => setShowAgentResults(true)}
                          style={{ width: '100%', padding: '0.6rem', paddingLeft: '2.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        />
                        <Users size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      </div>

                      {showAgentResults && agentSearch && (
                        <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', zIndex: 100, marginTop: '5px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', padding: '0.5rem' }}>
                          {customers
                            .filter(c =>
                              (c.full_name?.toLowerCase().includes(agentSearch.toLowerCase())) ||
                              (c.email?.toLowerCase().includes(agentSearch.toLowerCase()))
                            )
                            .slice(0, 10)
                            .map(c => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setNewCoupon({ ...newCoupon, agent_id: c.full_name || c.email });
                                  setAgentSearch(c.full_name || c.email);
                                  setShowAgentResults(false);
                                }}
                                style={{ padding: '0.8rem', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{c.full_name || 'Sem Nome'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                              </div>
                            ))
                          }
                          {customers.filter(c => (c.full_name?.toLowerCase().includes(agentSearch.toLowerCase())) || (c.email?.toLowerCase().includes(agentSearch.toLowerCase()))).length === 0 && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum cliente encontrado.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Desconto %</label>
                      <input
                        type="number"
                        value={newCoupon.discount_percent}
                        onChange={e => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem' }}>Criar</button>
                      <button type="button" onClick={() => setIsAddingCoupon(false)} style={{ flex: 1, padding: '0.6rem', color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>X</button>
                    </div>
                  </form>
                )}

                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>CÓDIGO</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>AGENTE</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>DESCONTO</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>LINK DE DIVULGAÇÃO</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-color)' }}>{c.code}</td>
                          <td style={{ padding: '1rem' }}>{c.agent_id || '-'}</td>
                          <td style={{ padding: '1rem' }}>{c.discount_percent}%</td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '4px', display: 'inline-block' }}>
                              ifooty.ca/?ref={c.code}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleSendAgentEmail(c)}
                                disabled={c.is_notified}
                                style={{
                                  color: c.is_notified ? '#10B981' : 'var(--accent-color)',
                                  background: 'none',
                                  border: `1px solid ${c.is_notified ? '#10B981' : 'var(--accent-color)'}`,
                                  cursor: c.is_notified ? 'default' : 'pointer',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  opacity: c.is_notified ? 0.8 : 1
                                }}
                              >
                                {c.is_notified ? <Check size={14} /> : <MessageSquare size={14} />}
                                {c.is_notified ? 'E-MAIL ENVIADO' : 'ENVIAR E-MAIL'}
                              </button>
                              <button onClick={() => handleDeleteCoupon(c.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {coupons.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum cupom criado ainda.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RELATÓRIO DE PRODUTIVIDADE */}
              <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', color: '#fff' }}>
                  <TrendingUp size={20} /> Relatório de Produtividade (Vendas por Agente)
                </h3>

                {/* FILTROS DE PRODUTIVIDADE */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>De:</label>
                    <input
                      type="date"
                      value={prodDateRange.start}
                      onChange={e => setProdDateRange({ ...prodDateRange, start: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Até:</label>
                    <input
                      type="date"
                      value={prodDateRange.end}
                      onChange={e => setProdDateRange({ ...prodDateRange, end: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div style={{ flex: 2, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Filtrar Agente:</label>
                    <select
                      value={prodAgentFilter}
                      onChange={e => setProdAgentFilter(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.9rem' }}
                    >
                      <option value="">Todos os Agentes</option>
                      {/* Pegar nomes únicos dos agentes vinculados aos cupons */}
                      {[...new Set(coupons.map(c => c.agent_id))].filter(Boolean).map(agent => (
                        <option key={agent} value={agent}>{agent}</option>
                      ))}
                      <option value="Sem Indicação">Sem Indicação</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>AGENTE / ORIGEM</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>PEDIDOS</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>NÍVEL</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>COMISSÃO BASE</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>BÔNUS META</th>
                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>TOTAL A PAGAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(orders
                        .filter(order => {
                          const orderDate = order.created_at.split('T')[0];
                          const inDateRange = (!prodDateRange.start || orderDate >= prodDateRange.start) &&
                            (!prodDateRange.end || orderDate <= prodDateRange.end);
                          return inDateRange;
                        })
                        .reduce((acc, order) => {
                          const rawRef = order.referrer || 'Sem Indicação';
                          
                          // 1. Tentar encontrar o cupom/agente de forma unificada
                          const coupon = coupons.find(c => {
                            const agentCode = c.code?.toUpperCase();
                            const agentName = c.agent_id?.toLowerCase();
                            const rawId = c.agent_id || 'vendedor';
                            const cleanId = rawId.includes('@') ? rawId.split('@')[0] : rawId.split(' ')[0];
                            const slug = cleanId.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            
                            const normalizedRef = rawRef.toLowerCase().trim();
                            return normalizedRef === agentCode.toLowerCase() || 
                                   normalizedRef === agentName || 
                                   normalizedRef === slug;
                          });

                          // 2. Definir a chave única (Agent ID ou 'Sem Indicação')
                          const refKey = coupon ? (coupon.agent_id || coupon.code) : rawRef;

                          if (prodAgentFilter && refKey !== prodAgentFilter) return acc;

                          const orderDateStr = order.created_at.split('T')[0];
                          const isCopaPeriod = orderDateStr >= '2026-06-11' && orderDateStr <= '2026-07-19';

                          if (!acc[refKey]) acc[refKey] = { count: 0, total: 0, seasonalBonus: 0, orderList: [] };
                          acc[refKey].count += 1;
                          acc[refKey].total += Number(order.total_price || 0);
                          acc[refKey].orderList.push(order);

                          if (isCopaPeriod) {
                            acc[refKey].seasonalBonus += Number(order.total_price || 0) * 0.05;
                          }

                          return acc;
                        }, {})).map(([agent, stats]) => {
                          // LÓGICA DE NÍVEIS
                          let rate = 0.08;
                          let level = "🥉 Bronze";
                          if (stats.count >= 51) { rate = 0.15; level = "💎 Diamante"; }
                          else if (stats.count >= 26) { rate = 0.12; level = "🥇 Ouro"; }
                          else if (stats.count >= 11) { rate = 0.10; level = "🥈 Prata"; }

                          let perfBonus = 0;
                          if (stats.count >= 1) perfBonus += 5;
                          if (stats.count >= 5) perfBonus += 10;
                          if (stats.count >= 10) perfBonus += 15;

                          const commissionBase = stats.total * rate;
                          const totalPayout = commissionBase + perfBonus + stats.seasonalBonus;
                          const isExpanded = expandedAgentId === agent;

                          return (
                            <React.Fragment key={agent}>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => setExpandedAgentId(isExpanded ? null : agent)}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{agent}</td>
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
                                    {stats.count} pedidos {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{level}</td>
                                <td style={{ padding: '1rem' }}>${commissionBase.toFixed(2)} CAD <span style={{fontSize: '0.7rem', color: 'var(--text-muted)' }}>({(rate * 100)}%)</span></td>
                                <td style={{ padding: '1rem' }}>
                                  ${(perfBonus + stats.seasonalBonus).toFixed(2)}
                                  {(stats.seasonalBonus > 0) && <div style={{ fontSize: '0.65rem', color: 'var(--accent-color)' }}>incl. Bônus Copa</div>}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--accent-color)', fontWeight: 800 }}>
                                  ${totalPayout.toFixed(2)} CAD
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan="6" style={{ padding: '0 1rem 1.5rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '0.5rem' }}>
                                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={14} /> Detalhamento das Vendas de {agent}
                                      </h4>
                                      <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                        <thead>
                                          <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '0.5rem' }}>Pedido</th>
                                            <th style={{ padding: '0.5rem' }}>Data</th>
                                            <th style={{ padding: '0.5rem' }}>Cliente</th>
                                            <th style={{ padding: '0.5rem' }}>Valor</th>
                                            <th style={{ padding: '0.5rem' }}>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {stats.orderList.map(o => (
                                            <tr key={o.id} style={{ borderBottom: '1px dotted rgba(255,255,255,0.05)' }}>
                                              <td style={{ padding: '0.5rem', fontWeight: 600 }}>#{o.id.slice(0,8)}</td>
                                              <td style={{ padding: '0.5rem' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                                              <td style={{ padding: '0.5rem' }}>{o.customer_name}</td>
                                              <td style={{ padding: '0.5rem' }}>${Number(o.total_price).toFixed(2)}</td>
                                              <td style={{ padding: '0.5rem' }}>
                                                <span style={{ 
                                                  padding: '2px 8px', 
                                                  borderRadius: '100px', 
                                                  fontSize: '0.7rem',
                                                  background: o.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                  color: o.status === 'completed' ? '#22c55e' : '#f59e0b'
                                                }}>
                                                  {o.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : supplierTab === 'PRICING' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
              {/* REAJUSTE GLOBAL - NOVA FERRAMENTA */}
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), transparent)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#F59E0B' }}>
                  <BarChart size={24} /> Reajuste Global de Catálogo
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Use esta ferramenta para aumentar ou diminuir o preço de **todos os produtos** da loja simultaneamente. Útil para repassar aumentos do fornecedor.
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tipo de Reajuste</label>
                    <select
                      value={bulkAdjustmentType}
                      onChange={e => setBulkAdjustmentType(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      <option value="fixed">Valor Fixo ($ CAD)</option>
                      <option value="percent">Percentual (%)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Valor do Ajuste</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkAdjustmentValue}
                      onChange={e => setBulkAdjustmentValue(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleBulkPriceUpdate(-1)} className="btn-secondary" style={{ borderColor: '#EF4444', color: '#EF4444', height: '45px' }}>Reduzir</button>
                    <button onClick={() => handleBulkPriceUpdate(1)} className="btn-primary" style={{ background: '#F59E0B', color: '#000', height: '45px', fontWeight: 800 }}>Aumentar Tudo</button>
                  </div>
                </div>
              </div>

              {/* VALORES FIXOS E FRETE */}
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
                <form onSubmit={handleSavePricing} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.5rem', color: '#FCD34D', margin: 0 }}>
                      <DollarSign color="#FCD34D" /> Gestão de Custos (USD Fornecedor)
                    </h2>
                    {saved && <div style={{ background: '#10B981', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>✓ Configurações Salvas!</div>}
                  </div>

                  <div style={{ padding: '1.5rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '1rem' }}>
                    
                    {/* Câmbio e Taxas de Volume */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 700 }}>🇨🇦 Câmbio Fallback (USD/CAD)</label>
                        <input type="number" step="0.001" value={pricing.exchangeRateFallback} onChange={e => setPricing({ ...pricing, exchangeRateFallback: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.8rem', background: 'rgba(96, 165, 250, 0.05)', border: '1px solid #60A5FA', borderRadius: '6px', color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1.5, minWidth: '250px' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>🇺🇸 Sobretaxas de Frete (USD)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.65rem' }}>1 un.</span>
                            <input type="number" step="0.5" value={pricing.surcharge1Item} onChange={e => setPricing({ ...pricing, surcharge1Item: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.65rem' }}>2 un.</span>
                            <input autoComplete="off" min="0" type="number" step="0.5" value={pricing.surcharge2Items || 0} onChange={e => setPricing({ ...pricing, surcharge2Items: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.65rem' }}>3 un.</span>
                            <input autoComplete="off" min="0" type="number" step="0.5" value={pricing.surcharge3Items || 0} onChange={e => setPricing({ ...pricing, surcharge3Items: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #444', color: '#fff' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grade de Custos por Tipo */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      {[
                        { label: 'Fan Lisa', key: 'costFan' },
                        { label: 'Player', key: 'costPlayer' },
                        { label: 'Retro', key: 'costRetro' },
                        { label: 'Manga Longa', key: 'costLongSleeve' },
                        { label: 'Kids', key: 'costKids' },
                        { label: 'Baby Body', key: 'costBaby' },
                        { label: 'NBA', key: 'costNBA' },
                        { label: 'NFL', key: 'costNFL' },
                        { label: 'Treino', key: 'costTraining' },
                        { label: 'Shorts', key: 'costShorts' },
                      ].map(item => (
                        <div key={item.key}>
                          <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.label} ($)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0"
                            autoComplete="off"
                            value={pricing[item.key] || 0} 
                            onChange={e => setPricing({ ...pricing, [item.key]: parseFloat(e.target.value) || 0 })} 
                            style={{ width: '100%', padding: '0.6rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontSize: '0.9rem' }} 
                          />
                        </div>
                      ))}
                    </div>

                    {/* Adicionais de Custo */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.7rem' }}>+ 2XL ($)</span>
                        <input type="number" step="0.5" value={pricing.costAdd2XL} onChange={e => setPricing({ ...pricing, costAdd2XL: parseFloat(e.target.value) })} style={{ width: '60px', textAlign: 'center', background: 'transparent', border: '1px solid #334155', color: '#fff' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.7rem' }}>+ 3/4XL ($)</span>
                        <input type="number" step="0.5" value={pricing.costAdd3XL4XL} onChange={e => setPricing({ ...pricing, costAdd3XL4XL: parseFloat(e.target.value) })} style={{ width: '60px', textAlign: 'center', background: 'transparent', border: '1px solid #334155', color: '#fff' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.7rem' }}>+ Patch ($)</span>
                        <input type="number" step="0.5" value={pricing.costAddPatch} onChange={e => setPricing({ ...pricing, costAddPatch: parseFloat(e.target.value) })} style={{ width: '60px', textAlign: 'center', background: 'transparent', border: '1px solid #334155', color: '#fff' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.7rem' }}>+ Custom ($)</span>
                        <input type="number" step="0.5" value={pricing.costAddCustom} onChange={e => setPricing({ ...pricing, costAddCustom: parseFloat(e.target.value) })} style={{ width: '60px', textAlign: 'center', background: 'transparent', border: '1px solid #334155', color: '#fff' }} />
                      </div>
                    </div>
                  </div>

                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#FCD34D' }}>
                    <DollarSign color="#FCD34D" /> Valores Adicionais Fixos (Venda em CAD)
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nome + Número Personalizado</label>
                      <input autoComplete="off" min="0" required type="number" step="0.01" value={pricing.nameNumber || 0} onChange={e => setPricing({ ...pricing, nameNumber: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Custo do Patch</label>
                      <input autoComplete="off" min="0" required type="number" step="0.01" value={pricing.patch || 0} onChange={e => setPricing({ ...pricing, patch: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tamanho Plussize (2XL - 3XL)</label>
                      <input autoComplete="off" min="0" required type="number" step="0.01" value={pricing.size2XL3XL || 0} onChange={e => setPricing({ ...pricing, size2XL3XL: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tamanho Máximo (4XL)</label>
                      <input autoComplete="off" min="0" required type="number" step="0.01" value={pricing.size4XL || 0} onChange={e => setPricing({ ...pricing, size4XL: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', fontSize: '1.1rem', color: '#60A5FA' }}>
                      <Truck size={20} /> Gestão de Entrega (Frete)
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Custo de Frete Padrão ($)</label>
                        <input type="number" step="0.01" value={pricing.shippingCost} onChange={e => setPricing({ ...pricing, shippingCost: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Frete Grátis Acima de ($)</label>
                        <input type="number" step="0.01" value={pricing.freeShippingThreshold} onChange={e => setPricing({ ...pricing, freeShippingThreshold: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 800 }}>Preço Base Combo Oferta ($)</label>
                        <input type="number" step="0.01" value={pricing.promoBasePrice} onChange={e => setPricing({ ...pricing, promoBasePrice: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.8rem', background: 'rgba(219, 254, 135, 0.05)', color: '#fff', border: '1px solid var(--accent-color)', borderRadius: '6px' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#10B981' }}>
                      <Package color="#10B981" /> Desconto Progressivo (Valor Total)
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Os valores abaixo configuram o **percentual (%)** que será subtraído do **valor total do carrinho** dependendo do volume de peças.</p>

                    {pricing.discounts.map((discount, index) => (
                      <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Quantidade Mínima</label>
                          <input required type="number" value={discount.qty} onChange={(e) => {
                            const newDiscounts = [...pricing.discounts];
                            newDiscounts[index].qty = parseInt(e.target.value);
                            setPricing({ ...pricing, discounts: newDiscounts });
                          }} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Desconto Total (% OFF)</label>
                          <input required type="number" step="0.01" value={discount.amount} onChange={(e) => {
                            const newDiscounts = [...pricing.discounts];
                            newDiscounts[index].amount = parseFloat(e.target.value);
                            setPricing({ ...pricing, discounts: newDiscounts });
                          }} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="btn-primary" style={{ background: '#3B82F6', color: '#fff', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', position: 'sticky', bottom: '0', zIndex: 10, boxShadow: '0 -5px 20px rgba(0,0,0,0.3)' }}>
                    {saved ? '✓ Configurações Salvas!' : 'Salvar Todas as Configurações de Preço'}
                  </button>
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
                        onClick={() => setEditingTestimonial(t)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: 'var(--surface-hover)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button
                        onClick={() => handleToggleTestimonial(t.id, t.status)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: t.status === 'approved' ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-color)', color: t.status === 'approved' ? '#EF4444' : '#000', fontSize: '0.8rem', fontWeight: 700, border: t.status === 'approved' ? '1px solid rgba(239, 68, 68, 0.2)' : 'none' }}
                      >
                        {t.status === 'approved' ? 'Ocultar' : 'Aprovar'}
                      </button>
                      <button
                        onClick={() => handleDeleteTestimonial(t.id)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}
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

              {/* MODAL DE EDIÇÃO DE DEPOIMENTO */}
              {editingTestimonial && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(10px)' }}>
                  <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Star color="var(--accent-color)" /> Editar Depoimento
                      </h2>
                      <button onClick={() => setEditingTestimonial(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                    </div>

                    <form onSubmit={handleUpdateTestimonial} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nome do Cliente</label>
                          <input
                            required
                            type="text"
                            value={editingTestimonial.name}
                            onChange={e => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Localização</label>
                          <input
                            required
                            type="text"
                            value={editingTestimonial.location}
                            onChange={e => setEditingTestimonial({ ...editingTestimonial, location: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Conteúdo do Depoimento</label>
                        <textarea
                          required
                          rows={4}
                          value={editingTestimonial.content}
                          onChange={e => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                          style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Avaliação (Estrelas)</label>
                          <select
                            value={editingTestimonial.rating}
                            onChange={e => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(e.target.value) })}
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }}
                          >
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrelas</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data</label>
                          <input
                            type="date"
                            value={editingTestimonial.date}
                            onChange={e => setEditingTestimonial({ ...editingTestimonial, date: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</label>
                          <select
                            value={editingTestimonial.status}
                            onChange={e => setEditingTestimonial({ ...editingTestimonial, status: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }}
                          >
                            <option value="approved">Aprovado</option>
                            <option value="pending">Pendente</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>URL do Avatar (Foto)</label>
                        <input
                          type="url"
                          value={editingTestimonial.avatar_url || ''}
                          onChange={e => setEditingTestimonial({ ...editingTestimonial, avatar_url: e.target.value })}
                          placeholder="https://..."
                          style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }}
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Dica: Use URLs do Supabase Storage para fotos oficiais.</p>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setEditingTestimonial(null)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1, background: 'var(--accent-color)', color: '#000', fontWeight: 800 }}>
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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
            
            // Cálculo detalhado para separar USD e CAD
            const { totalCostCAD, totalCostUSD } = filteredOrders.reduce((acc, order) => {
              const orderCostCAD = calculateOrderCost(order);
              
              // Extrair USD (apenas para exibição no dashboard, sem comissão que é em CAD)
              const itemsCostUSD = order.items?.reduce((sum, item) => {
                const base = calculateItemBaseCostUSD(item);
                let addons = 0;
                const size = item.size || 'M';
                if (size === '2XL') addons += (pricing.costAdd2XL || 1);
                if (['3XL', '4XL'].includes(size)) addons += (pricing.costAdd3XL4XL || 2);
                if (item.extras?.nameNumber) addons += (pricing.costAddCustom || 3);
                if (item.extras?.patch) addons += (pricing.costAddPatch || 1);
                return sum + ((base + addons) * (item.quantity || 1));
              }, 0) || 0;

              const totalItemsCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
              let surchargeUSD = 0;
              if (totalItemsCount === 1) surchargeUSD = pricing.surcharge1Item || 5;
              else if (totalItemsCount === 2) surchargeUSD = pricing.surcharge2Items || 4;
              else if (totalItemsCount === 3) surchargeUSD = pricing.surcharge3Items || 3;

              const orderUSD = itemsCostUSD + surchargeUSD;

              return {
                totalCostUSD: acc.totalCostUSD + orderUSD,
                totalCostCAD: acc.totalCostCAD + orderCostCAD
              };
            }, { totalCostCAD: 0, totalCostUSD: 0 });

            const totalProfit = totalRevenue - totalCostCAD;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px' }}>

                {/* DATE FILTER CONTROLS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  
                  {/* Quick Filters */}
                  <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
                    <button onClick={() => { setDateRange({ start: '', end: '' }); setStatusFilter('all'); }} style={{ padding: '0.4rem 1rem', background: (!dateRange.start && !dateRange.end) ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: (!dateRange.start && !dateRange.end) ? '#000' : '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Todo o Período</button>
                    
                    <button onClick={() => {
                      const d = new Date(); d.setDate(d.getDate() - 7);
                      setDateRange({ start: d.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
                    }} style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Últimos 7 Dias</button>

                    <button onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                      setDateRange({ start, end });
                    }} style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Este Mês</button>

                    <button onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                      setDateRange({ start, end });
                    }} style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Mês Passado</button>
                  </div>

                  {/* Manual Date Range */}
                  <div className="admin-filters-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 800, textTransform: 'uppercase' }}>Período Personalizado (De):</label>
                      <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', colorScheme: 'dark', cursor: 'text' }} />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 800, textTransform: 'uppercase' }}>Até:</label>
                      <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: '#000', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', colorScheme: 'dark', cursor: 'text' }} />
                    </div>
                    <button onClick={() => { setDateRange({ start: '', end: '' }); setStatusFilter('all'); setOrderFilter(null); }} style={{ padding: '0.8rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Remover Filtros</button>
                  </div>
                </div>

                {/* STATS SUMMARY BAR - 4 items por linha no desktop, 2 no mobile */}
                <div className="admin-stats-grid">
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

                  {/* Segunda Linha */}
                  <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Receita 🇨🇦 (CAD)</p>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', margin: 0 }}>${totalRevenue.toFixed(2)}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #f87171' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Custo 🇺🇸 (USD)</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>${totalCostUSD.toFixed(2)}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #64748b' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Custo 🇨🇦 (CAD)</p>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>${totalCostCAD.toFixed(2)}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #22c55e' }}>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Lucro 🇨🇦 (CAD)</p>
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
                  <div className="admin-table-header" style={{ padding: '0.8rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                          className="admin-order-row"
                          style={{
                            background: isExpanded ? 'rgba(255,255,255,0.05)' : 'var(--surface-color)',
                            borderRadius: '8px',
                            alignItems: 'center',
                            cursor: 'pointer',
                            border: isExpanded ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                            transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
                            marginBottom: isExpanded ? '0' : '0.2rem'
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>#{order.id.slice(0, 5)}</span>
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
                          <div 
                            className="admin-order-detail-grid"
                            style={{
                              background: 'rgba(0,0,0,0.2)',
                              padding: '2rem 1.5rem',
                              borderRadius: '0 0 8px 8px',
                              border: '1px solid var(--accent-color)',
                              borderTop: 'none',
                              animation: 'slideDown 0.3s ease-out'
                            }}
                          >
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
                              <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '1.5rem' }}>
                                <p>{order.shipping_address?.street}{order.shipping_address?.apartment ? `, Apt ${order.shipping_address.apartment}` : ''}</p>
                                <p>{order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postalCode}</p>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}><MapPin size={12} /> {order.customer_phone}</p>
                              </div>

                              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>DRE do Pedido (CAD)</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                                  <span>Receita Bruta:</span>
                                  <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>${Number(order.total_price).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                                  <span>Custo Fornecedor:</span>
                                  <span style={{ color: '#ef4444' }}>-${(calculateOrderCost(order) - calculateOrderCommission(order)).toFixed(2)}</span>
                                </div>
                                {(() => {
                                  const breakdown = getOrderCommissionBreakdown(order);
                                  if (!breakdown) return null;
                                  return (
                                    <div style={{ marginTop: '0.8rem', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                                      <p style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                        Detalhamento Afiliado: {breakdown.agentName}
                                      </p>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>- Comissão Base ({breakdown.rate}%):</span>
                                        <span style={{ color: '#ef4444' }}>-${breakdown.base.toFixed(2)}</span>
                                      </div>
                                      {breakdown.performance > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                                          <span style={{ color: 'var(--text-muted)' }}>- Bônus Meta (Venda #{breakdown.rank}):</span>
                                          <span style={{ color: '#ef4444' }}>-${breakdown.performance.toFixed(2)}</span>
                                        </div>
                                      )}
                                      {breakdown.seasonal > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                                          <span style={{ color: 'var(--text-muted)' }}>- Bônus Sazonal:</span>
                                          <span style={{ color: '#ef4444' }}>-${breakdown.seasonal.toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.3rem', color: '#fff' }}>
                                        <span>Total Comissão:</span>
                                        <span>-${breakdown.total.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.3rem', marginTop: '0.3rem' }}>
                                  <span>Lucro Líquido:</span>
                                  <span style={{ color: '#22c55e' }}>${(Number(order.total_price) - calculateOrderCost(order)).toFixed(2)}</span>
                                </div>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                  * Baseado em {order.usd_cad_rate ? `câmbio histórico (${order.usd_cad_rate})` : `câmbio atual/fallback (${pricing.exchangeRateFallback || 1.38})`}.
                                </p>
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
            ) : supplierTab === 'ESTOQUE' ? (() => {
              const adultSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
              const kidSizes = ['16', '18', '20', '22', '24', '26', '28'];
              const currentSizes = stockSubTab === 'ADULTO' ? adultSizes : kidSizes;

              const productsWithStock = products.filter(p => {
                const stockValues = Object.values(p.inventory || {});
                const hasStock = stockValues.some(v => Number(v) > 0);
                if (!hasStock) return false;

                const isKidProduct = p.category === 'Infantil' || p.name.toLowerCase().includes('infantil') || p.name.toLowerCase().includes('kids');
                return stockSubTab === 'ADULTO' ? !isKidProduct : isKidProduct;
              });

              const totalItems = productsWithStock.reduce((acc, p) => {
                return acc + Object.values(p.inventory || {}).reduce((sum, v) => sum + Number(v), 0);
              }, 0);

              const filteredProducts = productsWithStock.filter(p => 
                !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.team?.toLowerCase().includes(searchTerm.toLowerCase())
              );

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* RESUMO E FILTROS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)', background: 'rgba(164, 210, 51, 0.05)' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem' }}>Total {stockSubTab}</p>
                      <h3 style={{ fontSize: '2rem', color: 'var(--accent-color)', margin: 0, fontWeight: 900 }}>{totalItems} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>peças</span></h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '10px', width: 'fit-content', border: '1px solid var(--border-color)' }}>
                        <button 
                          onClick={() => setStockSubTab('ADULTO')}
                          style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none', background: stockSubTab === 'ADULTO' ? 'var(--accent-color)' : 'transparent', color: stockSubTab === 'ADULTO' ? '#000' : '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
                        >
                          ADULTO (S-4XL)
                        </button>
                        <button 
                          onClick={() => setStockSubTab('INFANTIL')}
                          style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none', background: stockSubTab === 'INFANTIL' ? 'var(--accent-color)' : 'transparent', color: stockSubTab === 'INFANTIL' ? '#000' : '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
                        >
                          INFANTIL (16-28)
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '1rem' }}>
                         <div style={{ position: 'relative', flex: 1 }}>
                            <input 
                              type="text" 
                              placeholder={`Buscar em ${stockSubTab.toLowerCase()}...`} 
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', background: '#000', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                            />
                            <TrendingUp size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                         </div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Exibindo {filteredProducts.length} modelos
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive" style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontWeight: 800, minWidth: '220px' }}>PRODUTO</th>
                          {currentSizes.map(s => (
                            <th key={s} style={{ padding: '1.2rem 0.5rem', color: 'var(--text-muted)', fontWeight: 800, textAlign: 'center' }}>{s}</th>
                          ))}
                          <th style={{ padding: '1.2rem', textAlign: 'right' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '1rem 1.2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={p.image} alt="" style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', background: '#000' }} />
                                <div>
                                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{p.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.category} • {p.team}</div>
                                </div>
                              </div>
                            </td>
                            {currentSizes.map(s => {
                              const count = p.inventory?.[s] || 0;
                              return (
                                <td key={s} style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                  <div style={{ 
                                    display: 'inline-flex', 
                                    minWidth: '32px', 
                                    height: '32px', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    borderRadius: '6px',
                                    background: count > 0 ? 'rgba(164, 210, 51, 0.15)' : 'rgba(255,255,255,0.02)',
                                    color: count > 0 ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                    fontWeight: count > 0 ? 900 : 400,
                                    border: count > 0 ? '1px solid rgba(164, 210, 51, 0.3)' : 'transparent'
                                  }}>
                                    {count}
                                  </div>
                                </td>
                              );
                            })}
                            <td style={{ padding: '1rem 1.2rem', textAlign: 'right' }}>
                              <button 
                                onClick={() => setEditingProduct(p)}
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
            : loading && supplierTab.startsWith('CLOUD_') ? (
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
                        <ProductMedia src={product.image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))' }} />
                      </div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: 1.3, height: '40px', overflow: 'hidden', color: '#fff' }}>{product.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', alignItems: 'center' }}>
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
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ex: Flamengo Titular 24/25" style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregar Tabela</label>
                  <select 
                    value={Number(newProduct.price).toFixed(2)}
                    onChange={(e) => {
                      if (e.target.value) setNewProduct({ ...newProduct, price: parseFloat(e.target.value) });
                    }} 
                    style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#10B981', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">-- Autopreencher Preço --</option>
                    <optgroup label="Camisas">
                      <option value="47.90">Fã Lisa (CA$ 47.90)</option>
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
                      <option value="47.90">Shorts Fã (CA$ 47.90)</option>
                      <option value="69.90">Shorts Jogador (CA$ 69.90)</option>
                      <option value="159.90">Corta Vento (CA$ 159.90)</option>
                    </optgroup>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Preço Final (CAD) *</label>
                  <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Ex: 69.90" style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Versão *</label>
                  <select required value={newProduct.version} onChange={e => setNewProduct({ ...newProduct, version: e.target.value })} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
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
                  <select required value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
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
                    onChange={e => setNewProduct({ ...newProduct, league: e.target.value })}
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
                    onChange={e => setNewProduct({ ...newProduct, team: e.target.value })}
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
                    onChange={e => setNewProduct({ ...newProduct, is_bestseller: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#EF4444' }}
                  />
                  Mais Vendido 🔥
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={newProduct.is_new}
                    onChange={e => setNewProduct({ ...newProduct, is_new: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#FFB81C' }}
                  />
                  Novo ⭐
                </label>
              </div>

              {/* === ESTOQUE POR TAMANHO === */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-color)', marginBottom: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>⚡ Estoque Pronta Entrega (Canada)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.8rem' }}>
                  {SIZES.map(size => (
                    <div key={size}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.3rem' }}>{size}</label>
                      <input 
                        type="number" 
                        min="0"
                        value={newProduct.inventory?.[size] || 0} 
                        onChange={e => setNewProduct({
                          ...newProduct,
                          inventory: { ...newProduct.inventory, [size]: parseInt(e.target.value) || 0 }
                        })}
                        style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* === TAMANHOS INDISPONÍVEIS (FÁBRICA) === */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#EF4444', marginBottom: '1rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <X size={16} /> Bloquear Tamanhos (Fábrica não produz)
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SIZES.map(size => {
                    const isUnavailable = newProduct.unavailable_sizes?.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const current = newProduct.unavailable_sizes || [];
                          const updated = isUnavailable 
                            ? current.filter(s => s !== size)
                            : [...current, size];
                          setNewProduct({ ...newProduct, unavailable_sizes: updated });
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '4px',
                          border: `1px solid ${isUnavailable ? '#EF4444' : 'var(--border-color)'}`,
                          background: isUnavailable ? '#EF4444' : 'transparent',
                          color: isUnavailable ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
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
                    if (file && (file.type.startsWith('image/') || file.type === 'video/mp4')) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                      setNewProduct({ ...newProduct, image: '' });
                    }
                  }}
                >
                  <input
                    id="image-upload-new"
                    type="file"
                    accept="image/*,video/mp4"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                        setNewProduct({ ...newProduct, image: '' });
                      }
                    }}
                  />
                  {imagePreview ? (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <ProductMedia 
                        src={imagePreview} 
                        style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                      />
                      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700 }}>✅ Mídia pronta para upload</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{imageFile?.name}</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Clique ou arraste uma mídia aqui</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>PNG, JPG, WEBP ou MP4 — upload direto para o Supabase</p>
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
                  onChange={e => { setNewProduct({ ...newProduct, image: e.target.value }); if (e.target.value) { setImageFile(null); setImagePreview(null); } }}
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
                      <ProductMedia src={prev} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        accept="image/*,video/mp4"
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
                  <input required type="text" value={newTestimonial.name} onChange={e => setNewTestimonial({ ...newTestimonial, name: e.target.value })} placeholder="Ex: Andre Oliveira" style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Localização</label>
                  <input type="text" value={newTestimonial.location} onChange={e => setNewTestimonial({ ...newTestimonial, location: e.target.value })} placeholder="Toronto, ON" style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>URL da Foto do Cliente (Opcional)</label>
                <input type="url" value={newTestimonial.avatar_url} onChange={e => setNewTestimonial({ ...newTestimonial, avatar_url: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Data do Feedback (Pode retroceder p/ 2022)</label>
                <input required type="date" value={newTestimonial.date} onChange={e => setNewTestimonial({ ...newTestimonial, date: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mensagem / Depoimento</label>
                <textarea required value={newTestimonial.content} onChange={e => setNewTestimonial({ ...newTestimonial, content: e.target.value })} rows={4} style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', resize: 'none' }} />
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
                <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregar Tabela</label>
                  <select 
                    value={Number(editingProduct.price).toFixed(2)}
                    onChange={(e) => {
                      if (e.target.value) setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) });
                    }} 
                    style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#3B82F6', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">-- Autopreencher Preço --</option>
                    <optgroup label="Camisas">
                      <option value="47.90">Fã Lisa (CA$ 47.90)</option>
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
                      <option value="47.90">Shorts Fã (CA$ 47.90)</option>
                      <option value="69.90">Shorts Jogador (CA$ 69.90)</option>
                      <option value="159.90">Corta Vento (CA$ 159.90)</option>
                    </optgroup>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Preço Atualizado (CAD) *</label>
                  <input required type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Versão *</label>
                  <select required value={editingProduct.version} onChange={e => setEditingProduct({ ...editingProduct, version: e.target.value })} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <option value="">Selecione...</option>
                    <option value="Torcedor">Torcedor</option>
                    <option value="Jogador">Jogador</option>
                    <option value="Retrô">Retrô</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Categoria *</label>
                  <select required value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
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
                    onChange={e => setEditingProduct({ ...editingProduct, league: e.target.value })}
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
                    onChange={e => setEditingProduct({ ...editingProduct, team: e.target.value })}
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
                    onChange={e => setEditingProduct({ ...editingProduct, is_bestseller: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#EF4444' }}
                  />
                  Mais Vendido 🔥
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingProduct.is_new}
                    onChange={e => setEditingProduct({ ...editingProduct, is_new: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: '#FFB81C' }}
                  />
                  Novo ⭐
                </label>
              </div>

              {/* === ESTOQUE POR TAMANHO (EDIÇÃO) === */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-color)', marginBottom: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>⚡ Estoque Pronta Entrega (Canada)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.8rem' }}>
                  {SIZES.map(size => (
                    <div key={size}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.3rem' }}>{size}</label>
                      <input 
                        type="number" 
                        min="0"
                        value={editingProduct.inventory?.[size] || 0} 
                        onChange={e => setEditingProduct({
                          ...editingProduct,
                          inventory: { ...editingProduct.inventory, [size]: parseInt(e.target.value) || 0 }
                        })}
                        style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* === TAMANHOS INDISPONÍVEIS (FÁBRICA) === */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#EF4444', marginBottom: '1rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <X size={16} /> Bloquear Tamanhos (Fábrica não produz)
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SIZES.map(size => {
                    const isUnavailable = editingProduct.unavailable_sizes?.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const current = editingProduct.unavailable_sizes || [];
                          const updated = isUnavailable 
                            ? current.filter(s => s !== size)
                            : [...current, size];
                          setEditingProduct({ ...editingProduct, unavailable_sizes: updated });
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '4px',
                          border: `1px solid ${isUnavailable ? '#EF4444' : 'var(--border-color)'}`,
                          background: isUnavailable ? '#EF4444' : 'transparent',
                          color: isUnavailable ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>* Tamanhos marcados em vermelho serão removidos da loja para este produto.</p>
              </div>

              {/* === UPLOAD DE IMAGEM (EDIÇÃO) === */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  📸 Imagem do Produto
                </label>

                {/* Preview da imagem atual */}
                {editingProduct.image && !editImagePreview && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ProductMedia
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
                    if (file && (file.type.startsWith('image/') || file.type === 'video/mp4')) {
                      setEditImageFile(file);
                      setEditImagePreview(URL.createObjectURL(file));
                    }
                  }}
                >
                  <input
                    id="image-upload-edit"
                    type="file"
                    accept="image/*,video/mp4"
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
                      <ProductMedia src={editImagePreview} style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 700 }}>✅ Nova mídia pronta para upload</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🔄</div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>Clique para substituir a mídia</p>
                      <p style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>Imagens ou Vídeos MP4</p>
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
                  onChange={e => !editImageFile && setEditingProduct({ ...editingProduct, image: e.target.value })}
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
                        <ProductMedia src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => {
                            const newGal = [...editingProduct.gallery];
                            newGal.splice(idx, 1);
                            setEditingProduct({ ...editingProduct, gallery: newGal });
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

                    {((editingProduct.gallery || []).length + editGalleryFiles.length) < 5 && (
                      <label style={{ width: '100%', aspectRatio: '1/1', border: '2px dashed var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/mp4"
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
            <strong style={{ color: '#EF4444', marginBottom: '2.5rem', display: 'block', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-sm)', width: '100%' }}>Pedido #{orderToDelete.id.slice(0, 8)} - {orderToDelete.customer_name}</strong>

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

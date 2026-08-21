import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { trackEvent } from '../services/analytics';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

// Constantes de persistência fora do componente para evitar problemas de hoisting e escopo
const GUEST_KEY = 'ifooty_cart_guest';
const getCartKey = (user) => user ? `ifooty_cart_${user?.id}` : GUEST_KEY;

// Função auxiliar para obter o ID do usuário do localStorage de forma robusta e síncrona
const getUserIdFromLocalStorage = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          const userId = parsed?.user?.id;
          if (userId) return userId;
        }
      }
    }
  } catch (e) {
    console.error("Erro ao recuperar userId do localStorage:", e);
  }
  return null;
};

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  // Rastreia o usuário anterior para detectar transição login→logout
  const prevUserRef = useRef(undefined);
  
  // Inicialização síncrona imediata baseada no localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      // 1. Tenta usar o ID do usuário do contexto de autenticação
      let userId = user?.id;
      
      // 2. Se não estiver no contexto, tenta extrair da chave do Supabase v2 no localStorage
      if (!userId) {
        userId = getUserIdFromLocalStorage();
      }
      
      const key = userId ? `ifooty_cart_${userId}` : GUEST_KEY;
      return JSON.parse(localStorage.getItem(key) || localStorage.getItem(GUEST_KEY) || '[]');
    } catch { 
      return []; 
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cartReady, setCartReady] = useState(false); // TRAVA DE SEGURANÇA
  
  const [pricing, setPricing] = useState({
    nameNumber: 11.90, patch: 5.00, size2XL3XL: 7.90, size4XL: 11.90,
    shippingCost: 0, freeShippingThreshold: 0,
    discounts: [{ qty: 2, percent: 4 }, { qty: 3, percent: 7 }, { qty: 5, percent: 10 }, { qty: 10, percent: 15 }]
  });

  // 1. Efeito de Carregamento e Sincronização (Login/Logout/Refresh)
  useEffect(() => {
    const initializeCart = async () => {
      if (authLoading) return; // ESPERA O LOGIN CONCLUIR
      
      setCartReady(false); // Bloqueia salvamento enquanto inicializa
      
      if (!user) {
        const wasLoggedIn = prevUserRef.current && prevUserRef.current !== undefined;

        if (wasLoggedIn) {
          // CENÁRIO: Logout — limpa a cesta completamente
          // Remove também o cache local do usuário que saiu
          try {
            const oldKey = `ifooty_cart_${prevUserRef.current.id}`;
            localStorage.removeItem(oldKey);
          } catch (e) {}
          setCartItems([]);
          toast.success('Você saiu da conta. Sacola limpa. 🛒');
        } else {
          // CENÁRIO: Visitante (app iniciou sem login)
          const guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
          setCartItems(guestItems);
        }

        prevUserRef.current = null;
        setCartReady(true);
        return;
      }

      setIsSyncing(true);
      try {
        // Busca a cesta da nuvem para o usuário logado
        const { data: profile } = await supabase
          .from('profiles')
          .select('cart')
          .eq('id', user.id)
          .single();
          
        let cloudItems = profile?.cart || [];
        const guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
        const localItems = JSON.parse(localStorage.getItem(getCartKey(user)) || '[]');
        
        let merged = [...cloudItems];

        // Se houver itens de visitante AO LOGAR, eles migram para a conta e limpamos o cache de convidado
        if (guestItems.length > 0) {
          guestItems.forEach(g => {
            const exists = merged.find(m => m.cartId === g.cartId);
            if (exists) {
              exists.quantity += g.quantity;
            } else {
              merged.push(g);
            }
          });
          localStorage.removeItem(GUEST_KEY);
          toast.success("Sacola sincronizada com sua conta! ⚽");
        } else if (cloudItems.length === 0 && localItems.length > 0) {
          // Se a nuvem está vazia mas o local tem itens, mantemos o local (evita reset por delay/falha de sync)
          merged = localItems;
        } else if (cloudItems.length > 0) {
          // Se ambos possuem itens, mesclamos para garantir que nada seja perdido
          if (localItems.length > 0) {
            localItems.forEach(l => {
              const exists = merged.find(m => m.cartId === l.cartId);
              if (!exists) {
                merged.push(l);
              } else {
                exists.quantity = Math.max(exists.quantity, l.quantity);
              }
            });
          }
          toast.success("Sua sacola foi recuperada! 🛒");
        }
        
        setCartItems(merged);
      } catch (err) {
        console.error("Erro ao sincronizar cesta:", err);
        // Fallback: tenta recuperar o carrinho do localStorage caso a requisição falhe
        try {
          const key = `ifooty_cart_${user.id}`;
          const localSaved = JSON.parse(localStorage.getItem(key) || '[]');
          if (localSaved.length > 0) setCartItems(localSaved);
        } catch (e) {}
      } finally {
        prevUserRef.current = user; // Atualiza referência DEPOIS de sincronizar
        setIsSyncing(false);
        setCartReady(true); // LIBERA O SALVAMENTO APENAS AQUI
      }
    };

    initializeCart();
  }, [user, authLoading]);

  // 2. Efeito de Salvamento (Backup Local e Nuvem)
  const dbSyncTimeout = useRef(null);
  useEffect(() => {
    // PROTEÇÃO: Nunca salva se ainda estiver sincronizando ou se o estado não estiver pronto
    if (!cartReady || isSyncing) return; 

    // A. Backup Local (Chave dinâmica: user.id ou GUEST_KEY)
    try {
      localStorage.setItem(getCartKey(user), JSON.stringify(cartItems));
    } catch (e) {}

    // B. Sincronização Cloud (Apenas se houver usuário autenticado)
    if (user) {
      if (dbSyncTimeout.current) clearTimeout(dbSyncTimeout.current);
      dbSyncTimeout.current = setTimeout(async () => {
        try {
          // Usa upsert para garantir que funciona mesmo se o perfil ainda não existir na tabela
          const { error } = await supabase
            .from('profiles')
            .upsert(
              { id: user.id, cart: cartItems },
              { onConflict: 'id', ignoreDuplicates: false }
            );
            
          if (error) {
            console.error('Erro ao salvar cesta na nuvem:', error.message, error.details);
          }
        } catch (err) {
          console.error('Erro inesperado ao salvar cesta:', err);
        }
      }, 1500); // Debounce de 1.5s
    }
  }, [cartItems, user, cartReady, isSyncing]);

  useEffect(() => {
    async function loadPricing() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'pricing').single();
      if(data && data.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (parsed) {
            parsed.patch = 5.00; // Force patch cost to 5.00 CAD
          }
          setPricing(parsed);
        } catch(e) {}
      }
    }
    loadPricing();
  }, []);

  const addToCart = (product, size, extras = { nameNumber: false, patch: false, customPatch: '', extraCustomization: false, onlyShirt: false }, quantity = 1) => {
    const isKids = product?.category?.toLowerCase().includes('infantil') ||
      product?.name?.toLowerCase().includes('infantil') ||
      product?.name?.toLowerCase().includes('kids');

    let basePrice = product.price || 69.90;
    if (isKids) {
      if (extras.onlyShirt) {
        if (['16', '18', '20', '22'].includes(size)) {
          basePrice = 37.90;
        } else if (['24', '26', '28'].includes(size)) {
          basePrice = 42.90;
        }
      } else {
        if (['16', '18', '20', '22'].includes(size)) {
          basePrice = 49.90;
        } else if (['24', '26', '28'].includes(size)) {
          basePrice = 54.90;
        }
      }
    }
    
    let addonsPrice = 0;
    if (['2XL', '3XL'].includes(size)) addonsPrice += pricing.size2XL3XL || 7.00;
    if (size === '4XL') addonsPrice += pricing.size4XL || 10.00;
    if (extras.nameNumber) addonsPrice += pricing.nameNumber || 12.00;
    if (extras.patch) addonsPrice += pricing.patch || 5.00;
    if (extras.extraCustomization) addonsPrice += 6.90;

    const finalPrice = basePrice + addonsPrice;
    const cartId = `${product.id}-${size}-${extras.nameNumber ? 'yes' : 'no'}-${extras.patch ? 'yes' : 'no'}-${extras.extraCustomization ? 'yes' : 'no'}-${extras.onlyShirt ? 'yes' : 'no'}-${extras.customName || ''}-${extras.customNumber || ''}-${extras.customExtraName || ''}-${extras.customPatch || ''}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) {
        return prev.map(item =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        cartId, 
        size, 
        extras, 
        addonsPrice, 
        basePrice, 
        quantity, 
        price: finalPrice,
        addedAt: new Date().toISOString()
      }];
    });
    setIsCartOpen(true);

    trackEvent('AddToCart', {
      content_name: product.name,
      content_category: product.category || 'Catálogo',
      content_ids: [product.id],
      content_type: 'product',
      value: finalPrice,
      currency: 'CAD',
      quantity: 1
    }, {
      email: user?.email,
      phone: user?.phone || user?.user_metadata?.phone,
      firstName: user?.user_metadata?.full_name?.split(' ')[0],
      lastName: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ')
    });
  };

  const removeFromCart = (cartId) => {
    const item = cartItems.find(i => i.cartId === cartId);
    if (item) {
      trackEvent('Remove From Cart', {
        content_name: item.name,
        content_ids: [item.id],
        size: item.size,
        quantity: item.quantity,
        value: item.price * item.quantity
      });
    }
    setCartItems(prev => prev.filter(i => i.cartId !== cartId));
  };

  const clearCart = async () => {
    setCartItems([]);
    try { 
      const key = getCartKey(user);
      localStorage.setItem(key, '[]'); 
      localStorage.setItem(GUEST_KEY, '[]');
      
      // Sincronização IMEDIATA com o banco se houver usuário
      if (user) {
        if (dbSyncTimeout.current) clearTimeout(dbSyncTimeout.current);
        await supabase
          .from('profiles')
          .update({ cart: [] })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error("Erro ao limpar carrinho:", err);
    }
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity <= 0) return removeFromCart(cartId);
    setCartItems(prev =>
      prev.map(item =>
        item.cartId === cartId ? { ...item, quantity } : item
      )
    );
  };

  const computeTotals = () => {
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const baseSubtotal = cartItems.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);
    
    let discount = 0;
    
    // Buscar o maior patamar de desconto atingido
    const sortedDiscounts = (pricing.discounts || []).sort((a,b) => b.qty - a.qty);
    const matchedDiscount = sortedDiscounts.find(d => totalItems >= d.qty);
    
    if (matchedDiscount) {
       const pct = matchedDiscount.percent || matchedDiscount.amount || 0;
       // Desconto aplica-se APENAS sobre o valor base acumulado
       discount = baseSubtotal * (pct / 100);
    }

    // Lógica de Frete
    let appliedShipping = 0;
    if (totalItems > 0) {
      const threshold = Number(pricing.freeShippingThreshold || 0);
      const cost = Number(pricing.shippingCost || 0);
      
      if (threshold > 0 && subtotal >= threshold) {
        appliedShipping = 0;
      } else {
        appliedShipping = cost;
      }
    }

    let couponDiscount = 0;
    if (appliedCoupon) {
      const isPromoOnlyCoupon = appliedCoupon.code === 'WEEK10' || appliedCoupon.code === 'OFERTA10' || appliedCoupon.code === 'WEEKLY10' || !!appliedCoupon.promo_only;
      
      if (isPromoOnlyCoupon) {
        // Desconto aplica-se APENAS às camisas que estão em promoção (is_sale: true)
        const promoItemsSubtotal = cartItems
          .filter(item => !!item.is_sale)
          .reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        couponDiscount = promoItemsSubtotal * (appliedCoupon.discount_percent / 100);
      } else {
        couponDiscount = Math.max(0, (subtotal - discount) * (appliedCoupon.discount_percent / 100));
      }
    }

    return {
      subtotal,
      discount,
      couponDiscount,
      appliedShipping,
      total: Math.max(0, subtotal - discount - couponDiscount + appliedShipping),
      totalItems
    };
  };

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ifooty_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [couponCode, setCouponCode] = useState(() => appliedCoupon?.code || '');
  const [couponError, setCouponError] = useState('');
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const applyCoupon = async (rawCode, currentUser = user) => {
    if (!rawCode) {
      setCouponError('Please enter a coupon code.');
      return { success: false, error: 'Please enter a coupon code.' };
    }
    const codeUpper = rawCode.toUpperCase().trim();
    setIsVerifyingCoupon(true);
    setCouponError('');

    try {
      if (codeUpper === 'WEEK10' || codeUpper === 'OFERTA10' || codeUpper === 'WEEKLY10') {
        const hasPromoItems = cartItems.some(item => !!item.is_sale);
        if (cartItems.length > 0 && !hasPromoItems) {
          const err = 'O cupom WEEK10 é válido apenas para camisas marcadas em promoção.';
          setCouponError(err);
          setIsVerifyingCoupon(false);
          return { success: false, error: err };
        }

        const couponObj = {
          code: codeUpper,
          discount_percent: 10,
          is_active: true,
          promo_only: true
        };
        setAppliedCoupon(couponObj);
        setCouponCode(codeUpper);
        sessionStorage.setItem('ifooty_applied_coupon', JSON.stringify(couponObj));
        setIsVerifyingCoupon(false);
        return { success: true, coupon: couponObj };
      }

      if (codeUpper === 'FIRST20') {
        if (!currentUser) {
          const err = 'This coupon is only available for registered customers. Please sign in or create an account.';
          setCouponError(err);
          setIsVerifyingCoupon(false);
          return { success: false, error: err };
        }
        const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id);
        if ((count ?? 0) > 0) {
          const err = 'This coupon is valid for first-time purchases only.';
          setCouponError(err);
          setIsVerifyingCoupon(false);
          return { success: false, error: err };
        }
        const couponObj = {
          code: 'FIRST20',
          discount_percent: 20,
          is_active: true
        };
        setAppliedCoupon(couponObj);
        setCouponCode(codeUpper);
        sessionStorage.setItem('ifooty_applied_coupon', JSON.stringify(couponObj));
        setIsVerifyingCoupon(false);
        return { success: true, coupon: couponObj };
      }

      const { data, error } = await supabase.from('coupons').select('*')
        .eq('code', codeUpper).eq('is_active', true).single();

      if (error || !data) {
        const err = 'Invalid or expired coupon code.';
        setCouponError(err);
        setIsVerifyingCoupon(false);
        return { success: false, error: err };
      }

      const couponObj = {
        code: data.code,
        discount_percent: data.discount_percent || 10,
        is_active: true,
        ...data
      };
      setAppliedCoupon(couponObj);
      setCouponCode(data.code);
      sessionStorage.setItem('ifooty_applied_coupon', JSON.stringify(couponObj));
      setIsVerifyingCoupon(false);
      return { success: true, coupon: couponObj };
    } catch (err) {
      console.error('Error applying coupon:', err);
      const errMsg = 'Error applying coupon.';
      setCouponError(errMsg);
      setIsVerifyingCoupon(false);
      return { success: false, error: errMsg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    sessionStorage.removeItem('ifooty_applied_coupon');
  };

  const { subtotal, discount, couponDiscount, appliedShipping, total: cartTotal, totalItems } = computeTotals();

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        discount,
        couponDiscount,
        appliedCoupon,
        setAppliedCoupon,
        couponCode,
        setCouponCode,
        couponError,
        setCouponError,
        isVerifyingCoupon,
        applyCoupon,
        removeCoupon,
        appliedShipping,
        cartTotal,
        totalItems,
        pricingConfig: pricing
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

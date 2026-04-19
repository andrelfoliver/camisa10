import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

// Constantes de persistência fora do componente para evitar problemas de hoisting e escopo
const GUEST_KEY = 'ifooty_cart_guest';
const getCartKey = (user) => user ? `ifooty_cart_${user?.id}` : GUEST_KEY;

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Inicialização síncrona imediata baseada no localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      // Aqui usamos o user SE ele já estiver disponível no mount (o que acontece se AuthContext estiver pronto)
      const key = getCartKey(user);
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cartReady, setCartReady] = useState(false); // TRAVA DE SEGURANÇA
  
  const [pricing, setPricing] = useState({
    nameNumber: 11.90, patch: 3.90, size2XL3XL: 7.90, size4XL: 11.90,
    shippingCost: 0, freeShippingThreshold: 0,
    discounts: [{ qty: 2, percent: 8 }, { qty: 3, percent: 12 }, { qty: 5, percent: 15 }, { qty: 10, percent: 20 }]
  });

  // 1. Efeito de Carregamento e Sincronização (Login/Logout/Refresh)
  useEffect(() => {
    const initializeCart = async () => {
      setCartReady(false); // Bloqueia salvamento enquanto inicializa
      
      if (!user) {
        // CENÁRIO: Logout ou Visitante
        // Se deslogou, limpamos o estado atual e voltamos para o carrinho de convidado (se houver)
        const guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
        setCartItems(guestItems);
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
        } else if (cloudItems.length > 0) {
          toast.success("Sua sacola foi recuperada! 🛒");
        }
        
        setCartItems(merged);
      } catch (err) {
        console.error("Erro ao sincronizar cesta:", err);
        // Em caso de erro, mantemos o que já estava no state (carregado via localStorage no mount)
      } finally {
        setIsSyncing(false);
        setCartReady(true); // LIBERA O SALVAMENTO APENAS AQUI
      }
    };

    initializeCart();
  }, [user]);

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
          const { error } = await supabase
            .from('profiles')
            .update({ cart: cartItems })
            .eq('id', user.id);
            
          if (error) throw error;
        } catch (err) {
          console.error("Erro ao salvar cesta na nuvem:", err);
          // Opcional: Notificar o usuário se falhar repetidamente
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
          setPricing(parsed);
        } catch(e) {}
      }
    }
    loadPricing();
  }, []);

  const addToCart = (product, size, extras = { nameNumber: false, patch: false }) => {
    let basePrice = product.price || 69.90;
    
    let addonsPrice = 0;
    if (['2XL', '3XL'].includes(size)) addonsPrice += pricing.size2XL3XL || 7.00;
    if (size === '4XL') addonsPrice += pricing.size4XL || 10.00;
    if (extras.nameNumber) addonsPrice += pricing.nameNumber || 12.00;
    if (extras.patch) addonsPrice += pricing.patch || 5.00;

    const finalPrice = basePrice + addonsPrice;
    const cartId = `${product.id}-${size}-${extras.nameNumber}-${extras.patch}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) {
        return prev.map(item =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartId, size, extras, addonsPrice, basePrice, quantity: 1, price: finalPrice }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCartItems([]);
    try { 
      localStorage.removeItem(getCartKey()); 
      // Limpa também o guest por segurança se houver login
      localStorage.removeItem(GUEST_KEY);
    } catch {}
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
    
    if (matchedDiscount && matchedDiscount.percent) {
       // Desconto aplica-se APENAS sobre o valor base acumulado
       discount = baseSubtotal * (matchedDiscount.percent / 100);
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

    return {
      subtotal,
      discount,
      appliedShipping,
      total: Math.max(0, subtotal - discount + appliedShipping),
      totalItems
    };
  };

  const { subtotal, discount, appliedShipping, total: cartTotal, totalItems } = computeTotals();

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

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isInitialLoad = useRef(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Chave base do localStorage (Fallback e Visitante)
  const GUEST_KEY = 'ifooty_cart_guest';
  const getCartKey = () => user ? `ifooty_cart_${user.id}` : GUEST_KEY;

  const [pricing, setPricing] = useState({
    nameNumber: 11.90,
    patch: 3.90,
    size2XL3XL: 7.90,
    size4XL: 11.90,
    shippingCost: 0,
    freeShippingThreshold: 0,
    discounts: [
      { qty: 2, percent: 8 },
      { qty: 3, percent: 12 },
      { qty: 5, percent: 15 },
      { qty: 10, percent: 20 }
    ]
  });

  // Efeito de Sincronização de Login/Logout
  useEffect(() => {
    const syncCart = async () => {
      const localSaved = JSON.parse(localStorage.getItem(getCartKey()) || '[]');
      
      if (user) {
        setIsSyncing(true);
        try {
          // 1. Busca a cesta da nuvem
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('cart')
            .eq('id', user.id)
            .single();

          let cloudItems = (profile && profile.cart) ? profile.cart : [];
          const guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
          
          let finalItems = [...cloudItems];

          // 2. Mescla itens do convidado se houver
          if (guestItems.length > 0) {
            guestItems.forEach(gItem => {
              const exists = finalItems.find(m => m.cartId === gItem.cartId);
              if (exists) {
                exists.quantity += gItem.quantity;
              } else {
                finalItems.push(gItem);
              }
            });
            localStorage.removeItem(GUEST_KEY);
            toast.success("Cesta recuperada e sincronizada! ⚽", { duration: 3000 });
          } else if (isInitialLoad.current && cloudItems.length > 0) {
            toast.success("Sua cesta está pronta! ⚽", { icon: '🛒' });
          }

          setCartItems(finalItems);
        } catch (err) {
          console.error("Erro ao sincronizar cesta:", err);
          setCartItems(localSaved);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setCartItems(localSaved);
      }
      isInitialLoad.current = false;
    };

    syncCart();
  }, [user]);

  // Salva o carrinho localmente e na nuvem
  const dbSyncTimeout = useRef(null);

  useEffect(() => {
    if (isInitialLoad.current || isSyncing) return;

    // Salva Localmente sempre (Backup)
    try {
      localStorage.setItem(getCartKey(), JSON.stringify(cartItems));
    } catch {}

    // Salva na Nuvem (Sync) se houver usuário
    if (user) {
      if (dbSyncTimeout.current) clearTimeout(dbSyncTimeout.current);
      
      dbSyncTimeout.current = setTimeout(async () => {
        try {
          await supabase
            .from('profiles')
            .update({ cart: cartItems })
            .eq('id', user.id);
        } catch (err) {
          console.error("Erro ao salvar cesta na nuvem:", err);
        }
      }, 1000); // Debounce de 1s
    }
  }, [cartItems, user, isSyncing]);

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
    try { localStorage.removeItem('ifooty_cart'); } catch {}
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

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
  
  // Chave base do localStorage
  const GUEST_KEY = 'ifooty_cart_guest';
  const getCartKey = () => user ? `ifooty_cart_${user.email}` : GUEST_KEY;

  const [pricing, setPricing] = useState({
    nameNumber: 11.90,
    patch: 3.90,
    size2XL3XL: 7.90,
    size4XL: 11.90,
    discounts: [
      { qty: 2, percent: 8 },
      { qty: 3, percent: 12 },
      { qty: 5, percent: 15 },
      { qty: 10, percent: 20 }
    ]
  });

  // Efeito de Sincronização de Login/Logout
  useEffect(() => {
    const currentKey = getCartKey();
    const savedItems = JSON.parse(localStorage.getItem(currentKey) || '[]');
    
    if (user) {
      // Se acabou de logar e havia itens como "convidado", perguntar ou mesclar
      const guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
      if (guestItems.length > 0) {
        // Mescla itens do convidado com os do usuário (evitando duplicatas exatas)
        const merged = [...savedItems];
        guestItems.forEach(gItem => {
          const exists = merged.find(m => m.cartId === gItem.cartId);
          if (exists) {
            exists.quantity += gItem.quantity;
          } else {
            merged.push(gItem);
          }
        });
        setCartItems(merged);
        localStorage.removeItem(GUEST_KEY);
        toast.success("Recuperamos seu carrinho! ⚽", { duration: 4000 });
      } else if (savedItems.length > 0 && isInitialLoad.current) {
        setCartItems(savedItems);
        toast.success("Bem-vindo de volta! Sua cesta está pronta. ⚽", { icon: '🛒' });
      } else {
        setCartItems(savedItems);
      }
    } else {
      setCartItems(savedItems);
    }
    isInitialLoad.current = false;
  }, [user]);

  // Salva o carrinho na chave correta sempre que mudar
  useEffect(() => {
    if (isInitialLoad.current) return;
    try {
      localStorage.setItem(getCartKey(), JSON.stringify(cartItems));
    } catch {}
  }, [cartItems, user]);

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

    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      totalItems
    };
  };

  const { subtotal, discount, total: cartTotal, totalItems } = computeTotals();

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
        cartTotal,
        totalItems,
        pricingConfig: pricing
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

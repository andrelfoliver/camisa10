import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  // Carrega o carrinho do localStorage ao inicializar
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ifooty_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  
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

  // Salva o carrinho no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('ifooty_cart', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

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

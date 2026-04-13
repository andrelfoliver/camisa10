import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // extras = { nameNumber: boolean, patch: boolean }
  const addToCart = (product, size, extras = { nameNumber: false, patch: false }) => {
    
    // Base Price calculation
    let basePrice = product.price || 69.90;
    
    // Customizations
    let addonsPrice = 0;
    if (['2XL', '3XL', '4XL'].includes(size)) addonsPrice += 5.00;
    if (extras.nameNumber) addonsPrice += 9.90;
    if (extras.patch) addonsPrice += 4.90;

    const finalPrice = basePrice + addonsPrice;

    // A unique identifier combining item id, size and extras configuration
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
    
    // Calc discount on base shirts 
    let discount = 0;
    if (totalItems === 2) {
      discount = 9.90; // (2 * 69.90 = 139.80) -> 129.90
    } else if (totalItems >= 3) {
      const discountedBasePerShirt = 179.90 / 3; // 59.96
      discount = (69.90 - discountedBasePerShirt) * totalItems;
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
        updateQuantity,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        discount,
        cartTotal,
        totalItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};


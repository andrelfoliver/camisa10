import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  return useContext(WishlistContext);
};

const GUEST_KEY = 'ifooty_wishlist_guest';
const getWishlistKey = (user) => user ? `ifooty_wishlist_${user?.id}` : GUEST_KEY;

// Aux helper to extract user ID synchronously from Supabase auth token
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
    console.error("Error retrieving userId from localStorage:", e);
  }
  return null;
};

export const WishlistProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const prevUserRef = useRef(undefined);

  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      let userId = user?.id || getUserIdFromLocalStorage();
      const key = userId ? `ifooty_wishlist_${userId}` : GUEST_KEY;
      return JSON.parse(localStorage.getItem(key) || localStorage.getItem(GUEST_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [wishlistReady, setWishlistReady] = useState(false);

  // 1. Initial Load & Synchronization
  useEffect(() => {
    const initializeWishlist = async () => {
      if (authLoading) return;
      setWishlistReady(false);

      if (!user) {
        const wasLoggedIn = prevUserRef.current && prevUserRef.current !== undefined;
        if (wasLoggedIn) {
          try {
            const oldKey = `ifooty_wishlist_${prevUserRef.current.id}`;
            localStorage.removeItem(oldKey);
          } catch (e) {}
          setWishlistItems([]);
        } else {
          const guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
          setWishlistItems(guestItems);
        }
        prevUserRef.current = null;
        setWishlistReady(true);
        return;
      }

      setIsSyncing(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wishlist')
          .eq('id', user.id)
          .single();

        let cloudItems = profile?.wishlist || [];
        const guestItems = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
        const localItems = JSON.parse(localStorage.getItem(getWishlistKey(user)) || '[]');

        // Merge guest items into logged-in account if present
        let merged = [...cloudItems];
        if (guestItems.length > 0) {
          guestItems.forEach(g => {
            const exists = merged.find(m => m.id === g.id);
            if (!exists) merged.push(g);
          });
          localStorage.removeItem(GUEST_KEY);
        } else if (cloudItems.length === 0 && localItems.length > 0) {
          merged = localItems;
        } else if (cloudItems.length > 0 && localItems.length > 0) {
          localItems.forEach(l => {
            const exists = merged.find(m => m.id === l.id);
            if (!exists) merged.push(l);
          });
        }

        setWishlistItems(merged);
      } catch (err) {
        console.error("Error syncing wishlist:", err);
        try {
          const key = `ifooty_wishlist_${user.id}`;
          const localSaved = JSON.parse(localStorage.getItem(key) || '[]');
          if (localSaved.length > 0) setWishlistItems(localSaved);
        } catch (e) {}
      } finally {
        prevUserRef.current = user;
        setIsSyncing(false);
        setWishlistReady(true);
      }
    };

    initializeWishlist();
  }, [user, authLoading]);

  // 2. Local & Cloud Save Effect
  const dbSyncTimeout = useRef(null);
  useEffect(() => {
    if (!wishlistReady || isSyncing) return;

    try {
      localStorage.setItem(getWishlistKey(user), JSON.stringify(wishlistItems));
    } catch (e) {}

    if (user) {
      if (dbSyncTimeout.current) clearTimeout(dbSyncTimeout.current);
      dbSyncTimeout.current = setTimeout(async () => {
        try {
          await supabase
            .from('profiles')
            .upsert(
              { id: user.id, wishlist: wishlistItems },
              { onConflict: 'id', ignoreDuplicates: false }
            );
        } catch (err) {
          console.error('Error saving wishlist to cloud:', err);
        }
      }, 1500);
    }
  }, [wishlistItems, user, wishlistReady, isSyncing]);

  const toggleWishlist = (product) => {
    if (!product || !product.id) return;
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        toast.success(window.location.pathname.startsWith('/rebrand') ? 'Removed from Wishlist' : 'Removido da Lista de Desejos');
        return prev.filter(item => item.id !== product.id);
      } else {
        toast.success(window.location.pathname.startsWith('/rebrand') ? 'Added to Wishlist' : 'Adicionado à Lista de Desejos');
        return [...prev, {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image || product.images?.[0],
          category: product.category || 'Soccer'
        }];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { CheckCircle2, X } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

const NAMES = [
  // Brasileiros
  'João', 'Tiago', 'Lucas', 'Ricardo', 'Gabriel', 'Bruno', 'Carlos', 'Pedro', 'Marcelo', 'Arthur', 'Matheus', 'Guilherme', 'Felipe', 'Rafael',
  'André', 'Rodrigo', 'Leandro', 'Diego', 'Gustavo', 'Paulo', 'Marcos', 'Juliana', 'Aline', 'Fernanda', 'Fabrício', 'Roberto', 'Cássio',
  'Vinícius', 'Leonardo', 'Eduardo', 'Mariana', 'Beatriz', 'Camila', 'Letícia', 'Davi', 'Samuel', 'Daniel', 'Igor', 'Vitor',
  // Canadenses / Americanos
  'Liam', 'Emma', 'Olivia', 'Noah', 'William', 'Benjamin', 'Sophia', 'James', 'Logan', 'Ethan', 'Isabella', 'Mia', 'Lucas', 'Mason',
  'Harper', 'Evelyn', 'Jack', 'Aiden', 'Chloe', 'Zoe', 'Grace', 'Lily', 'Jackson', 'Avery', 'Scarlett', 'Madison'
];
const CITIES = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg', 'Brampton', 'Hamilton'];
const TIMES = ['há 2 minutos', 'agora mesmo', 'há 5 minutos', 'há 10 minutos', 'há 1 hora', 'há 15 minutos', 'há 3 minutos'];


const SalesPopup = () => {
  const { t, language, translateProductDisplay } = useLanguage();
  const [products, setProducts] = useState([]);
  const [realOrders, setRealOrders] = useState([]);
  const [currentSale, setCurrentSale] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Fetch Products for fallback or diversity
      const { data: productsData } = await supabase
        .from('products')
        .select('name, image, category')
        .not('name', 'ilike', '%costas%')
        .limit(40)
        .order('id', { ascending: false });
      
      if (productsData) setProducts(productsData);

      // Fetch Real Orders for authentic social proof
      const { data: ordersData } = await supabase
        .from('orders')
        .select('customer_name, shipping_address, items, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersData) setRealOrders(ordersData);
    }
    fetchData();
  }, []);

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return language === 'pt' ? 'agora mesmo' : 'just now';
    if (diffInMinutes < 60) {
      return language === 'pt' ? `há ${diffInMinutes} minutos` : `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return language === 'pt' ? `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}` : `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return language === 'pt' ? `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}` : `${diffInDays}d ago`;
  };

  useEffect(() => {
    // We need either products or real orders to work
    if (products.length === 0 && realOrders.length === 0) return;

    let timeoutId;

    const runSaleRoutine = () => {
      let saleData = {};

      // Decide if we use a real order (70% chance if available) or a random product
      const useRealOrder = realOrders.length > 0 && (Math.random() < 0.7 || products.length === 0);

      if (useRealOrder) {
        const order = realOrders[Math.floor(Math.random() * realOrders.length)];
        // Get a random item from this order
        const item = order.items && order.items.length > 0 
          ? order.items[Math.floor(Math.random() * order.items.length)] 
          : null;
        
        // Find product image if possible
        const productInfo = products.find(p => p.name === item?.name);

        saleData = {
          name: order.customer_name ? order.customer_name.split(' ')[0] : NAMES[Math.floor(Math.random() * NAMES.length)],
          city: (order.shipping_address && order.shipping_address.city) || CITIES[Math.floor(Math.random() * CITIES.length)],
          productName: item ? item.name : products[0].name,
          image: productInfo ? productInfo.image : (products.find(p => p.image)?.image || null),
          time: getRelativeTime(order.created_at),
          isReal: true
        };
      } else {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        saleData = {
          name: NAMES[Math.floor(Math.random() * NAMES.length)],
          city: CITIES[Math.floor(Math.random() * CITIES.length)],
          productName: randomProduct.name,
          image: randomProduct.image,
          time: TIMES[Math.floor(Math.random() * TIMES.length)],
          isReal: false
        };
      }

      setCurrentSale(saleData);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
        const nextDelay = Math.floor(Math.random() * (90000 - 30000 + 1) + 30000);
        timeoutId = setTimeout(runSaleRoutine, nextDelay);
      }, 5000);
    };

    timeoutId = setTimeout(runSaleRoutine, 10000);
    return () => clearTimeout(timeoutId);
  }, [products, realOrders]);

  const formatRelTime = (str) => {
    // If it's already a real relative time string from getRelativeTime, return it
    if (str.includes('ago') || str.includes('now') || str.includes('há') || str === 'agora mesmo') return str;
    
    // Fallback for old hardcoded TIMES array entries
    if (language === 'pt') return str;
    return str.replace('há ', '').replace(' minutos', 'm ago').replace(' minuto', 'm ago').replace(' hora', 'h ago').replace('agora mesmo', 'just now');
  };

  if (!currentSale) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'var(--surface-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 9999,
      maxWidth: '350px',
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(100px) scale(0.9)',
      opacity: visible ? 1 : 0,
      visibility: visible ? 'visible' : 'hidden',
      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      <button 
        onClick={() => setVisible(false)}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)'
        }}
      >
        <X size={14} />
      </button>

      {currentSale.image ? (
        <img 
          src={currentSale.image} 
          alt={currentSale.productName} 
          style={{ width: '50px', height: '50px', objectFit: 'contain', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} 
        />
      ) : (
        <div style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
          <CheckCircle2 color="var(--accent-color)" size={30} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-main)' }}>{currentSale.name}</strong> {language === 'pt' ? 'em' : 'in'} {currentSale.city} {t('sales_popup_bought')}
        </p>
        <p style={{ margin: '2px 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-color)', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {translateProductDisplay(currentSale.productName)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
          <CheckCircle2 size={12} />
          <span>{t('sales_popup_time')} {formatRelTime(currentSale.time)}</span>
        </div>
      </div>
    </div>
  );
};

export default SalesPopup;

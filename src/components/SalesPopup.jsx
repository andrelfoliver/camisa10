import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { CheckCircle2, X } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

const NAMES = [
  // Brasileiros (Maioria)
  'João', 'Tiago', 'Lucas', 'Ricardo', 'Gabriel', 'Bruno', 'Carlos', 'Pedro', 'Marcelo', 'Arthur', 'Matheus', 'Guilherme', 'Felipe', 'Rafael',
  'André', 'Rodrigo', 'Leandro', 'Diego', 'Gustavo', 'Paulo', 'Marcos', 'Juliana', 'Aline', 'Fernanda', 'Fabrício', 'Roberto', 'Cássio',
  // Canadenses
  'Liam', 'Emma', 'Olivia', 'Noah', 'William', 'Benjamin', 'Sophia',
  // Indianos
  'Arjun', 'Priya', 'Rahul', 'Ananya', 'Vihaan', 'Aarav'
];
const CITIES = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg', 'Brampton', 'Hamilton'];
const TIMES = ['há 2 minutos', 'agora mesmo', 'há 5 minutos', 'há 10 minutos', 'há 1 hora', 'há 15 minutos', 'há 3 minutos'];


const SalesPopup = () => {
  const { t, language, translateProductDisplay } = useLanguage();
  const [products, setProducts] = useState([]);
  const [currentSale, setCurrentSale] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('name, image, category')
        .not('name', 'ilike', '%costas%') // Evitar mostrar variações de "costas"
        .limit(40)
        .order('id', { ascending: false });
      
      if (data && data.length > 0) {
        setProducts(data);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    let timeoutId;

    const runSaleRoutine = () => {
      // Pick random sale data
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const randomTime = TIMES[Math.floor(Math.random() * TIMES.length)];

      setCurrentSale({
        name: randomName,
        city: randomCity,
        productName: randomProduct.name,
        image: randomProduct.image,
        time: randomTime
      });

      // Show popup
      setVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
        
        // Schedule next popup between 30 and 90 seconds
        const nextDelay = Math.floor(Math.random() * (90000 - 30000 + 1) + 30000);
        timeoutId = setTimeout(runSaleRoutine, nextDelay);
      }, 5000);
    };

    // Initial delay of 10 seconds before first popup
    timeoutId = setTimeout(runSaleRoutine, 10000);

    return () => clearTimeout(timeoutId);
  }, [products]);

  const formatRelTime = (str) => {
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

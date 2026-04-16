import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  pt: {
    nav_home: 'Home',
    nav_br: 'Brasileirão',
    nav_intl: 'Internacionais',
    nav_retro: 'Retrô',
    nav_admin: 'Admin',
    hero_title_part1: 'VISTA AS CORES DO SEU TIME MESMO ',
    hero_title_accent: 'LONGE DE CASA',
    hero_subtitle: 'Camisas brasileiras, europeias e internacionais',
    hero_satisfied_clients: '⭐ +200 clientes satisfeitos no Canadá',
    hero_shipping_all: 'Todo o Canadá',
    hero_shipping_calgary: 'Entrega prioritária para Calgary',
    hero_shipping_guaranteed: 'Entrega garantida',
    hero_shipping_moneyback: 'Ou devolução do dinheiro',
    hero_btn_guarantee: 'GARANTIR MINHA CAMISA',
    hero_btn_view_all: 'Ver todas as camisas',
    btn_shop_now: 'Ver Catálogo',
    section_favorites: 'Nossas Queridinhas',
    section_best_seller: 'Mais Vendida do Momento',
    section_categories: 'Navegue por Categorias',
    promo_banner_title: '🔥 OFERTA ESPECIAL',
    promo_banner_combo2: '2 Camisas',
    promo_banner_combo3: '3 Camisas',
    promo_banner_from: 'De',
    promo_banner_for: 'por apenas',
    promo_banner_each: 'cada',
    promo_banner_savings: 'Economia de',
    promo_banner_apply: 'Aplicar desconto',
    promo_banner_best_offer: 'Maior Desconto',
    product_price_transfer: 'no e-Transfer',
    product_customization: 'Personalização',
    product_customization_none: 'Não',
    product_customization_yes: 'Somente Personalizado',
    product_size: 'Tamanho',
    product_qty: 'Quantidade',
    product_buy_now: 'COMPRAR AGORA',
    product_wholesale_table: '🔥 Tabela de Atacado / Combos',
    product_wholesale_unit: 'unit.',
    product_wholesale_each: 'cada',
    cart_title: 'Minha Sacola',
    cart_empty: 'Sua sacola está vazia.',
    cart_subtotal: 'Subtotal',
    cart_discount: 'Desconto de Volume',
    cart_total: 'Total',
    cart_checkout: 'Finalizar Pedido',
    sales_popup_bought: 'comprou',
    sales_popup_time: 'Comprado'
  },
  en: {
    nav_home: 'Home',
    nav_br: 'Brazilian League',
    nav_intl: 'International',
    nav_retro: 'Retro',
    nav_admin: 'Admin',
    hero_title_part1: 'WEAR YOUR TEAM COLORS EVEN ',
    hero_title_accent: 'FAR FROM HOME',
    hero_subtitle: 'Brazilian, European and International Jerseys | Shipping across Canada',
    hero_satisfied_clients: '⭐ +200 satisfied customers in Canada',
    hero_shipping_all: 'All of Canada',
    hero_shipping_calgary: 'Priority delivery to Calgary',
    hero_shipping_guaranteed: 'Guaranteed delivery',
    hero_shipping_moneyback: 'Or money back guarantee',
    hero_btn_guarantee: 'GET YOUR JERSEY',
    hero_btn_view_all: 'View all jerseys',
    btn_shop_now: 'Shop Now',
    section_favorites: 'Our Favorites',
    section_best_seller: 'Current Best Seller',
    section_categories: 'Browse Categories',
    promo_banner_title: '🔥 SPECIAL OFFER',
    promo_banner_combo2: '2 Jerseys',
    promo_banner_combo3: '3 Jerseys',
    promo_banner_from: 'From',
    promo_banner_for: 'for only',
    promo_banner_each: 'each',
    promo_banner_savings: 'Savings of',
    promo_banner_apply: 'Apply Discount',
    promo_banner_best_offer: 'Best Offer',
    product_price_transfer: 'via e-Transfer',
    product_customization: 'Customization',
    product_customization_none: 'No',
    product_customization_yes: 'Personalized Only',
    product_size: 'Size',
    product_qty: 'Quantity',
    product_buy_now: 'BUY NOW',
    product_wholesale_table: '🔥 Wholesale Table / Combos',
    product_wholesale_unit: 'each',
    product_wholesale_each: 'each',
    cart_title: 'My Cart',
    cart_empty: 'Your cart is empty.',
    cart_subtotal: 'Subtotal',
    cart_discount: 'Volume Discount',
    cart_total: 'Total',
    cart_checkout: 'Checkout',
    sales_popup_bought: 'bought',
    sales_popup_time: 'Purchased'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('preferredLanguage') || 'pt');

  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const translateProductDisplay = (name) => {
    if (language === 'pt') return name;

    let translated = name;
    // Map of common Portuguese football terms to English
    const mapping = {
      'Camisa ': '',
      'Titular': 'Home Jersey',
      'Reserva': 'Away Jersey',
      'Terceira': 'Third Jersey',
      'Goleiro': 'Goalkeeper',
      'Treino': 'Training',
      'Infantil': 'Kids',
      'Feminina': 'Womens',
      'Jogador': 'Player Edition',
      'Torcedor': 'Fan Edition',
      'Fã': 'Fan Edition'
    };

    Object.entries(mapping).forEach(([pt, en]) => {
      const regex = new RegExp(pt, 'gi');
      translated = translated.replace(regex, en);
    });

    return translated.trim();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'pt' ? 'en' : 'pt');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, translateProductDisplay }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

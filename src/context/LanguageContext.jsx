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
    sales_popup_time: 'Comprado',
    stats_clients: 'Clientes satisfeitos no Canadá',
    stats_shipping: 'Taxa de envio no prazo',
    stats_whatsapp: 'Resposta média no WhatsApp',
    stats_payment: 'Pagamento seguro garantido',
    section_favorites_title: 'As Queridinhas 🇧🇷',
    section_favorites_subtitle: 'Deslize para ver os mantos sagrados mais pedidos.',
    promo_footer_note: '* Preços baseados na camisa padrão. O desconto se aplica a qualquer peça. Adicione à sacola e a mágica acontece!',
    customization_title: 'Deixe sua camisa única ✍️',
    customization_subtitle: 'Você poderá solicitar a personalização com a mesma fonte oficial dos jogadores diretamente dentro das opções do produto.',
    customization_item1: 'Nome + Número',
    customization_item2: 'Patch de Campeonatos',
    emotional_title: 'Porque ser torcedor não tem distância 🇧🇷',
    emotional_text: 'A saudade do seu país e a paixão pelo futebol vivem na mesma gaveta. Entregamos a qualidade de jogador profissional diretamente na sua porta no Canadá.',
    social_proof_title: 'Voz da Arquibancada 🗣️',
    social_proof_subtitle: 'Desde 2022, conectando brasileiros em todo o Canadá com seus mantos favoritos.',
    social_proof_client_since: 'Cliente desde',
    social_proof_swipe: 'Deslize lateralmente para ler mais →',
    faq_title: 'Dúvidas Rápidas',
    faq_q1: 'Vocês entregam em todo o Canadá?',
    faq_a1: 'Sim, enviamos para todas as províncias e cidades do Canadá com rastreamento.',
    faq_q2: 'Qual o prazo de entrega?',
    faq_a2: 'Entre 10 e 20 dias úteis, dependendo de sua região.',
    faq_q3: 'Como escolher o tamanho?',
    faq_a3: 'Use seu tamanho normal ou peça para ver a tabela de medidas no WhatsApp. Para estilo largo (streetwear), escolha um número maior.',
    faq_q4: 'O pagamento é seguro?',
    faq_a4: '100% Seguro através de gateways blindados, ou aceitamos e-Transfer via Interac.',
    cta_security: 'Site 100% Blindado',
    cta_title: 'Garanta sua camisa antes que acabe!',
    cta_btn: 'Ver Catálogo',
    footer_about: 'A sua conexão com o futebol, onde quer que você esteja. Especialistas em camisas de futebol para brasileiros no Canadá.',
    footer_links: 'Links Rápidos',
    footer_how_to_buy: 'Como Comprar',
    footer_about_us: 'Sobre Nós',
    footer_payment: 'Pagamento',
    footer_payment_desc: 'Aceitamos transferências Interac simples, rápidas e seguras.',
    footer_rights: 'Todos os direitos reservados.',
    footer_dev: 'Desenvolvido por',
    nav_selecoes: 'Seleções',
    nav_lancamentos: 'Lançamentos',
    footer_catalog: 'Catálogo',
    about_title: 'Nossa História ⚽',
    about_text1: 'Em 2022, a iFooty nasceu de um desejo simples, mas poderoso: aproximar os brasileiros no Canadá de suas raízes. Sabemos que uma camisa de futebol não é apenas uma peça de roupa, é uma segunda pele que carrega memórias, paixão e pertencimento.',
    about_text2: 'Localizados no coração do Canadá, nos especializamos em entregar mantos oficiais de alta qualidade, garantindo que cada grito de "gol" seja acompanhado pelo orgulho de vestir as cores do seu time do coração.'
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
    sales_popup_time: 'Purchased',
    stats_clients: 'Satisfied customers in Canada',
    stats_shipping: 'On-time shipping rate',
    stats_whatsapp: 'Avg response time on WhatsApp',
    stats_payment: 'Secure payment guaranteed',
    section_favorites_title: 'Trending Jerseys 🇧🇷',
    section_favorites_subtitle: 'Swipe to see the most requested holy mantles.',
    promo_footer_note: '* Prices based on standard jerseys. Discount applies to any item. Add to cart and the magic happens!',
    customization_title: 'Make your jersey unique ✍️',
    customization_subtitle: 'You can request customization with the same official font as the players directly in the product options.',
    customization_item1: 'Name + Number',
    customization_item2: 'League Patches',
    emotional_title: 'Because being a fan knows no distance 🇧🇷',
    emotional_text: 'The longing for your country and the passion for football live in the same drawer. We deliver professional player quality directly to your door in Canada.',
    social_proof_title: 'Voice of the Stands 🗣️',
    social_proof_subtitle: 'Since 2022, connecting Brazilians across Canada with their favorite mantles.',
    social_proof_client_since: 'Customer since',
    social_proof_swipe: 'Swipe to read more →',
    faq_title: 'Quick FAQ',
    faq_q1: 'Do you deliver across Canada?',
    faq_a1: 'Yes, we ship to all provinces and cities in Canada with tracking.',
    faq_q2: 'What is the delivery time?',
    faq_a2: 'Between 10 and 20 business days, depending on your region.',
    faq_q3: 'How to choose the size?',
    faq_a3: 'Use your normal size or ask to see the measurement table on WhatsApp. For a loose style (streetwear), choose one size up.',
    faq_q4: 'Is the payment secure?',
    faq_a4: '100% Secure through protected gateways, or we accept e-Transfer via Interac.',
    cta_security: '100% Shielded Site',
    cta_title: 'Guarantee your jersey before it sells out!',
    cta_btn: 'View Catalog',
    footer_about: 'Your connection to football, wherever you are. Specialized in football jerseys for Brazilians in Canada.',
    footer_links: 'Quick Links',
    footer_how_to_buy: 'How to Buy',
    footer_about_us: 'About Us',
    footer_payment: 'Payment',
    footer_payment_desc: 'We accept Interac e-Transfer, simple, fast and secure.',
    footer_rights: 'All rights reserved.',
    footer_dev: 'Developed by',
    nav_selecoes: 'National Teams',
    nav_lancamentos: 'New Arrivals',
    footer_catalog: 'Catalog',
    about_title: 'Our Story ⚽',
    about_text1: 'In 2022, iFooty was born from a simple but powerful desire: to help Brazilians in Canada feel closer to home. We know that a football jersey is not just a piece of clothing, it is a second skin that carries memories, passion, and belonging.',
    about_text2: 'Located in the heart of Canada, we specialize in delivering high-quality official fan jerseys, ensuring that every shout of "goal" is accompanied by the pride of wearing the colors of your heart team.'
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

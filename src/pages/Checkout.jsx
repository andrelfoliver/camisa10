import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogIn, MapPin, Truck, Save, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef, useMemo } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { CreditCard, MessageSquare } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { supabase } from '../services/supabase';
import { useLanguage } from '../context/LanguageContext';

const Checkout = () => {
  const { t, language } = useLanguage();
  const { cartItems, cartTotal, subtotal, discount, clearCart, appliedShipping, pricingConfig } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    phone: '',
    instagram: '',
    deliveryMethod: 'shipping', // 'shipping' | 'pickup'
    street: '',
    addressNumber: '',
    district: '',
    apartment: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
    saveAddress: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waNumber, setWaNumber] = useState('17788061419');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('whatsapp'); // 'whatsapp' | 'paypal'

  // Custom Notification State
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data && data.value) setWaNumber(data.value);
    }
    loadConfig();
  }, []);

  const addressInputRef = useRef(null);

  // Inicialização Moderna do Google Places (API New)
  useEffect(() => {
    let autocomplete;
    const initAutocomplete = async () => {
      try {
        if (!window.google || !window.google.maps || !window.google.maps.importLibrary) return;

        // Carrega a biblioteca 'places' dinamicamente
        const { Autocomplete } = await window.google.maps.importLibrary("places");

        if (!addressInputRef.current) return;

        autocomplete = new Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: 'ca' },
          fields: ['address_components', 'geometry'],
          types: ['address']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.address_components) return;

          let streetNumber = '';
          let route = '';
          let district = '';
          let city = '';
          let province = '';
          let postalCode = '';

          place.address_components.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) streetNumber = component.long_name;
            if (types.includes('route')) route = component.long_name;
            if (types.includes('sublocality_level_1') || types.includes('neighborhood')) district = component.long_name;
            if (types.includes('locality')) city = component.long_name;
            if (types.includes('administrative_area_level_1')) province = component.short_name;
            if (types.includes('postal_code')) postalCode = component.long_name;
          });

          setFormData(prev => ({
            ...prev,
            street: route,
            addressNumber: streetNumber,
            district: district,
            city: city,
            province: province,
            postalCode: postalCode
          }));
        });
      } catch (err) {
        console.error("📛 Error loading Google Places:", err);
      }
    };

    initAutocomplete();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          // Busca o perfil de forma segura para evitar erro 406
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id);

          if (data && data.length > 0) {
            const profile = data[0];
            setFormData(prev => ({
              ...prev,
              street: profile.street || '',
              apartment: profile.apartment || '',
              city: profile.city || '',
              province: profile.province || '',
              postalCode: profile.postal_code || ''
            }));
          }
        } catch (err) {
          console.warn("⚠️ Perfil não encontrado ou erro na busca:", err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  // Fallback: Busca secundária por Postal Code (Zippopotam) - Apenas se o Google falhar ou o usuário digitar manualmente
  useEffect(() => {
    const cleanPostal = formData.postalCode.replace(/\s/g, '').toUpperCase();
    // Só dispara se for exatamente 3 dígitos (FSA) e se a cidade/província estiverem vazias
    if (cleanPostal.length === 3 && (!formData.city || !formData.province)) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://api.zippopotam.us/ca/${cleanPostal}`);
          if (res.ok) {
            const data = await res.json();
            if (data.places && data.places.length > 0) {
              const place = data.places[0];
              setFormData(prev => ({
                ...prev,
                city: place['place name'],
                province: place['state abbreviation']
              }));
            }
          }
        } catch (err) {
          console.warn("Zippopotam fallback failed", err);
        }
      };
      fetchAddress();
    }
  }, [formData.postalCode]);

  const showPopup = (message, type = 'error') => {
    setNotification({ show: true, message, type });
  };

  const generateWhatsAppMessage = () => {
    const isPickup = formData.deliveryMethod === 'pickup';
    let message = `${t('checkout_wa_order_title')}\n\n`;
    message += `${t('checkout_wa_customer')} ${formData.name}\n`;
    message += `Telefone: ${formData.phone}\n`;
    
    if (isPickup) {
      message += `MÉTODO: 📍 RETIRADA (Wolf Willow, Calgary)\n\n`;
    } else {
      message += `MÉTODO: 🚚 ENTREGA VIA CORREIOS\n`;
      message += `Endereço: ${formData.street}, ${formData.addressNumber}${formData.apartment ? ', Unit ' + formData.apartment : ''}\n`;
      message += `Bairro: ${formData.district}\n`;
      message += `Cidade: ${formData.city}, ${formData.province}\n`;
      message += `Postal Code: ${formData.postalCode}\n`;
      message += `País: ${formData.country}\n\n`;
    }

    message += `\n${t('cart_subtotal')}: $${subtotal.toFixed(2)}\n`;
    if (discount > 0) message += `Desconto Qtd: -$${discount.toFixed(2)}\n`;
    if (appliedCoupon) message += `Cupom ${appliedCoupon.code}: -${appliedCoupon.discount_percent}% OFF\n`;
    message += `Frete: ${currentShipping === 0 ? 'GRÁTIS' : '$' + currentShipping.toFixed(2)}\n`;

    message += `\n${t('checkout_wa_total')} $${finalTotal.toFixed(2)} CAD\n`;
    message += `\n${t('checkout_wa_footer')}`;

    return message;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsVerifyingCoupon(true);
    setCouponError('');
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setCouponError('Cupom inválido ou expirado');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        if (data.agent_id) {
          localStorage.setItem('ifooty_referrer', data.agent_id);
        }
      }
    } catch (err) {
      setCouponError('Erro ao validar cupom');
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  // CÁLCULO DO TOTAL COM FRETE DINÂMICO
  const currentShipping = formData.deliveryMethod === 'pickup' ? 0 : appliedShipping;
  
  const finalTotal = appliedCoupon
    ? (subtotal - discount) * (1 - appliedCoupon.discount_percent / 100) + (currentShipping || 0)
    : (subtotal - discount + (currentShipping || 0));

  // Memoize PayPal options to avoid re-rendering
  const initialPayPalOptions = useMemo(() => ({
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: "CAD",
    intent: "capture",
  }), []);
  const validateForm = () => {
    // 1. Validações Básicas Comuns
    if (formData.name.trim().length < 3) {
      showPopup("Por favor, insira o seu nome completo real.");
      return false;
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      showPopup("Por favor, insira um telefone válido com 10 dígitos (DDD + Número).");
      return false;
    }

    // 2. Validações Específicas para Entrega
    if (formData.deliveryMethod === 'shipping') {
      if (!formData.street || !formData.addressNumber || !formData.city || !formData.province) {
        showPopup("Para entrega em casa, todos os campos de endereço são obrigatórios.");
        return false;
      }

      // Validação Postal Code (Canadá: A1B 2C3)
      const pcRegex = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i;
      if (!pcRegex.test(formData.postalCode)) {
        showPopup("Formato de Postal Code inválido. Exemplo correto: T2X 0V1");
        return false;
      }

      if (formData.district.trim().length < 2) {
        showPopup("Por favor, informe seu bairro.");
        return false;
      }
    }

    return true;
  };

  const saveOrderToDatabase = async (paymentDetails = null) => {
    try {
      // Buscar câmbio real USD -> CAD para registro no pedido
      let currentExchangeRate = 1.38; // Fallback de segurança
      try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateRes.json();
        if (rateData && rateData.rates && rateData.rates.CAD) {
          currentExchangeRate = rateData.rates.CAD;
        }
      } catch (errRate) {
        console.warn("⚠️ Não foi possível obter câmbio real em tempo real, usando fallback.");
      }

      const orderData = {
        user_id: user.id,
        customer_name: formData.name,
        customer_email: user.email,
        customer_phone: formData.phone,
        shipping_address: {
          method: formData.deliveryMethod,
          street: formData.deliveryMethod === 'pickup' ? 'Wolf Willow (Pickup)' : formData.street,
          number: formData.addressNumber,
          district: formData.district,
          apartment: formData.apartment,
          city: formData.deliveryMethod === 'pickup' ? 'Calgary' : formData.city,
          province: formData.deliveryMethod === 'pickup' ? 'AB' : formData.province,
          postalCode: formData.postalCode,
          country: formData.country
        },
        usd_cad_rate: currentExchangeRate,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          extras: item.extras || {}
        })),
        total_price: finalTotal,
        status: paymentDetails ? 'paid' : 'pending',
        payment_method: paymentDetails ? 'paypal' : 'whatsapp',
        payment_id: paymentDetails?.id || null,
        paid_at: paymentDetails ? new Date().toISOString() : null,
        referrer: localStorage.getItem('ifooty_referrer') || null,
        coupon_code: appliedCoupon?.code || null,
        coupon_discount: appliedCoupon ? (cartTotal - finalTotal) : 0
      };

      const { error: orderError } = await supabase.from('orders').insert([orderData]);
      if (orderError) throw orderError;

      // 1.2. Decrementar estoque local (Pronta Entrega)
      try {
        await Promise.all(cartItems.map(item => 
          supabase.rpc('decrement_product_stock', {
            product_id_input: item.id,
            size_input: item.size,
            quantity_input: item.quantity
          })
        ));
      } catch (stockErr) {
        console.warn("⚠️ Erro ao atualizar estoque (alguns itens podem não ser pronta entrega):", stockErr);
      }

      // 1.5. Notificar por E-mail
      try {
        await fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            order: {
              ...orderData,
              customer_name: formData.name,
              customer_email: user.email,
              customer_phone: formData.phone,
              shipping_address: orderData.shipping_address
            }
          })
        });
      } catch (err) {
        console.error("Erro ao disparar notificação de e-mail:", err);
      }

      // 2. Atualizar o Perfil se solicitado
      if (formData.saveAddress) {
        try {
          await supabase.from('profiles').update({
            street: formData.street,
            apartment: formData.apartment,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postalCode
          }).eq('id', user.id);
        } catch (profileErr) {
          console.warn("⚠️ Perfil não atualizado:", profileErr);
        }
      }

      return orderData;
    } catch (error) {
      console.error("Error saving order:", error);
      throw error;
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const orderData = await saveOrderToDatabase();
      handleFinalizeRedirect();
    } catch (error) {
      showPopup(`Houve um erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirecionamento e limpeza após salvar
  const handleFinalizeRedirect = async () => {
    try {
      const message = generateWhatsAppMessage();

      // 1. Limpar carrinho IMEDIATAMENTE (e aguardar confirmação do banco)
      await clearCart();

      // 2. Tentar abrir o WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${String(waNumber).replace(/\D/g, '')}?text=${encodedMessage}`;

      try {
        window.open(whatsappUrl, '_blank');
      } catch (e) {
        console.warn("⚠️ Popup do WhatsApp bloqueado.");
      }

      // 3. Ir para página de sucesso
      navigate('/sucesso', { state: { orderMessage: message, waNumber } });
    } catch (finalErr) {
      console.error("Erro no redirecionamento final:", finalErr);
      // Mesmo se o redirect falhar, tentamos ir para o sucesso pois o pedido já foi salvo
      navigate('/sucesso');
    }
  };

  // Determinar o caminho de retorno (categoria anterior ou home)
  const returnPath = sessionStorage.getItem('ifooty_last_browsed_path') || '/';

  if (!user) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>{t('checkout_login_title')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{t('checkout_login_text')}</p>
        <button className="btn-primary" onClick={() => {
          sessionStorage.setItem('ifooty_redirect_after_login', '/checkout'); // Se logar, volta pra cá
          navigate('/auth');
        }} style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogIn size={20} /> {t('checkout_login_btn')}
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2>{t('checkout_cart_empty_title')}</h2>
        <button className="btn-secondary" onClick={() => navigate(returnPath)} style={{ marginTop: '2rem' }}>
          {t('checkout_back_shopping')}
        </button>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={initialPayPalOptions}>
      <div className="checkout-container" style={{ padding: '2rem 1rem' }}>
      {/* Premium Notification Modal */}
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '450px', width: '100%', border: '1px solid var(--accent-color)', textAlign: 'center', boxShadow: '0 0 40px rgba(0,0,0,0.5)', animation: 'modalIn 0.3s ease-out forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(204, 255, 0, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <AlertCircle size={48} color="var(--accent-color)" />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('checkout_attention')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {notification.message}
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }} onClick={() => setNotification({ ...notification, show: false })}>
              {t('checkout_attention_btn')}
            </button>
          </div>
        </div>
      )}

      <button onClick={() => navigate(returnPath)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> {t('checkout_back_btn')}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>

        {/* Form */}
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Truck color="var(--accent-color)" /> {t('checkout_title')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => setFormData({ ...formData, deliveryMethod: 'shipping' })}
              style={{
                padding: '1.5rem', borderRadius: 'var(--radius-md)', border: `2px solid ${formData.deliveryMethod === 'shipping' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                background: formData.deliveryMethod === 'shipping' ? 'rgba(204, 255, 0, 0.05)' : 'transparent', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              <div style={{ color: formData.deliveryMethod === 'shipping' ? 'var(--accent-color)' : 'var(--text-muted)', marginBottom: '0.5rem' }}><Truck size={24} /></div>
              <div style={{ fontWeight: 700, color: '#fff' }}>{t('checkout_home_delivery')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('checkout_home_delivery_desc')}</div>
            </button>
            <button
              onClick={() => setFormData({ ...formData, deliveryMethod: 'pickup' })}
              style={{
                padding: '1.5rem', borderRadius: 'var(--radius-md)', border: `2px solid ${formData.deliveryMethod === 'pickup' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                background: formData.deliveryMethod === 'pickup' ? 'rgba(204, 255, 0, 0.05)' : 'transparent', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              <div style={{ color: formData.deliveryMethod === 'pickup' ? 'var(--accent-color)' : 'var(--text-muted)', marginBottom: '0.5rem' }}><MapPin size={24} /></div>
              <div style={{ fontWeight: 700, color: '#fff' }}>{t('checkout_pickup_delivery')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>{t('checkout_pickup_delivery_desc')}</div>
            </button>
          </div>

          <div className="glass-panel checkout-form-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_name')}</label>
                  <input
                    type="text"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Como no passaporte/ID"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').substring(0, 14) })}
                    placeholder="(000) 000-0000"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                  />
                </div>
              </div>

              {formData.deliveryMethod === 'shipping' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_postal')}</label>
                      <input
                        type="text" placeholder="Ex: T2X 0V1"
                        value={formData.postalCode} onChange={e => setFormData({ ...formData, postalCode: e.target.value.toUpperCase() })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                      />
                    </div>
                  </div>

                  <div className="address-grid-row">
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_autocomplete_label')}</label>
                      <input
                        type="text" placeholder="Ex: 123 Bay Street"
                        ref={addressInputRef}
                        value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--accent-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                      />
                      <p style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginTop: '0.4rem', opacity: 0.8 }}>
                        {t('checkout_autocomplete_hint')}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_address_number')}</label>
                      <input
                        type="text" placeholder="Ex: 123"
                        value={formData.addressNumber} onChange={e => setFormData({ ...formData, addressNumber: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                      />
                    </div>
                  </div>

                  <div className="address-grid-triple">
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_district')}</label>
                      <input
                        type="text" placeholder="Ex: Wolf Willow"
                        value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_unit')}</label>
                      <input
                        type="text" placeholder="Ex: 402"
                        value={formData.apartment} onChange={e => setFormData({ ...formData, apartment: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_city_label')}</label>
                      <input
                        type="text"
                        value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_province_label')}</label>
                      <input
                        type="text" value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_country_label')}</label>
                      <input
                        type="text" value={formData.country} readOnly
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.deliveryMethod === 'pickup' && (
                <div style={{ background: 'rgba(204, 255, 0, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
                  <p style={{ display: 'flex', gap: '0.8rem', color: 'var(--accent-color)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    {t('checkout_pickup_alert')}
                  </p>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_social')}</label>
                <input
                  type="text" placeholder={t('checkout_social_placeholder')}
                  value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1rem', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, saveAddress: !formData.saveAddress })}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid var(--accent-color)', background: formData.saveAddress ? 'var(--accent-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  {formData.saveAddress && <Save size={14} color="#000" />}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{t('checkout_save_address')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>{t('checkout_summary_title')}</h2>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              {cartItems.map(item => (
                <div key={`${item.id}-${item.size}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity}x {item.name} ({item.size})</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                <span>{t('cart_subtotal')}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {/* CAMPO DE CUPOM */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Cupom de Desconto"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    disabled={appliedCoupon}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                  />
                  {!appliedCoupon ? (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isVerifyingCoupon || !couponCode}
                      style={{ padding: '0 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-hover)', color: 'var(--accent-color)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {isVerifyingCoupon ? '...' : 'Aplicar'}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                      style={{ padding: '0 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem' }}
                    >
                      Remover
                    </button>
                  )}
                </div>
                {couponError && <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{couponError}</p>}
                {appliedCoupon && <p style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.4rem' }}>Cupom <strong>{appliedCoupon.code}</strong> aplicado! ({appliedCoupon.discount_percent}% OFF)</p>}
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: 600 }}>
                  <span>{t('checkout_discount')}</span>
                  <span>- ${discount.toFixed(2)}</span>
                </div>
              )}

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: 600 }}>
                  <span>Desconto do Cupom</span>
                  <span>- ${(cartTotal - finalTotal).toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: appliedShipping === 0 && pricingConfig.shippingCost > 0 ? '#10B981' : 'var(--text-main)', fontWeight: appliedShipping === 0 && pricingConfig.shippingCost > 0 ? 600 : 400 }}>
                <span>Frete / Shipping</span>
                <span>{appliedShipping === 0 && pricingConfig.shippingCost > 0 ? 'GRÁTIS' : `$${appliedShipping.toFixed(2)}`}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              <span>{t('cart_total')} CAD</span>
              <span style={{ color: 'var(--accent-color)' }}>${finalTotal.toFixed(2)}</span>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('payment_method_title') || 'Forma de Pagamento'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  onClick={() => setPaymentMethod('whatsapp')}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.2rem',
                    borderRadius: 'var(--radius-md)', background: paymentMethod === 'whatsapp' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${paymentMethod === 'whatsapp' ? '#25D366' : 'var(--border-color)'}`,
                    transition: 'all 0.3s ease', cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={24} color={paymentMethod === 'whatsapp' ? '#25D366' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: paymentMethod === 'whatsapp' ? '#fff' : 'var(--text-muted)' }}>WhatsApp</span>
                </button>
                <button
                  disabled
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.2rem',
                    borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease', cursor: 'not-allowed', opacity: 0.4, position: 'relative'
                  }}
                >
                  <CreditCard size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>PayPal / Card</span>
                  <span style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.65rem', background: 'var(--border-color)', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {t('coming_soon') || 'Em breve'}
                  </span>
                </button>
              </div>
            </div>

            {paymentMethod === 'whatsapp' ? (
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', background: isSubmitting ? 'var(--border-color)' : '#25D366', color: '#fff', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                <WhatsAppIcon size={24} />
                {isSubmitting ? t('checkout_processing') : t('checkout_confirm_btn')}
              </button>
            ) : (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", label: "pay" }}
                  createOrder={(data, actions) => {
                    if (!validateForm()) {
                      return actions.reject();
                    }
                    return actions.order.create({
                      purchase_units: [{
                        amount: {
                          currency_code: "CAD",
                          value: finalTotal.toFixed(2),
                          breakdown: {
                            item_total: {
                              currency_code: "CAD",
                              value: (subtotal - discount - (appliedCoupon ? (subtotal - discount) * (appliedCoupon.discount_percent / 100) : 0)).toFixed(2)
                            },
                            shipping: {
                              currency_code: "CAD",
                              value: appliedShipping.toFixed(2)
                            }
                          }
                        },
                        items: cartItems.map(item => ({
                          name: `${item.name} (${item.size})`,
                          quantity: item.quantity.toString(),
                          unit_amount: {
                            currency_code: "CAD",
                            value: item.price.toFixed(2)
                          }
                        }))
                      }]
                    });
                  }}
                  onApprove={async (data, actions) => {
                    const details = await actions.order.capture();
                    setIsSubmitting(true);
                    try {
                      await saveOrderToDatabase(details);
                      await clearCart(); // Aguarda limpeza real
                      navigate('/sucesso', { state: { paid: true } });
                    } catch (err) {
                      showPopup("Erro ao salvar pedido pago. Por favor, fale conosco no WhatsApp.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                />
              </div>
            )}
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('checkout_summary_footer_note')}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .checkout-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .address-grid-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
        }
        .address-grid-triple {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .address-grid-row, .address-grid-triple {
            grid-template-columns: 1fr;
          }
          .checkout-form-panel {
            padding: 1.25rem !important;
          }
          h2 {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
    </PayPalScriptProvider>
  );
};

export default Checkout;

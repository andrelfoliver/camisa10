import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogIn, MapPin, Truck, Save, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { supabase } from '../services/supabase';
import { useLanguage } from '../context/LanguageContext';

const Checkout = () => {
  const { t, language } = useLanguage();
  const { cartItems, cartTotal, subtotal, discount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    phone: '',
    instagram: '',
    street: '',
    apartment: '',
    city: '',
    province: '',
    postalCode: '',
    saveAddress: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waNumber, setWaNumber] = useState('5584991847739');
  
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

  // Inicialização Robusta do Google Autocomplete
  useEffect(() => {
    let autocomplete;
    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) return false;
      
      autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'ca' },
        fields: ['address_components', 'geometry'],
        types: ['address']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;

        let streetNumber = '';
        let route = '';
        let city = '';
        let province = '';
        let postalCode = '';

        place.address_components.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) streetNumber = component.long_name;
          if (types.includes('route')) route = component.long_name;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) province = component.short_name;
          if (types.includes('postal_code')) postalCode = component.long_name;
        });

        setFormData(prev => ({
          ...prev,
          street: `${streetNumber} ${route}`.trim(),
          city: city || prev.city,
          province: province || prev.province,
          postalCode: postalCode || prev.postalCode
        }));
      });
      return true;
    };

    // Tenta inicializar. Se o script do Google ainda não carregou, tenta novamente em intervalos curtos.
    if (!initAutocomplete()) {
      const interval = setInterval(() => {
        if (initAutocomplete()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setFormData(prev => ({
            ...prev,
            street: data.street || '',
            apartment: data.apartment || '',
            city: data.city || '',
            province: data.province || '',
            postalCode: data.postal_code || ''
          }));
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
    let message = `${t('checkout_wa_order_title')}\n\n`;
    message += `${t('checkout_wa_customer')} ${formData.name}\n`;
    message += `${t('checkout_wa_shipping')}\n`;
    message += `${formData.street}${formData.apartment ? ', Apt ' + formData.apartment : ''}\n`;
    message += `${formData.city}, ${formData.province}\n`;
    message += `${formData.postalCode}\n\n`;
    
    message += `${t('checkout_wa_items')}\n`;
    cartItems.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (${item.size}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n${t('checkout_wa_total')} $${cartTotal.toFixed(2)} CAD\n\n`;
    message += t('checkout_wa_footer');
    
    return message;
  };

  const handleSubmitOrder = async () => {
    if (!formData.street || !formData.city || !formData.province || !formData.postalCode) {
      showPopup(t('checkout_validation_error'));
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Salvar o Pedido no Banco
      const orderData = {
        user_id: user.id,
        customer_name: formData.name,
        customer_email: user.email,
        customer_phone: formData.phone,
        shipping_address: {
          street: formData.street,
          apartment: formData.apartment,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode
        },
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          extras: item.extras || {}
        })),
        total_price: cartTotal,
        status: 'pending'
      };

      const { error: orderError } = await supabase.from('orders').insert([orderData]);
      if (orderError) throw orderError;

      // 1.5. Notificar por E-mail (aguarda o envio antes de redirecionar)
      try {
        const emailRes = await fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            language,
            order: {
              ...orderData,
              customer_name: formData.name,
              customer_email: user.email,
              customer_phone: formData.phone,
              shipping_address: {
                street: formData.street,
                apartment: formData.apartment,
                city: formData.city,
                province: formData.province,
                postalCode: formData.postalCode
              }
            }
          })
        });
        const emailData = await emailRes.json();
        if (!emailRes.ok || emailData.errors) {
          console.warn('⚠️ Email enviado com erro:', emailData);
        } else {
          console.log('✅ Emails disparados com sucesso:', emailData);
        }
      } catch (err) {
        console.error("Erro ao disparar notificação de e-mail:", err);
      }

      // 2. Atualizar o Perfil se solicitado (isolado para não travar o sucesso do pedido)
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
          console.warn("⚠️ Não foi possível salvar o endereço no perfil, mas o pedido segue:", profileErr);
        }
      }

      // 3. Redirecionar para Sucesso e WhatsApp (Ação final)
      handleFinalizeRedirect();
      
    } catch (error) {
      console.error("📛 Erro crítico ao processar pedido:", error);
      // Exibir o erro real para facilitar o diagnóstico caso persista
      showPopup(`Houve um erro técnico: ${error.message || 'Erro desconhecido'}. Por favor, verifique se o pedido chegou no seu e-mail ou fale conosco.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirecionamento e limpeza após salvar
  const handleFinalizeRedirect = () => {
    try {
      const message = generateWhatsAppMessage();
      
      // 1. Tentar abrir o WhatsApp (encapsulado para não travar o fluxo se o browser bloquear)
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${String(waNumber).replace(/\D/g, '')}?text=${encodedMessage}`;
      
      try {
        window.open(whatsappUrl, '_blank');
      } catch (e) {
        console.warn("⚠️ Popup do WhatsApp bloqueado pelo navegador.");
      }
      
      // 2. Limpar carrinho
      clearCart();
      
      // 3. Ir para página de sucesso (Isso é o que garante o fim do processo)
      navigate('/sucesso', { state: { orderMessage: message, waNumber } });
    } catch (finalErr) {
      console.error("Erro no redirecionamento final:", finalErr);
      // Mesmo se o redirect falhar, tentamos ir para o sucesso pois o pedido já foi salvo
      navigate('/sucesso');
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>{t('checkout_login_title')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{t('checkout_login_text')}</p>
        <button className="btn-primary" onClick={() => {
          sessionStorage.setItem('ifooty_redirect_after_login', '/checkout');
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
        <button className="btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
          {t('checkout_back_shopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1.5rem' }}>
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

      <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> {t('checkout_back_btn')}
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
        
        {/* Form */}
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <MapPin color="var(--accent-color)" /> {t('checkout_delivery_title')}
          </h2>
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_name')}</label>
                <input 
                  type="text" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_street')}</label>
                  <input 
                    type="text" placeholder="Ex: 123 Bay St"
                    ref={addressInputRef}
                    value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_apt')}</label>
                  <input 
                    type="text" placeholder="Ex: 402"
                    value={formData.apartment} onChange={e => setFormData({...formData, apartment: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_city')}</label>
                  <input 
                    type="text" placeholder="Ex: Toronto"
                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_province')}</label>
                  <select 
                    value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                  >
                    <option value="">{t('checkout_select_province')}</option>
                    <option value="ON">Ontario (ON)</option>
                    <option value="BC">British Columbia (BC)</option>
                    <option value="QC">Quebec (QC)</option>
                    <option value="AB">Alberta (AB)</option>
                    <option value="MB">Manitoba (MB)</option>
                    <option value="SK">Saskatchewan (SK)</option>
                    <option value="NS">Nova Scotia (NS)</option>
                    <option value="NB">New Brunswick (NB)</option>
                    <option value="PE">Prince Edward Island (PE)</option>
                    <option value="NL">Newfoundland and Labrador (NL)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_postal')}</label>
                  <input 
                    type="text" placeholder="M5H 2N2"
                    value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value.toUpperCase()})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('checkout_social')}</label>
                <input 
                  type="text" placeholder={t('checkout_social_placeholder')}
                  value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1rem', cursor: 'pointer' }} onClick={() => setFormData({...formData, saveAddress: !formData.saveAddress})}>
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
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: 600 }}>
                   <span>{t('checkout_discount')}</span>
                   <span>- ${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              <span>{t('cart_total')} CAD</span>
              <span style={{ color: 'var(--accent-color)' }}>${cartTotal.toFixed(2)}</span>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: isSubmitting ? 'var(--border-color)' : '#25D366', color: '#fff', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              <WhatsAppIcon size={24} />
              {isSubmitting ? t('checkout_processing') : t('checkout_confirm_btn')}
            </button>
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
      `}</style>
    </div>
  );
};

export default Checkout;

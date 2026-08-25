import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useRebrandAuth } from '../../context/RebrandAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Truck, MapPin, Save, AlertCircle, X, LogIn, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CreditCard, MessageSquare } from 'lucide-react';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { supabaseRebrand as supabase } from '../../services/supabase';
import { trackEvent, getSavedUtms, getSavedAttribution } from '../../services/analytics';

const RebrandCheckout = () => {
  const { 
    cartItems, cartTotal, subtotal, discount, clearCart, appliedShipping, pricingConfig,
    appliedCoupon: contextCoupon, setAppliedCoupon: setContextCoupon,
    couponCode: contextCouponCode, setCouponCode: setContextCouponCode
  } = useCart();
  const { user } = useRebrandAuth();
  const { currency, setCurrency, convertPrice, formatPrice, t } = useLanguage();
  const navigate = useNavigate();

  const [guestEmail, setGuestEmail] = useState(() => sessionStorage.getItem('ifooty_guest_email') || '');
  const [guestInputEmail, setGuestInputEmail] = useState('');

  const initiatedCheckoutRef = useRef(false);
  useEffect(() => {
    if (cartItems.length > 0 && !initiatedCheckoutRef.current) {
      initiatedCheckoutRef.current = true;
      trackEvent('InitiateCheckout', {
        value: cartTotal, currency: 'CAD',
        num_items: cartItems.length,
        content_ids: cartItems.map(i => i.id),
        content_type: 'product'
      }, { email: user?.email || guestEmail });
    }
  }, [cartItems, cartTotal, user, guestEmail]);

  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    phone: '',
    instagram: '',
    deliveryMethod: 'shipping',
    street: '', addressNumber: '', district: '',
    apartment: '', city: '', province: '',
    postalCode: '', country: 'Canada',
    instructions: '', saveAddress: true
  });

  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waNumber, setWaNumber] = useState('17788061419');
  const [couponCode, setCouponCode] = useState(contextCouponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState(contextCoupon || null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('whatsapp');
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [promoOpen, setPromoOpen] = useState(!!contextCoupon);

  useEffect(() => {
    if (contextCoupon && !appliedCoupon) {
      setAppliedCoupon(contextCoupon);
      setCouponCode(contextCoupon.code);
    }
  }, [contextCoupon]);

  const currentShipping = formData.deliveryMethod === 'pickup' ? 0 : appliedShipping;

  const isPromoOnlyCoupon = appliedCoupon?.code === 'WEEK10' || appliedCoupon?.code === 'OFERTA10' || appliedCoupon?.code === 'WEEKLY10' || !!appliedCoupon?.promo_only;

  const promoItemsSubtotal = isPromoOnlyCoupon
    ? cartItems.filter(item => !!item.is_sale).reduce((acc, item) => acc + (item.price * item.quantity), 0)
    : 0;

  const couponDiscountAmount = appliedCoupon
    ? (isPromoOnlyCoupon
        ? promoItemsSubtotal * (appliedCoupon.discount_percent / 100)
        : (subtotal - discount) * (appliedCoupon.discount_percent / 100))
    : 0;

  const baseFinalTotal = Math.max(0, subtotal - discount - couponDiscountAmount + (currentShipping || 0));

  const finalTotal = paymentMethod === 'paypal'
    ? Number(((baseFinalTotal + 0.30) / 0.951).toFixed(2))
    : paymentMethod === 'stripe'
      ? Number(((baseFinalTotal + 0.30) / 0.965).toFixed(2))
      : baseFinalTotal;
  const paypalFee = paymentMethod === 'paypal'
    ? Number((finalTotal - baseFinalTotal).toFixed(2)) : 0;
  const stripeFee = paymentMethod === 'stripe'
    ? Number((finalTotal - baseFinalTotal).toFixed(2)) : 0;

  const displaySubtotal = convertPrice(subtotal);
  const displayDiscount = convertPrice(discount);
  const displayPromoItemsSubtotal = convertPrice(promoItemsSubtotal);
  const displayCouponDiscount = appliedCoupon
    ? (isPromoOnlyCoupon
        ? displayPromoItemsSubtotal * (appliedCoupon.discount_percent / 100)
        : (displaySubtotal - displayDiscount) * (appliedCoupon.discount_percent / 100))
    : 0;
  const displayShipping = convertPrice(currentShipping);
  const displayBaseFinalTotal = displaySubtotal - displayDiscount - displayCouponDiscount + displayShipping;
  const displayFinalTotal = paymentMethod === 'paypal'
    ? Number(((displayBaseFinalTotal + 0.30) / 0.951).toFixed(2))
    : paymentMethod === 'stripe'
      ? Number(((displayBaseFinalTotal + 0.30) / 0.965).toFixed(2))
      : displayBaseFinalTotal;
  const displayPaypalFee = paymentMethod === 'paypal'
    ? Number((displayFinalTotal - displayBaseFinalTotal).toFixed(2)) : 0;
  const displayStripeFee = paymentMethod === 'stripe'
    ? Number((displayFinalTotal - displayBaseFinalTotal).toFixed(2)) : 0;

  const initialPayPalOptions = useMemo(() => ({
    'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: currency === 'USD' ? 'USD' : 'CAD',
    intent: 'capture',
  }), [currency]);

  useEffect(() => {
    if (currency === 'USD' && formData.country === 'Canada') {
      setFormData(prev => ({ ...prev, country: 'United States', deliveryMethod: 'shipping' }));
    }
  }, [currency]);

  useEffect(() => {
    setCurrency(formData.country === 'United States' ? 'USD' : 'CAD');
  }, [formData.country, setCurrency]);

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data?.value) setWaNumber(data.value);
    }
    loadConfig();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && notification.show)
        setNotification(prev => ({ ...prev, show: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notification.show]);

  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    let autocomplete;
    const initAutocomplete = async () => {
      try {
        if (!window.google?.maps?.importLibrary) return;
        const { Autocomplete } = await window.google.maps.importLibrary('places');
        if (!addressInputRef.current) return;
        const initialCountry = formDataRef.current?.country === 'United States' ? 'us' : 'ca';
        autocomplete = new Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: initialCountry },
          fields: ['address_components', 'geometry'], types: ['address']
        });
        autocompleteRef.current = autocomplete;
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.address_components) return;
          let streetNumber = '', route = '', district = '', city = '', province = '', postalCode = '';
          place.address_components.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) streetNumber = component.long_name;
            if (types.includes('route')) route = component.long_name;
            if (types.includes('sublocality_level_1') || types.includes('neighborhood')) district = component.long_name;
            if (types.includes('locality')) city = component.long_name;
            if (types.includes('administrative_area_level_1')) province = component.short_name;
            if (types.includes('postal_code')) postalCode = component.long_name;
          });
          setFormData(prev => ({ ...prev, street: route, addressNumber: streetNumber, district, city, province, postalCode }));
        });
      } catch (err) { console.error('Error loading Google Places:', err); }
    };
    initAutocomplete();
  }, []);

  useEffect(() => {
    if (autocompleteRef.current) {
      autocompleteRef.current.setComponentRestrictions({ country: formData.country === 'United States' ? 'us' : 'ca' });
    }
  }, [formData.country]);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).then(({ data }) => {
        if (data && data.length > 0) {
          const p = data[0];
          setFormData(prev => ({
            ...prev,
            street: p.street || '', apartment: p.apartment || '',
            city: p.city || '', province: p.province || '', postalCode: p.postal_code || ''
          }));
        }
      });
    }
  }, [user]);

  const showPopup = (message) => setNotification({ show: true, message });

  const generateWhatsAppMessage = () => {
    const data = formDataRef.current;
    const isPickup = data.deliveryMethod === 'pickup';
    let msg = `🛒 NEW ORDER\n\n`;
    msg += `Customer: ${data.name}\n`;
    if (user?.email) msg += `Email: ${user.email}\n`;
    msg += `Phone: ${data.phone}\n`;
    if (isPickup) {
      msg += `Method: 📍 PICKUP (Wolf Willow, Calgary)\n\n`;
    } else {
      msg += `Address: ${data.street}, ${data.addressNumber}${data.apartment ? ', Unit ' + data.apartment : ''}\n`;
      msg += `City: ${data.city}, ${data.province} ${data.postalCode}\n`;
      msg += `Country: ${data.country}\n`;
      if (data.instructions) msg += `Instructions: ${data.instructions}\n`;
      msg += `\n`;
    }
    msg += `ITEMS:\n`;
    cartItems.forEach(item => {
      msg += `- ${item.quantity}x ${item.name} (${item.size})`;
      if (item.extras?.nameNumber) msg += ` [Print: ${item.extras.customName} (${item.extras.customNumber})]`;
      if (item.extras?.patch) msg += ` [Patch: ${item.extras.customPatch || 'Yes'}]`;
      if (item.extras?.extraCustomization) msg += ` [Extra: ${item.extras.customExtraName}]`;
      msg += ` - $${(convertPrice(item.price) * item.quantity).toFixed(2)}\n`;
    });
    msg += `\nSubtotal: $${displaySubtotal.toFixed(2)}`;
    if (discount > 0) msg += `\nDiscount: -$${displayDiscount.toFixed(2)}`;
    if (appliedCoupon) msg += `\nCoupon ${appliedCoupon.code}: -${appliedCoupon.discount_percent}% OFF (-$${displayCouponDiscount.toFixed(2)})`;
    msg += `\nShipping: ${currentShipping === 0 ? 'FREE' : '$' + displayShipping.toFixed(2)}`;
    msg += `\n\nTOTAL: $${displayFinalTotal.toFixed(2)} ${currency}`;
    msg += `\n\nThank you for your order! We will confirm shortly. 🙌`;
    return msg;
  };

  const updateAppliedCouponState = (couponObj) => {
    setAppliedCoupon(couponObj);
    if (setContextCoupon) setContextCoupon(couponObj);
    if (couponObj) {
      sessionStorage.setItem('ifooty_applied_coupon', JSON.stringify(couponObj));
      if (setContextCouponCode) setContextCouponCode(couponObj.code);
    } else {
      sessionStorage.removeItem('ifooty_applied_coupon');
      if (setContextCouponCode) setContextCouponCode('');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsVerifyingCoupon(true);
    setCouponError('');
    try {
      const codeUpper = couponCode.toUpperCase().trim();
      
      if (codeUpper === 'WEEK10' || codeUpper === 'OFERTA10' || codeUpper === 'WEEKLY10') {
        const hasPromoItems = cartItems.some(item => !!item.is_sale);
        if (cartItems.length > 0 && !hasPromoItems) {
          setCouponError('O cupom WEEK10 é válido apenas para camisas marcadas em promoção.');
          updateAppliedCouponState(null);
          return;
        }

        updateAppliedCouponState({
          code: codeUpper,
          discount_percent: 10,
          is_active: true,
          promo_only: true
        });
        return;
      }
      
      const { data, error } = await supabase.from('coupons').select('*')
        .eq('code', codeUpper).eq('is_active', true).single();
      if (error || !data) {
        setCouponError('Invalid or expired coupon code.');
        updateAppliedCouponState(null);
      } else {
        updateAppliedCouponState(data);
        if (data.agent_id) localStorage.setItem('ifooty_referrer', data.agent_id);
      }
    } catch { setCouponError('Error validating coupon.'); }
    finally { setIsVerifyingCoupon(false); }
  };

  const validateForm = (data = formDataRef.current) => {
    if ((data.name || '').trim().length < 3) { showPopup('Please enter your full name.'); return false; }
    if ((data.phone || '').replace(/\D/g, '').length < 10) { showPopup('Please enter a valid 10-digit phone number.'); return false; }
    if (data.deliveryMethod === 'pickup') {
      if (cartItems.some(i => i.extras?.nameNumber || i.extras?.extraCustomization)) {
        showPopup('Customization is not available for local pickup. Please select Home Delivery or remove personalization.'); return false;
      }
    }
    if (data.deliveryMethod === 'shipping') {
      const { street, addressNumber, city, province, postalCode, district } = data;
      if (!street?.trim() || !addressNumber?.trim() || !city?.trim() || !province?.trim() || !postalCode?.trim()) {
        showPopup('All address fields are required for home delivery.'); return false;
      }
      if (data.country === 'Canada') {
        if (!/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i.test(postalCode)) { showPopup('Invalid postal code format. Example: T2X 0V1'); return false; }
      } else {
        if (!/^\d{5}(-\d{4})?$/.test(postalCode)) { showPopup('Invalid ZIP code. Example: 90210'); return false; }
      }
      if ((district || '').trim().length < 2) { showPopup('Please enter your neighbourhood.'); return false; }
    }
    return true;
  };

  const saveOrderToDatabase = async (paymentDetails = null) => {
    const data = formDataRef.current;
    if (data.deliveryMethod === 'shipping') {
      const { street, addressNumber, city, province, postalCode } = data;
      if (!street?.trim() || !addressNumber?.trim() || !city?.trim() || !province?.trim() || !postalCode?.trim())
        throw new Error('Incomplete address data for delivery.');
    }
    let currentExchangeRate = 1.38;
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD');
      const d = await r.json();
      if (d?.rates?.CAD) currentExchangeRate = d.rates.CAD;
    } catch {}
    const utms = getSavedUtms();
    const attribution = getSavedAttribution();
    const orderData = {
      user_id: user?.id || null, customer_name: data.name,
      customer_email: user?.email || guestEmail, customer_phone: data.phone,
      shipping_address: {
        method: data.deliveryMethod,
        street: data.deliveryMethod === 'pickup' ? 'Wolf Willow (Pickup)' : data.street,
        number: data.addressNumber, district: data.district,
        apartment: data.apartment,
        city: data.deliveryMethod === 'pickup' ? 'Calgary' : data.city,
        province: data.deliveryMethod === 'pickup' ? 'AB' : data.province,
        postalCode: data.postalCode, country: data.country,
        instructions: data.instructions
      },
      usd_cad_rate: currentExchangeRate,
      items: cartItems.map(item => ({
        id: item.id, name: item.name, size: item.size,
        quantity: item.quantity, price: item.price,
        image: item.image, extras: item.extras || {}
      })),
      total_price: finalTotal,
      status: paymentDetails ? 'paid' : 'pending',
      payment_method: paymentDetails ? 'paypal' : paymentMethod,
      payment_id: paymentDetails?.id || null,
      paid_at: paymentDetails ? new Date().toISOString() : null,
      referrer: attribution.referrer || localStorage.getItem('ifooty_referrer') || null,
      coupon_code: appliedCoupon?.code || null,
      coupon_discount: appliedCoupon ? (cartTotal - finalTotal) : 0,
      utm_source: attribution.utm_source || utms.utm_source,
      utm_medium: attribution.utm_medium || utms.utm_medium,
      utm_campaign: attribution.utm_campaign || utms.utm_campaign,
      utm_content: attribution.utm_content || utms.utm_content,
      utm_term: attribution.utm_term || utms.utm_term,
      session_id: localStorage.getItem('ifooty_session_id') || null,
      fbclid: attribution.fbclid, gclid: attribution.gclid,
      landing_page: attribution.landing_page, visitor_id: attribution.visitor_id
    };
    let insertedOrders, orderError;
    try {
      const res = await supabase.from('orders').insert([orderData]).select();
      insertedOrders = res.data; orderError = res.error;
    } catch (err) { orderError = err; }
    if (orderError) throw orderError;
    const orderId = insertedOrders?.[0]?.id || ('purchase_' + Date.now());
    // ✅ Pedido salvo com sucesso — limpar snapshot do carrinho
    try {
      localStorage.removeItem('ifooty_checkout_snapshot');
      const snapshotId = sessionStorage.getItem('ifooty_snapshot_id');
      if (snapshotId) {
        await supabase.from('checkout_snapshots').update({ status: 'recovered', recovered_at: new Date().toISOString() }).eq('id', snapshotId);
        sessionStorage.removeItem('ifooty_snapshot_id');
      }
    } catch {}
    trackEvent('Purchase', {
      value: finalTotal, currency: 'CAD',
      num_items: cartItems.reduce((acc, i) => acc + i.quantity, 0),
      content_ids: cartItems.map(i => i.id), content_type: 'product', order_id: orderId
    }, { email: user?.email || guestEmail, phone: data.phone });
    try {
      await Promise.all(cartItems.map(item =>
        supabase.rpc('decrement_product_stock', {
          product_id_input: item.id, size_input: item.size, quantity_input: item.quantity
        })
      ));
    } catch {}
    try {
      await fetch('/api/send-order-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language: 'en', 
          adminEmail: 'ifootyc@gmail.com',
          adminOnly: paymentMethod === 'stripe',
          order: { ...orderData, customer_name: data.name, customer_email: user?.email || guestEmail, customer_phone: data.phone } 
        })
      });
    } catch {}
    if (data.saveAddress && user) {
      try {
        await supabase.from('profiles').update({
          full_name: data.name, street: data.street, apartment: data.apartment,
          city: data.city, province: data.province, postal_code: data.postalCode
        }).eq('id', user.id);
      } catch {}
    }
    return insertedOrders?.[0] || orderData;
  };

  // 💾 Salva snapshot do carrinho antes do pagamento (previne perda de customizações)
  const saveCartSnapshot = async (paypalOrderId = null) => {
    const data = formDataRef.current;
    const snapshot = {
      timestamp: Date.now(),
      items: cartItems,
      form_data: {
        name: data.name,
        email: user?.email || guestEmail,
        phone: data.phone,
        deliveryMethod: data.deliveryMethod,
        street: data.street,
        addressNumber: data.addressNumber,
        apartment: data.apartment,
        district: data.district,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        country: data.country,
        instructions: data.instructions,
      },
      payment_method: paymentMethod,
      total_price: finalTotal,
      paypal_order_id: paypalOrderId,
      applied_coupon: appliedCoupon || null,
    };
    // Salvar no localStorage (backup imediato no browser)
    localStorage.setItem('ifooty_checkout_snapshot', JSON.stringify(snapshot));
    // Salvar no Supabase (recuperação pelo admin se o pedido falhar)
    try {
      const { data: inserted } = await supabase.from('checkout_snapshots').insert([{
        session_id: localStorage.getItem('ifooty_session_id') || null,
        visitor_id: getSavedAttribution().visitor_id || null,
        items: cartItems,
        form_data: snapshot.form_data,
        total_price: finalTotal,
        payment_method: paymentMethod,
        paypal_order_id: paypalOrderId,
        status: 'pending'
      }]).select().single();
      if (inserted?.id) sessionStorage.setItem('ifooty_snapshot_id', inserted.id);
    } catch {}
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await saveOrderToDatabase();
      const message = generateWhatsAppMessage();
      await clearCart();
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${String(waNumber).replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
      navigate('/sucesso', { state: { orderMessage: message, waNumber } });
    } catch (error) {
      showPopup(`Error: ${error.message}`);
    } finally { setIsSubmitting(false); }
  };

  const createPaypalOrder = (actions) => {
    const displayCurrency = currency === 'USD' ? 'USD' : 'CAD';
    const paypalItems = cartItems.map(item => {
      const convertedPrice = Number(convertPrice(item.price).toFixed(2));
      return { name: `${item.name} (${item.size})`, quantity: item.quantity.toString(), unit_amount: { currency_code: displayCurrency, value: convertedPrice.toFixed(2) }, _convertedPrice: convertedPrice, _quantity: item.quantity };
    });
    const rawItemTotal = paypalItems.reduce((sum, i) => sum + (i._convertedPrice * i._quantity), 0);
    const rawShipping = Number(convertPrice(currentShipping).toFixed(2));
    const rawFinalTotal = Number(convertPrice(finalTotal).toFixed(2));
    const rawHandling = Number(convertPrice(paypalFee).toFixed(2));
    const rawDiscount = Number((rawItemTotal - Number((rawFinalTotal - rawShipping - rawHandling).toFixed(2))).toFixed(2));
    let valueItemTotal = rawItemTotal.toFixed(2);
    let valueDiscount = rawDiscount.toFixed(2);
    if (rawDiscount < 0) { valueDiscount = '0.00'; valueItemTotal = (rawFinalTotal - rawShipping - rawHandling).toFixed(2); }
    return actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: displayCurrency, value: rawFinalTotal.toFixed(2),
          breakdown: {
            item_total: { currency_code: displayCurrency, value: valueItemTotal },
            shipping: { currency_code: displayCurrency, value: rawShipping.toFixed(2) },
            handling: { currency_code: displayCurrency, value: rawHandling.toFixed(2) },
            ...(Number(valueDiscount) > 0 ? { discount: { currency_code: displayCurrency, value: valueDiscount } } : {})
          }
        },
        items: paypalItems.map(i => ({ name: i.name, quantity: i.quantity, unit_amount: i.unit_amount }))
      }]
    });
  };

  const handlePaypalApprove = async (actions) => {
    if (!validateForm()) { showPopup('Please fill all required address fields before completing payment.'); return; }
    // 💾 Salva snapshot ANTES de capturar pagamento
    await saveCartSnapshot(actions?.order?.id || null);
    const details = await actions.order.capture();
    setIsSubmitting(true);
    try {
      await saveOrderToDatabase(details);
      await clearCart();
      navigate('/sucesso', { state: { paid: true } });
    } catch { showPopup('Error saving order. Please contact us on WhatsApp.'); }
    finally { setIsSubmitting(false); }
  };

  const handleStripeCheckout = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const savedOrder = await saveOrderToDatabase();
      const orderId = savedOrder?.id || `purchase_${Date.now()}`;
      
      const res = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          items: cartItems.map(item => ({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: convertPrice(item.price),
            image: item.image
          })),
          currency: currency === 'USD' ? 'USD' : 'CAD',
          shippingCost: convertPrice(currentShipping),
          discountPercent: appliedCoupon ? appliedCoupon.discount_percent : 0,
          flatDiscount: convertPrice(discount),
          stripeFee: convertPrice(stripeFee),
          successUrl: `${window.location.origin}/sucesso`,
          cancelUrl: window.location.href
        })
      });

      const session = await res.json();
      if (session.error) {
        throw new Error(session.error);
      }

      if (session.url) {
        // 💾 Salva snapshot ANTES de redirecionar ao Stripe
        await saveCartSnapshot();
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL returned from Stripe');
      }
    } catch (error) {
      console.error('Stripe error:', error);
      showPopup(`Payment Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input style helper
  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid #dee2e6', borderRadius: '8px',
    fontSize: '0.95rem', color: '#121416',
    background: '#fff', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s'
  };
  const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#495057' };

  if (!user && !guestEmail) {
    const handleGuestSubmit = (e) => {
      e.preventDefault();
      if (!guestInputEmail || !guestInputEmail.includes('@')) {
        showPopup('Please enter a valid email address.');
        return;
      }
      sessionStorage.setItem('ifooty_guest_email', guestInputEmail.trim());
      setGuestEmail(guestInputEmail.trim());
    };

    return (
      <div style={{
        minHeight: 'calc(100vh - 140px)',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          border: '1px solid #e9ecef',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#121416', marginBottom: '1.5rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('rb_checkout_login_title')}
          </h2>

          {/* Guest Checkout Option */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121416', marginBottom: '0.5rem' }}>{t('rb_guest_checkout')}</h3>
            <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
              {t('rb_checkout_login_text')}
            </p>
            <form onSubmit={handleGuestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input
                type="email"
                placeholder="Email Address"
                value={guestInputEmail}
                onChange={e => setGuestInputEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <button
                type="submit"
                style={{
                  width: '100%', padding: '0.85rem', background: '#121416', color: '#fff',
                  border: 'none', borderRadius: '100px', fontWeight: 700, fontSize: '0.9rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                Continue as Guest
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '2rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#dee2e6' }}></div>
            <span style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', fontWeight: 700 }}>Or</span>
            <div style={{ flex: 1, height: '1px', background: '#dee2e6' }}></div>
          </div>

          {/* Sign In Option */}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121416', marginBottom: '0.5rem' }}>{t('rb_checkout_signin_create')}</h3>
            <p style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '1.2rem', lineHeight: 1.4 }}>
              {t('rb_checkout_signin_desc')}
            </p>
            <button
              onClick={() => {
                sessionStorage.setItem('ifooty_redirect_after_login', '/checkout');
                navigate('/auth');
              }}
              style={{
                width: '100%', padding: '0.9rem', background: '#f8f9fa', color: '#121416',
                border: '1px solid #ced4da', borderRadius: '100px', fontWeight: 800, fontSize: '0.95rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                letterSpacing: '0.3px'
              }}
            >
              <LogIn size={16} /> {t('rb_checkout_signin_create')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#121416', marginBottom: '1rem' }}>Your bag is empty</h2>
          <button onClick={() => navigate('/')} style={{ padding: '0.8rem 2rem', background: '#121416', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={initialPayPalOptions}>
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Error Modal */}
        {notification.show && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}>
            <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ width: '56px', height: '56px', background: '#fff3f3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
                <AlertCircle size={28} color="#dc3545" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#121416', marginBottom: '0.75rem' }}>Attention</h3>
              <p style={{ color: '#6c757d', lineHeight: 1.6, marginBottom: '1.5rem' }}>{notification.message}</p>
              <button style={{ width: '100%', padding: '0.9rem', background: '#121416', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}
                onClick={() => setNotification({ show: false, message: '' })}>
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', fontWeight: 600, fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> {t('rb_cart_continue')}
          </button>
          <span style={{ color: '#dee2e6' }}>|</span>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#121416' }}>{t('rb_cart_checkout')}</h1>
        </div>

        {/* Main Grid */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

          {/* LEFT — Form */}
          <div>
            {/* Delivery Method */}
            <section style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#121416', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('rb_checkout_delivery_method')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  onClick={() => setFormData(p => ({ ...p, deliveryMethod: 'shipping' }))}
                  style={{ padding: '1rem', borderRadius: '10px', border: `2px solid ${formData.deliveryMethod === 'shipping' ? '#121416' : '#dee2e6'}`, background: formData.deliveryMethod === 'shipping' ? '#f8f9fa' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <Truck size={20} color={formData.deliveryMethod === 'shipping' ? '#121416' : '#adb5bd'} />
                  <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#121416' }}>{t('rb_checkout_home_delivery_label')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.2rem' }}>{t('rb_checkout_shipped_to_door')}</div>
                </button>
                <button
                  onClick={() => { if (formData.country === 'Canada') setFormData(p => ({ ...p, deliveryMethod: 'pickup' })); }}
                  disabled={formData.country !== 'Canada'}
                  style={{ padding: '1rem', borderRadius: '10px', border: `2px solid ${formData.deliveryMethod === 'pickup' ? '#121416' : '#dee2e6'}`, background: formData.deliveryMethod === 'pickup' ? '#f8f9fa' : '#fff', cursor: formData.country === 'Canada' ? 'pointer' : 'not-allowed', opacity: formData.country === 'Canada' ? 1 : 0.5, textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <MapPin size={20} color={formData.deliveryMethod === 'pickup' ? '#121416' : '#adb5bd'} />
                  <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: '#121416' }}>{t('rb_checkout_local_pickup')}</div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>{t('rb_checkout_pickup_subtext')}</div>
                </button>
              </div>
            </section>

            {/* Contact Info */}
            <section style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#121416', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('rb_checkout_contact_info')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>{t('rb_checkout_full_name')}</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(p => ({ ...p, name: val }));
                      if (!user) {
                        sessionStorage.setItem('ifooty_guest_name', val);
                        window.dispatchEvent(new Event('storage'));
                      }
                    }} 
                    placeholder={t('rb_checkout_as_on_id')} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t('rb_checkout_phone_number')}</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').substring(0, 14) }))} placeholder="(000) 000-0000" style={inputStyle} />
                </div>
              </div>
            </section>

            {/* Address (if shipping) */}
            {formData.deliveryMethod === 'shipping' && (
              <section style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#121416', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('rb_checkout_shipping_address')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>{t('rb_checkout_postal_code')}</label>
                    <input type="text" placeholder="e.g. T2X 0V1" value={formData.postalCode} onChange={e => setFormData(p => ({ ...p, postalCode: e.target.value.toUpperCase() }))} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>{t('rb_checkout_street_address')} <span style={{ color: '#16a34a', fontSize: '0.75rem' }}>{t('rb_checkout_type_autocomplete')}</span></label>
                      <input type="text" placeholder="e.g. 123 Main Street" ref={addressInputRef} value={formData.street} onChange={e => setFormData(p => ({ ...p, street: e.target.value }))} style={{ ...inputStyle, borderColor: '#121416' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('rb_checkout_number')}</label>
                      <input type="text" placeholder="123" value={formData.addressNumber} onChange={e => setFormData(p => ({ ...p, addressNumber: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>{t('rb_checkout_neighbourhood')}</label>
                      <input type="text" placeholder="e.g. Wolf Willow" value={formData.district} onChange={e => setFormData(p => ({ ...p, district: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('rb_checkout_unit_apt')}</label>
                      <input type="text" placeholder="402" value={formData.apartment} onChange={e => setFormData(p => ({ ...p, apartment: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('rb_checkout_city')}</label>
                      <input type="text" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>{t('rb_checkout_province_state')}</label>
                      <input type="text" value={formData.province} onChange={e => setFormData(p => ({ ...p, province: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('rb_checkout_country')}</label>
                      <select value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value, deliveryMethod: e.target.value === 'United States' ? 'shipping' : p.deliveryMethod }))}
                        style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="Canada">Canada</option>
                        <option value="United States">United States</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('rb_checkout_instructions')}</label>
                    <textarea placeholder={t('rb_checkout_instructions_placeholder')} value={formData.instructions} onChange={e => setFormData(p => ({ ...p, instructions: e.target.value }))} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
                  </div>
                </div>
              </section>
            )}

            {/* Pickup notice */}
            {formData.deliveryMethod === 'pickup' && (
              <section style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '12px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                <AlertCircle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#b45309', fontSize: '0.9rem' }}>Local Pickup — Wolf Willow, Calgary</p>
                  <p style={{ margin: '0.3rem 0 0', color: '#92400e', fontSize: '0.83rem', lineHeight: 1.5 }}>
                    We will contact you to arrange pickup when your order is ready. Customization (name/number) is not available for pickup orders.
                  </p>
                </div>
              </section>
            )}

            {/* Save address checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem' }}
              onClick={() => setFormData(p => ({ ...p, saveAddress: !p.saveAddress }))}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #121416', background: formData.saveAddress ? '#121416' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {formData.saveAddress && <Save size={13} color="#fff" />}
              </div>
              <span style={{ fontSize: '0.9rem', color: '#495057', fontWeight: 500 }}>{t('rb_checkout_save_address')}</span>
            </div>
          </div>

          {/* RIGHT — Order Summary */}
          <div>
            <section style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#121416', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('rb_checkout_order_summary')}</h2>

              {/* Urgency */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '1.2rem' }}>
                <span>🔥</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309' }}>{t('rb_cart_urgency_banner')}</span>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0', marginBottom: '1rem' }}>
                {cartItems.map(item => (
                  <div key={item.cartId} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '64px', height: '64px', flexShrink: 0, background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '1.5rem' }}>👕</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.85rem', color: '#121416', lineHeight: 1.3 }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6c757d' }}>{t('rb_prod_size')}: <strong>{item.size}</strong> · {t('rb_prod_quantity')}: <strong>{item.quantity}</strong></p>
                      {item.extras?.nameNumber && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#6c757d' }}>✍️ {item.extras.customName} #{item.extras.customNumber}</p>}
                      {item.extras?.patch && <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#6c757d' }}>🎖️ Patch: {item.extras.customPatch || 'Yes'}</p>}
                    </div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#121416', flexShrink: 0 }}>
                      {formatPrice(convertPrice(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setPromoOpen(o => !o)}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#121416' }}>{appliedCoupon ? `${t('rb_cart_promo_code')} (${appliedCoupon.code})` : t('rb_cart_have_promo_code')}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#121416' }}>{appliedCoupon ? t('rb_cart_edit') : (promoOpen ? '−' : t('rb_cart_add'))}</span>
                </div>
                {promoOpen && (
                  <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Enter promo code" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} disabled={!!appliedCoupon}
                      style={{ ...inputStyle, padding: '0.55rem 0.8rem', flex: 1 }} />
                    {!appliedCoupon ? (
                      <button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponCode}
                        style={{ padding: '0 1rem', borderRadius: '8px', background: '#121416', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}>
                        {isVerifyingCoupon ? '...' : t('rb_cart_apply')}
                      </button>
                    ) : (
                      <button onClick={() => { updateAppliedCouponState(null); setCouponCode(''); }}
                        style={{ padding: '0 0.8rem', borderRadius: '8px', background: '#fff3f3', color: '#dc3545', border: '1px solid #fecaca', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}>
                        {t('rb_cart_remove')}
                      </button>
                    )}
                  </div>
                )}
                {couponError && <p style={{ color: '#dc3545', fontSize: '0.75rem', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>{couponError}</p>}
                {appliedCoupon && <p style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>✓ Coupon <strong>{appliedCoupon.code}</strong> applied! ({appliedCoupon.discount_percent}% OFF)</p>}
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#6c757d' }}>
                  <span>{t('rb_cart_subtotal')}</span><span>{formatPrice(displaySubtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#16a34a', fontWeight: 700 }}>
                    <span>{t('rb_cart_volume_discount')}</span><span>-{formatPrice(displayDiscount)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#16a34a', fontWeight: 700 }}>
                    <span>{t('rb_cart_promo_code')} ({appliedCoupon.discount_percent}% OFF)</span><span>-{formatPrice(displayCouponDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: currentShipping === 0 ? '#16a34a' : '#495057', fontWeight: currentShipping === 0 ? 700 : 400 }}>
                  <span>{t('rb_cart_shipping')}</span><span>{currentShipping === 0 ? t('rb_cart_free') : formatPrice(displayShipping)}</span>
                </div>
                {paymentMethod === 'paypal' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>
                    <span>PayPal Fee (4.9% + $0.30)</span><span>+{formatPrice(displayPaypalFee)}</span>
                  </div>
                )}
                {paymentMethod === 'stripe' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>
                    <span>Card Fee (3.5% + $0.30)</span><span>+{formatPrice(displayStripeFee)}</span>
                  </div>
                )}
              </div>

              {/* Cart Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: '#f8f9fa', borderRadius: '8px', padding: '0.9rem 1rem', marginBottom: '1.2rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#121416' }}>{t('rb_cart_total')}</span>
                <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#121416' }}>{formatPrice(displayFinalTotal)}</span>
              </div>

              {/* Payment Method */}
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>{t('rb_checkout_payment_method')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.2rem' }}>
                <button onClick={() => setPaymentMethod('whatsapp')}
                  style={{ padding: '0.9rem 0.4rem', borderRadius: '10px', border: `2px solid ${paymentMethod === 'whatsapp' ? '#25D366' : '#dee2e6'}`, background: paymentMethod === 'whatsapp' ? '#f0fdf4' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                  <MessageSquare size={20} color={paymentMethod === 'whatsapp' ? '#25D366' : '#adb5bd'} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: paymentMethod === 'whatsapp' ? '#121416' : '#6c757d' }}>WhatsApp</span>
                </button>
                <button onClick={() => setPaymentMethod('paypal')}
                  style={{ padding: '0.9rem 0.4rem', borderRadius: '10px', border: `2px solid ${paymentMethod === 'paypal' ? '#0070BA' : '#dee2e6'}`, background: paymentMethod === 'paypal' ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                  <CreditCard size={20} color={paymentMethod === 'paypal' ? '#0070BA' : '#adb5bd'} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: paymentMethod === 'paypal' ? '#121416' : '#6c757d' }}>PayPal</span>
                </button>
                <button onClick={() => setPaymentMethod('stripe')}
                  style={{ padding: '0.9rem 0.4rem', borderRadius: '10px', border: `2px solid ${paymentMethod === 'stripe' ? '#635BFF' : '#dee2e6'}`, background: paymentMethod === 'stripe' ? '#f8f8ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                  <CreditCard size={20} color={paymentMethod === 'stripe' ? '#635BFF' : '#adb5bd'} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: paymentMethod === 'stripe' ? '#121416' : '#6c757d' }}>Card (Stripe)</span>
                </button>
              </div>

              {/* CTA */}
              {paymentMethod === 'whatsapp' ? (
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '1rem', background: isSubmitting ? '#adb5bd' : '#121416', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
                >
                  <WhatsAppIcon size={20} />
                  {isSubmitting ? '...' : t('rb_checkout_place_order_wa')}
                </button>
              ) : paymentMethod === 'stripe' ? (
                <button
                  onClick={handleStripeCheckout}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '1rem', background: isSubmitting ? '#adb5bd' : '#635BFF', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
                >
                  <CreditCard size={20} />
                  {isSubmitting ? '...' : `${t('rb_checkout_pay_card')} (${formatPrice(displayFinalTotal)})`}
                </button>
              ) : (
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <PayPalButtons
                    style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                    onClick={(data, actions) => validateForm() ? actions.resolve() : actions.reject()}
                    createOrder={(data, actions) => createPaypalOrder(actions)}
                    onApprove={(data, actions) => handlePaypalApprove(actions)}
                  />
                </div>
              )}

              {/* Trust Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <Lock size={12} color="#6c757d" />
                <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{t('rb_checkout_secure')}</span>
              </div>
            </section>
          </div>
        </div>

        {/* Ready to Ship */}
        <div style={{ maxWidth: '1100px', margin: '0 auto 2rem', padding: '0 1.5rem' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <ShieldCheck size={20} color="#16a34a" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#15803d' }}>{t('rb_prod_shipping_ready')}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534' }}>{t('rb_checkout_ready_to_ship_banner')}</p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes modalIn { from { opacity:0; transform: scale(0.95); } to { opacity:1; transform: scale(1); } }
          @media (max-width: 768px) {
            input, select, textarea { font-size: 16px !important; }
          }
        `}</style>
      </div>
    </PayPalScriptProvider>
  );
};

export default RebrandCheckout;

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogIn, MapPin, Truck, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { supabase } from '../services/supabase';
import { useEffect } from 'react';

const Checkout = () => {
  const { cartItems, cartTotal, subtotal, discount } = useCart();
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

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data && data.value) setWaNumber(data.value);
    }
    loadConfig();
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

  const generateWhatsAppMessage = () => {
    let message = `*NOVO PEDIDO - iFOOTY*\n\n`;
    message += `*CLIENTE:* ${formData.name}\n`;
    message += `*ENDEREÇO DE ENTREGA:*\n`;
    message += `${formData.street}${formData.apartment ? ', Apt ' + formData.apartment : ''}\n`;
    message += `${formData.city}, ${formData.province}\n`;
    message += `${formData.postalCode}\n\n`;
    
    message += `*ITENS DO PEDIDO:*\n`;
    cartItems.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (${item.size}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*TOTAL: $${cartTotal.toFixed(2)} CAD*\n\n`;
    message += `Aguardo as instruções para o Interac e-Transfer! 🇨🇦`;
    
    return message;
  };

  const handleSubmitOrder = async () => {
    if (!formData.street || !formData.city || !formData.province || !formData.postalCode) {
      alert("Por favor, preencha todos os campos obrigatórios de endereço.");
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
          price: item.price
        })),
        total_price: cartTotal,
        status: 'pending'
      };

      const { error: orderError } = await supabase.from('orders').insert([orderData]);
      if (orderError) throw orderError;

      // 1.5. Notificar por E-mail (Backstage)
      try {
        fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
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
      } catch (err) {
        console.error("Erro ao disparar notificação de e-mail:", err);
      }

      // 2. Atualizar o Perfil se solicitado
      if (formData.saveAddress) {
        await supabase.from('profiles').update({
          street: formData.street,
          apartment: formData.apartment,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode
        }).eq('id', user.id);
      }

      // 3. Abrir WhatsApp
      const message = generateWhatsAppMessage();
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
      
      // Opcional: Limpar carrinho aqui ou navegar para sucesso
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      alert("Houve um erro ao salvar seu pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Calma lá, artilheiro!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Você precisa se identificar no nosso sistema para separar suas camisas.</p>
        <button className="btn-primary" onClick={() => navigate('/auth')} style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogIn size={20} /> Fazer Login / Cadastro
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2>Seu carrinho está vazio.</h2>
        <button className="btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
          Voltar as Compras
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1.5rem' }}>
      <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> Voltar
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
        
        {/* Form */}
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <MapPin color="var(--accent-color)" /> Entrega no Canadá
          </h2>
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Endereço (Rua e Número) *</label>
                  <input 
                    type="text" placeholder="Ex: 123 Bay St"
                    value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Apto/Suite</label>
                  <input 
                    type="text" placeholder="Ex: 402"
                    value={formData.apartment} onChange={e => setFormData({...formData, apartment: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cidade *</label>
                  <input 
                    type="text" placeholder="Ex: Toronto"
                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Província *</label>
                  <select 
                    value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }}
                  >
                    <option value="">Selecione...</option>
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Postal Code *</label>
                  <input 
                    type="text" placeholder="M5H 2N2"
                    value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value.toUpperCase()})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Instagram ou WhatsApp (Opcional)</label>
                <input 
                  type="text" placeholder="@seuinsta ou Telefone"
                  value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1rem', cursor: 'pointer' }} onClick={() => setFormData({...formData, saveAddress: !formData.saveAddress})}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid var(--accent-color)', background: formData.saveAddress ? 'var(--accent-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  {formData.saveAddress && <Save size={14} color="#000" />}
                </div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Salvar este endereço para futuras compras</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Resumo</h2>
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
                 <span>Subtotal</span>
                 <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: 600 }}>
                   <span>Desconto Progressivo</span>
                   <span>- ${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              <span>Total CAD</span>
              <span style={{ color: 'var(--accent-color)' }}>${cartTotal.toFixed(2)}</span>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: isSubmitting ? 'var(--border-color)' : '#25D366', color: '#fff', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              <WhatsAppIcon size={24} />
              {isSubmitting ? 'Processando...' : 'Concluir via WhatsApp'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Você enviará um resumo do pedido para nosso atendimento. O pagamento só será feito após confirmarmos os tamanhos com você via e-Transfer Interac!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

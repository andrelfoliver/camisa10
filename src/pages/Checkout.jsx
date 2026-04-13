import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppIcon from '../components/WhatsAppIcon';

const Checkout = () => {
  const { cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    phone: '',
    instagram: '',
    city: ''
  });

  const generateWhatsAppMessage = () => {
    let message = `Olá, Camisa10! Gostaria de finalizar o pedido abaixo:\n\n*Meu Cadastro:*\nNome: ${formData.name}\nCidade: ${formData.city}\nInsta (Opcional): ${formData.instagram}\n\n*Meu Pedido:*\n`;
    
    cartItems.forEach(item => {
      message += `- 1x ${item.name} (${item.size})\n`;
    });
    
    message += `\n*Total estimado: $${cartTotal.toFixed(2)} CAD*\n\nAguardo as instruções para o Interac e-Transfer!`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5584991847739?text=${encodedMessage}`, '_blank');
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
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Sua Informação</h2>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cidade no Canadá (Province) *</label>
                <input 
                  type="text" placeholder="Ex: Toronto, ON"
                  value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Instagram (Opcional - para contato mais rápido)</label>
                <input 
                  type="text" placeholder="@"
                  value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '1rem' }} 
                />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              <span>Total CAD</span>
              <span style={{ color: 'var(--accent-color)' }}>${cartTotal.toFixed(2)}</span>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: '#fff', fontSize: '1.1rem' }}
              onClick={generateWhatsAppMessage}
            >
              <WhatsAppIcon size={24} />
              Concluir via WhatsApp
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

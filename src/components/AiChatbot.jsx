import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Bot, RotateCcw } from 'lucide-react';
import axios from 'axios';
import WhatsAppIcon from './WhatsAppIcon';
import { supabase } from '../services/supabase';

export default function AiChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const messagesEndRef = useRef(null);

  const [userName, setUserName] = useState(() => sessionStorage.getItem('ifooty_ai_chat_user_name') || '');
  const [whatsappNumber, setWhatsappNumber] = useState('15146189914'); // Default fallback number
  const [sessionId, setSessionId] = useState(() => {
    let id = sessionStorage.getItem('ifooty_ai_chat_session_id');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem('ifooty_ai_chat_session_id', id);
    }
    return id;
  });

  const getInitialMessages = (name) => {
    if (!name) {
      return [{
        role: 'assistant',
        content: `Olá! Sou o **Mister Oliver** ⚽. Como posso te chamar?`
      }];
    }
    return [{
      role: 'assistant',
      content: `Olá! Sou o **Mister Oliver** ⚽.
Prazer em te ver novamente, **${name}**! 🤝 Como posso te ajudar hoje?

Posso te ajudar com:
- 📐 **Calcular seu tamanho ideal** (basta digitar sua altura e peso)
- 🚚 **Prazos de entrega e frete**
- 💳 **Formas de pagamento no Canadá e EUA**
- 👕 **Encontrar os mantos mais irados da loja!**`
    }];
  };

  // Load message history from sessionStorage and fetch WhatsApp number
  useEffect(() => {
    const savedChat = sessionStorage.getItem('ifooty_ai_chat_messages');
    const name = sessionStorage.getItem('ifooty_ai_chat_user_name') || '';
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        setMessages(getInitialMessages(name));
      }
    } else {
      setMessages(getInitialMessages(name));
    }

    const fetchWhatsapp = async () => {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'whatsapp_number')
          .single();
        if (data && data.value) {
          setWhatsappNumber(data.value.replace(/\D/g, ''));
        }
      } catch (err) {
        console.error('Error fetching whatsapp number:', err);
      }
    };
    fetchWhatsapp();

    // Hide tooltip automatically after 8 seconds
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  // Save messages to sessionStorage
  const saveMessages = (updatedMessages) => {
    setMessages(updatedMessages);
    sessionStorage.setItem('ifooty_ai_chat_messages', JSON.stringify(updatedMessages));
  };

  // Save conversation to Supabase DB
  const saveSessionToDb = async (updatedMessages, currentName) => {
    if (!sessionId) return;
    try {
      const name = currentName || userName || null;
      await supabase.from('ai_conversations').upsert({
        session_id: sessionId,
        user_name: name,
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' });
    } catch (dbErr) {
      console.error('❌ Error saving conversation to database from client:', dbErr);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Parse custom markdown (bold and internal/external links)
  const renderMessageContent = (content) => {
    if (!content) return '';
    const parts = [];
    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const tokens = content.split(regex);

    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
        const match = token.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const label = match[1];
          const url = match[2];
          const isExternal = url.startsWith('http');
          
          if (isExternal) {
            return (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent-color)',
                  textDecoration: 'underline',
                  fontWeight: '700',
                  wordBreak: 'break-word'
                }}
              >
                {label}
              </a>
            );
          } else {
            return (
              <a
                key={i}
                href={url}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(url);
                  setIsOpen(false); // Close chatbot upon clicking product link to focus on product
                }}
                style={{
                  color: 'var(--accent-color)',
                  textDecoration: 'underline',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {label}
              </a>
            );
          }
        }
      }
      return token;
    });
  };

  const handleWhatsappHandoff = () => {
    const chatHistory = messages
      .filter(m => m.content && !m.content.includes("Como posso te chamar?"))
      .slice(-5);

    let intro = `Olá, meu nome é ${userName || 'Visitante'}. Estava conversando com a IA da iFooty e gostaria de falar com o suporte.\n\n`;
    
    let historyText = '';
    if (chatHistory.length > 0) {
      historyText = `*Histórico da conversa:*\n`;
      chatHistory.forEach(m => {
        const sender = m.role === 'user' ? 'Cliente' : 'IA';
        let cleanContent = m.content
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
          
        historyText += `- *${sender}:* ${cleanContent}\n`;
      });
    }

    const fullMessage = intro + historyText;
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) setInput('');

    // Safety limit check
    if (messages.filter(m => m.role === 'user').length >= 20) {
      return;
    }

    // Onboarding: check if userName is empty and capture it
    if (!userName) {
      const name = text;
      sessionStorage.setItem('ifooty_ai_chat_user_name', name);
      setUserName(name);

      const userMsg = { role: 'user', content: name };
      const welcomeMsg = {
        role: 'assistant',
        content: `Prazer em te conhecer, **${name}**! 🤝 Como posso te ajudar hoje?

Posso te ajudar com:
- 📐 **Calcular seu tamanho ideal** (basta digitar sua altura e peso)
- 🚚 **Prazos de entrega e frete**
- 💳 **Formas de pagamento no Canadá e EUA**
- 👕 **Encontrar os mantos mais irados da loja!**`
      };

      const updated = [...messages, userMsg, welcomeMsg];
      saveMessages(updated);
      saveSessionToDb(updated, name);
      return;
    }

    const newMessages = [...messages, { role: 'user', content: text }];
    saveMessages(newMessages);
    setIsLoading(true);
    setShowTooltip(false);

    try {
      // Send message history to our backend serverless route
      const response = await axios.post('/api/chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        sessionId,
        userName
      });

      if (response.data && response.data.reply) {
        const updatedMessages = [...newMessages, { role: 'assistant', content: response.data.reply }];
        saveMessages(updatedMessages);
        saveSessionToDb(updatedMessages);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('AI Chatbot connection error:', error);
      saveMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Desculpe, tive um problema de conexão. Poderia tentar enviar sua mensagem novamente? 😢'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setShowConfirmReset(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const quickPrompts = [
    { label: 'Qual meu tamanho? 📐', text: 'Como eu calculo meu tamanho ideal?' },
    { label: 'Prazos de entrega 🚚', text: 'Quais são os prazos de entrega e valor do frete?' },
    { label: 'Formas de pagamento 💳', text: 'Quais formas de pagamento vocês aceitam?' }
  ];

  const isLimitExceeded = messages.filter(m => m.role === 'user').length >= 20;

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, fontFamily: 'var(--font-body)' }}>
      {/* Tooltip bubble prompt */}
      {showTooltip && !isOpen && (
        <div 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'absolute',
            bottom: '4.5rem',
            right: 0,
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--accent-color)',
            color: '#fff',
            padding: '0.6rem 0.9rem',
            borderRadius: '16px',
            fontSize: '0.78rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6), 0 0 12px var(--accent-glow)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            animation: 'whatsappPulse 3s infinite ease-in-out',
            transformOrigin: 'bottom right'
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            background: 'var(--accent-color)',
            borderRadius: '50%',
            boxShadow: '0 0 6px var(--accent-color)'
          }}></span>
          Dúvidas sobre tamanho? Pergunte à IA! 📐
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            right: '20px',
            width: '8px',
            height: '8px',
            background: 'rgba(10, 10, 10, 0.95)',
            borderRight: '1px solid var(--accent-color)',
            borderBottom: '1px solid var(--accent-color)',
            transform: 'rotate(45deg)'
          }}></div>
        </div>
      )}

      {/* Floating Sparkles Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'transparent',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px var(--accent-glow)',
            border: '2px solid var(--accent-color)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            padding: 0,
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.7), 0 0 20px var(--accent-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px var(--accent-glow)';
          }}
          title="iFooty AI Assistant"
        >
          <img 
            src="/avatar-ifooty-ai.png" 
            alt="Mister Oliver" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }} 
          />
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '350px',
            height: '480px',
            background: 'rgba(15, 15, 20, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Custom Confirmation Popup overlay inside Chatbot */}
          {showConfirmReset && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(7, 7, 9, 0.95)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                zIndex: 10,
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #EF4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}
              >
                <RotateCcw size={20} color="#EF4444" />
              </div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Limpar Conversa?
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                Tem certeza que deseja apagar todo o histórico de mensagens? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '0.8rem', width: '100%' }}>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 650,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    sessionStorage.removeItem('ifooty_ai_chat_messages');
                    sessionStorage.removeItem('ifooty_ai_chat_user_name');
                    sessionStorage.removeItem('ifooty_ai_chat_session_id');
                    
                    const newId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
                    sessionStorage.setItem('ifooty_ai_chat_session_id', newId);
                    setSessionId(newId);
                    setUserName('');
                    
                    const initialMsgs = [{
                      role: 'assistant',
                      content: `Olá! Sou o **Mister Oliver** ⚽. Como posso te chamar?`
                    }];
                    setMessages(initialMsgs);
                    setShowConfirmReset(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '20px',
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 650,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                >
                  Limpar
                </button>
              </div>
            </div>
          )}
          {/* Header */}
          <div
            style={{
              padding: '0.9rem 1.2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src="/avatar-ifooty-ai.png" 
                  alt="Mister Oliver" 
                  style={{ 
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--accent-color)',
                    objectFit: 'cover'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '8px',
                    height: '8px',
                    background: '#25D366',
                    border: '1.5px solid #000',
                    borderRadius: '50%',
                    boxShadow: '0 0 4px #25D366'
                  }}
                ></span>
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 750, color: '#fff', margin: 0 }}>Mister Oliver</h4>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Online • Pronto para ajudar</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {userName && (
                <button
                  onClick={handleWhatsappHandoff}
                  style={{
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)';
                    e.currentTarget.style.color = '#25D366';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  title="Falar com Suporte"
                >
                  <WhatsAppIcon size={15} fill="currentColor" />
                </button>
              )}
              <button
                onClick={handleClearChat}
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'var(--accent-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
                title="Limpar Conversa"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '1.2rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'linear-gradient(to bottom, rgba(7, 7, 9, 0) 0%, rgba(7, 7, 9, 0.5) 100%)'
            }}
            className="custom-scrollbar"
          >
            {messages.map((m, index) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: isAssistant ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      background: isAssistant ? 'rgba(255, 255, 255, 0.03)' : 'rgba(164, 210, 51, 0.08)',
                      border: `1px solid ${isAssistant ? 'var(--border-color)' : 'rgba(164, 210, 51, 0.25)'}`,
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      lineHeight: '1.45',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {isAssistant ? renderMessageContent(m.content) : m.content}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start', padding: '0.5rem 0.8rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <span className="dot-typing" style={{ animationDelay: '0s' }}></span>
                <span className="dot-typing" style={{ animationDelay: '0.2s' }}></span>
                <span className="dot-typing" style={{ animationDelay: '0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Pills */}
          {userName && messages.length <= 1 && !isLoading && (
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                padding: '0 1rem 0.6rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}
              className="custom-scrollbar"
            >
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                    e.currentTarget.style.color = 'var(--accent-color)';
                    e.currentTarget.style.background = 'rgba(164, 210, 51, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div
            style={{
              padding: '0.8rem 1rem',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder={!userName ? "Digite seu nome..." : (isLimitExceeded ? "Limite atingido. Limpe o chat para recomeçar." : "Digite sua dúvida...")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || isLimitExceeded}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '0.55rem 1rem',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(164, 210, 51, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || isLimitExceeded || !input.trim()}
              style={{
                background: !isLimitExceeded && input.trim() ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                color: !isLimitExceeded && input.trim() ? '#000' : 'var(--text-muted)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                cursor: !isLimitExceeded && input.trim() ? 'pointer' : 'default',
                flexShrink: 0
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

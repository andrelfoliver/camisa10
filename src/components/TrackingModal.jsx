import React, { useState, useRef } from 'react';
import { X, Search, Upload, Loader2, Package, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const TrackingModal = ({ isOpen, onClose }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent_trackings_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const saveRecentSearch = (num, fullName) => {
    if (!num) return;
    const firstName = fullName ? fullName.split(' ')[0] : '';
    const label = firstName ? `${num} (${firstName})` : num;
    const entry = { num, label };
    
    const updated = [entry, ...recentSearches.filter(s => s.num !== num)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_trackings_v2', JSON.stringify(updated));
  };

  const handleSearch = async (manualNum = null) => {
    const num = manualNum || trackingNumber;
    if (!num) {
      toast.error("Digite um número de rastreio.");
      return;
    }
    setLoading(true);
    if (manualNum) setTrackingNumber(manualNum);
    
    try {
      const { data, error } = await supabase.functions.invoke('track-package', {
        body: { trackingNumber: num }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTrackingData(data.trackingData);
      setHistory(data.history || []);
      
      if (data.trackingData || (data.history && data.history.length > 0)) {
        saveRecentSearch(num, data.trackingData?.consigneeName);
        toast.success("Rastreamento atualizado!");
      } else {
        toast.error("Nenhum dado encontrado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao buscar rastreio.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    toast("Lendo etiqueta... Isso pode levar alguns segundos.", { icon: '🔍' });

    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const cleanText = text.replace(/\s/g, '');
      const match = cleanText.match(/201\d{13}/);

      if (match) {
        setTrackingNumber(match[0]);
        toast.success("Rastreio identificado!");
        handleSearch(match[0]);
      } else {
        const fallbackMatch = cleanText.match(/[A-Z0-9]{10,20}/);
        if (fallbackMatch) {
          setTrackingNumber(fallbackMatch[0]);
          toast("Possível rastreio encontrado.", { icon: '⚠️' });
        } else {
          toast.error("Não foi possível encontrar o número de rastreio.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar imagem.");
    } finally {
      setOcrLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', padding: '1rem' }}>
      <div style={{ background: 'var(--surface-color)', width: '100%', maxWidth: '600px', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--accent-color)" /> Rastreamento Logístico
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Ex: 2012559702029615"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', background: '#000', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={ocrLoading}
              style={{ padding: '0 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              title="Ler Etiqueta por Foto (OCR)"
            >
              {ocrLoading ? <Loader2 size={20} className="spinner" /> : <Upload size={20} />}
            </button>

            <button 
              onClick={() => handleSearch()}
              disabled={loading || ocrLoading}
              className="btn-primary"
              style={{ padding: '0 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? <Loader2 size={20} className="spinner" /> : <Search size={20} />} Buscar
            </button>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '0.3rem' }}>Recentes:</span>
              {recentSearches.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSearch(item.num)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: 'var(--accent-color)', cursor: 'pointer' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Resultado do Rastreamento */}
          {trackingData && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cliente / Consignee</span>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{trackingData.consigneeName || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ref do Pedido</span>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{trackingData.referenceNo || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destino</span>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }}/>{trackingData.country || 'N/A'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data de Envio</span>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }}/>{trackingData.date || 'N/A'}</p>
                </div>
              </div>

              {/* Timeline */}
              {history.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Histórico (Timeline)</h3>
                  <div style={{ position: 'relative', paddingLeft: '20px' }}>
                    {/* Linha vertical */}
                    <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-color)' }}></div>
                    
                    {history.map((item, index) => {
                      const isFirst = index === 0;
                      return (
                        <div key={index} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                          <div style={{ position: 'absolute', left: '-20px', top: '3px', background: 'var(--bg-color)' }}>
                            <CheckCircle size={16} color={isFirst ? 'var(--accent-color)' : 'var(--text-muted)'} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: isFirst ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {item[0] || 'Data Indisponível'}
                            </span>
                            <p style={{ margin: '0.2rem 0 0 0', color: isFirst ? '#fff' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                              {item[1] ? <strong>[{item[1]}] </strong> : ''}
                              {item[2] || 'Status Indisponível'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!trackingData && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Digite o código ou faça upload da etiqueta<br/>para buscar o rastreio.</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default TrackingModal;

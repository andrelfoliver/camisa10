import React, { useState, useRef } from 'react';
import { X, Search, Upload, Loader2, Package, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

// Image preprocessing for OCR to boost contrast and binarize shipping labels
const preprocessImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Define a maximum width to optimize performance
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        
        // Boost contrast by 120
        const contrast = 120;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Grayscale luminance
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Apply contrast stretch
          const enhanced = factor * (gray - 128) + 128;
          const finalVal = Math.max(0, Math.min(255, enhanced));
          
          data[i] = finalVal;     // R
          data[i + 1] = finalVal; // G
          data[i + 2] = finalVal; // B
        }
        
        ctx.putImageData(imgData, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getDaysPassedBetween = (startDateStr, endDateStr) => {
  if (!startDateStr) return null;
  
  const parseDatePart = (str) => {
    if (!str) return null;
    return str.includes(' às ') ? str.split(' às ')[0] : str.split(' ')[0];
  };

  const startPart = parseDatePart(startDateStr);
  if (!startPart) return null;
  const startParts = startPart.split('-');
  if (startParts.length !== 3) return null;
  const startYear = parseInt(startParts[0], 10);
  const startMonth = parseInt(startParts[1], 10) - 1;
  const startDay = parseInt(startParts[2], 10);
  if (isNaN(startYear) || isNaN(startMonth) || isNaN(startDay)) return null;

  const dStart = new Date(startYear, startMonth, startDay);

  let dEnd;
  if (endDateStr) {
    const endPart = parseDatePart(endDateStr);
    if (endPart) {
      const endParts = endPart.split('-');
      if (endParts.length === 3) {
        const endYear = parseInt(endParts[0], 10);
        const endMonth = parseInt(endParts[1], 10) - 1;
        const endDay = parseInt(endParts[2], 10);
        if (!isNaN(endYear) && !isNaN(endMonth) && !isNaN(endDay)) {
          dEnd = new Date(endYear, endMonth, endDay);
        }
      }
    }
  }

  if (!dEnd) {
    const today = new Date();
    dEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  const diffTime = dEnd - dStart;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
};

const TrackingModal = ({ isOpen, onClose, initialTrackingNumber = '' }) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent_trackings_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [history, setHistory] = useState([]);
  const [hasCanadaPostData, setHasCanadaPostData] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-search if initial number is provided
  React.useEffect(() => {
    if (isOpen && initialTrackingNumber) {
      setTrackingNumber(initialTrackingNumber);
      handleSearch(initialTrackingNumber);
    } else if (isOpen && !initialTrackingNumber) {
      // Clear data if opening empty
      setTrackingData(null);
      setHistory([]);
      setTrackingNumber('');
    }
  }, [isOpen, initialTrackingNumber]);

  // Handle ESC key press to close the modal
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  const removeRecentSearch = (e, num) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s.num !== num);
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
      setHasCanadaPostData(data.hasCanadaPostData || false);
      
      if (data.trackingData || (data.history && data.history.length > 0)) {
        saveRecentSearch(num, data.trackingData?.consigneeName);
        if (data.hasCanadaPostData) {
          toast.success("Rastreamento completo: China + Canada Post! 🇨🇦");
        } else {
          toast.success("Rastreamento atualizado!");
        }
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
      // Preprocess image to enhance text contrast and remove background/shadow noise
      let processedFile;
      try {
        processedFile = await preprocessImage(file);
      } catch (err) {
        console.warn("Preprocessing failed, fallback to raw file", err);
        processedFile = file;
      }

      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(processedFile);
      await worker.terminate();

      const cleanText = text.replace(/\s/g, '');
      
      // Robust OCR parsing:
      // Match a pattern that matches "201" prefix and 13 digits with common OCR substitutions
      const ocrRegex = /[2Zz][0Oo][1Ii|!l][0-9OoIi|!lZzSsBbGgTt]{13}/;
      const match = cleanText.match(ocrRegex);

      if (match) {
        // Map common OCR substitutions back to correct digits
        const mappedTracking = match[0]
          .replace(/[Oo]/g, '0')
          .replace(/[Ii|!l]/g, '1')
          .replace(/[Zz]/g, '2')
          .replace(/[Ss]/g, '5')
          .replace(/[Bb]/g, '8')
          .replace(/[Gg]/g, '6')
          .replace(/[Tt]/g, '7');

        setTrackingNumber(mappedTracking);
        toast.success("Rastreio identificado!");
        handleSearch(mappedTracking);
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

  const deliveredEvent = history.find(item => {
    const status = (item.status || '').toLowerCase();
    return status.includes('entregue') || status.includes('assinado') || status.includes('delivered');
  });

  const daysPassed = trackingData ? getDaysPassedBetween(trackingData.date, deliveredEvent ? (deliveredEvent.date || deliveredEvent.rawDate) : null) : null;

  const cleanStatusText = (status) => {
    if (!status) return 'Status Indisponível';
    if (status.toUpperCase().includes('MYMEMORY WARNING')) {
      return 'Em trânsito / Atualizando detalhes';
    }
    return status;
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
                <div 
                  key={idx} 
                  onClick={() => handleSearch(item.num)}
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '4px', 
                    padding: '0.2rem 0.5rem', 
                    fontSize: '0.7rem', 
                    color: 'var(--accent-color)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {item.label}
                  <X 
                    size={12} 
                    style={{ color: 'rgba(255,255,255,0.3)', hover: { color: '#ff4d4d' } }} 
                    onClick={(e) => removeRecentSearch(e, item.num)}
                    onMouseEnter={(e) => e.target.style.color = '#ff4d4d'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.3)'}
                  />
                </div>
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
                
                {daysPassed !== null && (
                  <div style={{
                    gridColumn: 'span 2',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(186, 230, 30, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(186, 230, 30, 0.2)'
                      }}>
                        <Clock size={16} color="var(--accent-color)" />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.05em' }}>
                          Tempo de Trânsito
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>
                          {deliveredEvent ? 'Entregue com sucesso' : 'Pacote em trânsito'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--accent-color)',
                        textShadow: '0 0 12px rgba(186, 230, 30, 0.2)',
                        display: 'block'
                      }}>
                        {daysPassed} {daysPassed === 1 ? 'dia' : 'dias'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {deliveredEvent ? 'desde o envio' : 'decorridos'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', margin: 0, color: '#fff' }}>Histórico (Timeline)</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: '4px', padding: '2px 6px', color: '#ff8080' }}>🇨🇳 China</span>
                    {hasCanadaPostData && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(0,100,255,0.2)', border: '1px solid rgba(0,100,255,0.4)', borderRadius: '4px', padding: '2px 6px', color: '#80c0ff', fontWeight: 600 }}>🇨🇦 Canada Post</span>
                    )}
                  </div>
                </div>

                {!hasCanadaPostData && trackingData?.country === 'CA' && (
                  <div style={{ background: 'rgba(255,165,0,0.05)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: '8px', padding: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Clock size={18} color="orange" />
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#ffcc80', lineHeight: '1.4' }}>
                      <strong>Sincronizando com Canada Post:</strong> As informações locais podem levar até 24h para aparecer após a saída da China.
                    </p>
                  </div>
                )}
                  <div style={{ position: 'relative', paddingLeft: '20px' }}>
                    {/* Linha vertical */}
                    <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-color)' }}></div>
                    
                    {history.length > 0 ? (() => {
                      const groups = {};
                      history.forEach(item => {
                        const datePart = item.date ? item.date.split(' às ')[0] : 'Indisponível';
                        if (!groups[datePart]) groups[datePart] = [];
                        groups[datePart].push(item);
                      });

                      return Object.entries(groups).map(([date, items], gIdx) => (
                        <div key={gIdx} style={{ marginBottom: '2rem' }}>
                          <h4 style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--accent-color)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Calendar size={12} /> {date}
                          </h4>
                          
                          {items.map((item, index) => {
                            const isCanada = item.carrier === 'CA';
                            const isFirst = gIdx === 0 && index === 0;
                            const dotColor = isFirst ? 'var(--accent-color)' : isCanada ? '#3b82f6' : 'rgba(255,255,255,0.2)';
                            
                            return (
                              <div key={index} style={{ position: 'relative', marginBottom: '1.2rem', paddingLeft: '5px' }}>
                                <div style={{ 
                                  position: 'absolute', 
                                  left: '-25px', 
                                  top: '4px', 
                                  width: '12px', 
                                  height: '12px', 
                                  borderRadius: '50%', 
                                  background: 'var(--bg-color)',
                                  border: `2px solid ${dotColor}`,
                                  zIndex: 2
                                }}></div>
                                
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.7rem', color: isFirst ? '#fff' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Clock size={10} /> {item.date ? item.date.split(' às ')[1] : ''}
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.55rem', 
                                      background: isCanada ? 'rgba(0,100,255,0.1)' : 'rgba(255,50,50,0.1)', 
                                      borderRadius: '4px', 
                                      padding: '1px 6px', 
                                      color: isCanada ? '#93c5fd' : '#ff9999',
                                      border: `1px solid ${isCanada ? 'rgba(0,100,255,0.2)' : 'rgba(255,50,50,0.2)'}`,
                                      fontWeight: 600
                                    }}>
                                      {isCanada ? '🇨🇦 Canada Post' : '🇨🇳 China'}
                                    </span>
                                  </div>
                                  <p style={{ margin: 0, color: isFirst ? '#fff' : 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    {item.location ? <strong style={{ color: isCanada ? '#93c5fd' : 'inherit' }}>[{item.location}] </strong> : ''}
                                    {cleanStatusText(item.status)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })() : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Buscando detalhes do trajeto...</p>
                    )}
                  </div>
                </div>
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

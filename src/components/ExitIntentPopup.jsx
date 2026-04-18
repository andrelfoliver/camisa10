import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, MessageSquare, Send } from 'lucide-react';

const ExitIntentPopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);

    useEffect(() => {
        // Verifica se já foi mostrado nesta sessão para não ser invasivo
        const shown = sessionStorage.getItem('ifooty_exit_intent_shown');
        if (shown) setHasBeenShown(true);

        const handleMouseLeave = (e) => {
            if (e.clientY <= 0 && !hasBeenShown && !isVisible) {
                setIsVisible(true);
                setHasBeenShown(true);
                sessionStorage.setItem('ifooty_exit_intent_shown', 'true');
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasBeenShown, isVisible]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/send-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback })
            });

            if (response.ok) {
                toast.success('Obrigado pelo seu feedback! Vamos verificar isso. ⚽', {
                    style: {
                        background: '#1a1a1a',
                        color: '#ccff00',
                        border: '1px solid #ccff00'
                    }
                });
                setIsVisible(false);
            } else {
                throw new Error('Erro ao enviar');
            }
        } catch (error) {
            toast.error('Ocorreu um erro ao enviar. Tente novamente mais tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="exit-intent-overlay">
            <div className="exit-intent-content">
                <button 
                    className="close-btn"
                    onClick={() => setIsVisible(false)}
                >
                    <X size={20} />
                </button>

                <div className="popup-header">
                    <div className="icon-badge">
                        <MessageSquare size={24} className="text-neon" />
                    </div>
                    <h2>Antes de ir...</h2>
                    <p>Sentimos muito que você não tenha encontrado o que procurava.</p>
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    <label>Conta pra gente: qual produto você queria ver aqui na iFooty?</label>
                    <textarea
                        placeholder="Ex: Camisa retrô do Brasil 1970, agasalho do Real Madrid..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                    />
                    <button 
                        type="submit" 
                        disabled={isSubmitting || !feedback.trim()}
                        className="submit-btn"
                    >
                        {isSubmitting ? (
                            <span className="loader">Enviando...</span>
                        ) : (
                            <>
                                <span>Enviar Sugestão</span>
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="popup-footer">
                    <p>Prometemos tentar trazer essa novidade para você! ⚽</p>
                </div>
            </div>

            <style jsx>{`
                .exit-intent-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease-out;
                    padding: 20px;
                }

                .exit-intent-content {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 450px;
                    padding: 40px;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                                0 0 40px rgba(204, 255, 0, 0.05);
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .close-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: #222;
                    border: none;
                    color: #666;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: #333;
                    color: #fff;
                    transform: rotate(90deg);
                }

                .popup-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .icon-badge {
                    width: 56px;
                    height: 56px;
                    background: rgba(204, 255, 0, 0.1);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }

                .text-neon {
                    color: #ccff00;
                }

                h2 {
                    color: #fff;
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                p {
                    color: #999;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .feedback-form {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                label {
                    color: #efefef;
                    font-size: 15px;
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                textarea {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 12px;
                    padding: 16px;
                    color: #fff;
                    font-size: 14px;
                    min-height: 120px;
                    resize: none;
                    transition: all 0.2s;
                }

                textarea:focus {
                    outline: none;
                    border-color: #ccff00;
                    box-shadow: 0 0 0 2px rgba(204, 255, 0, 0.1);
                }

                .submit-btn {
                    background: #ccff00;
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    padding: 16px;
                    font-size: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 8px;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(204, 255, 0, 0.2);
                    filter: brightness(1.1);
                }

                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .popup-footer {
                    margin-top: 24px;
                    text-align: center;
                    border-top: 1px solid #222;
                    padding-top: 20px;
                }

                .popup-footer p {
                    font-size: 12px;
                    color: #666;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ExitIntentPopup;

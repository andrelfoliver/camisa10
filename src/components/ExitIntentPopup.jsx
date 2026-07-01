import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, MessageSquare, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from 'react-router-dom';

const ExitIntentPopup = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const isRebrand = location.pathname.includes('/rebrand');

    const EN_STRINGS = {
        exit_title: 'Before you go...',
        exit_subtitle: 'We are sorry that you did not find what you were looking for.',
        exit_label: 'Tell us: which product would you like to see here at iFooty?',
        exit_placeholder: 'e.g. Retro Brazil 1970 jersey, Real Madrid tracksuit...',
        exit_btn_submit: 'Submit Suggestion',
        exit_submitting: 'Sending...',
        exit_footer: 'We promise to try to bring this update to you! ⚽',
        exit_success: 'Thank you for your feedback! We will check it out. ⚽',
        exit_error: 'An error occurred while sending. Please try again later.'
    };

    const getTranslation = (key) => {
        if (isRebrand) {
            return EN_STRINGS[key] || key;
        }
        return t(key);
    };

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

    // Handle ESC key press to close the popup
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isVisible) {
                setIsVisible(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]);

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
                toast.success(getTranslation('exit_success'), {
                    style: isRebrand ? {
                        background: '#FFFFFF',
                        color: '#121416',
                        border: '1px solid #E9ECEF',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '600'
                    } : {
                        background: '#1a1a1a',
                        color: '#ccff00',
                        border: '1px solid #ccff00'
                    }
                });
                setIsVisible(false);
            } else {
                throw new Error('Erro ao enviar');
            }
        } catch {
            toast.error(getTranslation('exit_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`exit-intent-overlay ${isRebrand ? 'rebrand-exit-overlay' : ''}`}>
            <div className={`exit-intent-content ${isRebrand ? 'rebrand-exit-content' : ''}`}>
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
                    <h2>{getTranslation('exit_title')}</h2>
                    <p>{getTranslation('exit_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    <label>{getTranslation('exit_label')}</label>
                    <textarea
                        placeholder={getTranslation('exit_placeholder')}
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
                            <span className="loader">{getTranslation('exit_submitting')}</span>
                        ) : (
                            <>
                                <span>{getTranslation('exit_btn_submit')}</span>
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="popup-footer">
                    <p>{getTranslation('exit_footer')}</p>
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

                /* Rebrand specific style overrides */
                .rebrand-exit-overlay {
                    background: rgba(18, 20, 22, 0.4);
                    backdrop-filter: blur(12px);
                }

                .rebrand-exit-content {
                    background: #ffffff;
                    border: 1px solid #E9ECEF;
                    border-radius: 8px;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.1);
                    font-family: 'Inter', sans-serif;
                }

                .rebrand-exit-content .close-btn {
                    background: #F8F9FA;
                    color: #6C757D;
                }

                .rebrand-exit-content .close-btn:hover {
                    background: #E9ECEF;
                    color: #121416;
                }

                .rebrand-exit-content .icon-badge {
                    background: #CCFF00;
                }

                .rebrand-exit-content .text-neon {
                    color: #121416;
                }

                .rebrand-exit-content h2 {
                    color: #121416;
                    font-weight: 800;
                }

                .rebrand-exit-content p {
                    color: #6C757D;
                }

                .rebrand-exit-content label {
                    color: #121416;
                    font-weight: 600;
                }

                .rebrand-exit-content textarea {
                    background: #F8F9FA;
                    border: 1px solid #E9ECEF;
                    color: #121416;
                    border-radius: 8px;
                }

                .rebrand-exit-content textarea:focus {
                    border-color: #121416;
                    box-shadow: 0 0 0 2px rgba(18, 20, 22, 0.05);
                }

                .rebrand-exit-content .submit-btn {
                    background: #121416;
                    color: #FFFFFF;
                    border-radius: 8px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .rebrand-exit-content .submit-btn:hover:not(:disabled) {
                    background: #CCFF00;
                    color: #121416;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(204, 255, 0, 0.15);
                }

                .rebrand-exit-content .popup-footer {
                    border-top: 1px solid #E9ECEF;
                }

                .rebrand-exit-content .popup-footer p {
                    color: #6C757D;
                }
            `}</style>
        </div>
    );
};

export default ExitIntentPopup;

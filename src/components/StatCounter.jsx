import React, { useState, useEffect, useRef } from 'react';

/**
 * DigitReel: Roda os números de 0 até o dígito alvo (Efeito Mecânico).
 */
const DigitReel = ({ targetDigit, duration = 2000, delay = 0, trigger }) => {
  const iterations = 4;
  const numbers = Array.from({ length: iterations * 10 }, (_, i) => i % 10);
  const finalIndex = ((iterations - 1) * 10) + targetDigit;
  const percentage = (finalIndex / numbers.length) * 100;

  return (
    <div style={{ 
      height: '1.2em', 
      overflow: 'hidden', 
      display: 'inline-block', 
      lineHeight: '1.2em',
      position: 'relative',
      verticalAlign: 'bottom',
      width: '1ch'
    }}>
      <div style={{ 
        transform: trigger ? `translateY(-${percentage}%)` : 'translateY(0%)', 
        transition: `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1)`,
        transitionDelay: `${delay}ms`,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {numbers.map((n, idx) => (
          <span key={idx} style={{ display: 'block', height: '1.2em', textAlign: 'center' }}>{n}</span>
        ))}
      </div>
    </div>
  );
};

/**
 * SimpleCountUp: Incremento numérico fluido (Opção 1 escolhida pelo usuário).
 */
const SimpleCountUp = ({ target, duration = 2000, trigger }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [trigger, target, duration]);

  return <span>{count}</span>;
};

const StatCounter = ({ target, delay = 0, suffix = '', prefix = '', variant = 'reel' }) => {
  const [trigger, setTrigger] = useState(false);
  const containerRef = useRef(null);
  
  const targetStr = target ? target.toString() : '0';
  const digits = targetStr.split('').map(d => parseInt(d)).filter(d => !isNaN(d));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setTrigger(true);
          }, delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={containerRef} style={{ 
      display: 'inline-flex', 
      alignItems: 'baseline', 
      fontVariantNumeric: 'tabular-nums',
      minHeight: '1.2em',
      fontWeight: 'bold'
    }}>
      {prefix}
      {variant === 'simple' ? (
        <SimpleCountUp target={target} duration={2000} trigger={trigger} />
      ) : (
        digits.map((d, i) => (
          <DigitReel 
            key={i} 
            targetDigit={d} 
            trigger={trigger} 
            delay={i * 100} 
            duration={2000 + (i * 300)} 
          />
        ))
      )}
      <span style={{ marginLeft: '1px' }}>{suffix}</span>
    </div>
  );
};

export default StatCounter;

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AnimatedStatsTracker() {
  const { t } = useLanguage();
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef(null);

  // Animated values
  const [jerseysCount, setJerseysCount] = useState(0);
  const [citiesCount, setCitiesCount] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState(0);
  const [provincesCount, setProvincesCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 200);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const duration = 1800; // 1.8s
    const startTime = performance.now();
    const easeOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);

      setJerseysCount(Math.round(eased * 550));
      setCitiesCount(Math.round(eased * 37));
      setDeliveryTime(parseFloat((eased * 11.6).toFixed(1)));
      setProvincesCount(Math.round(eased * 8));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setJerseysCount(550);
        setCitiesCount(37);
        setDeliveryTime(11.6);
        setProvincesCount(8);
      }
    };

    requestAnimationFrame(animate);
  }, [hasAnimated]);

  return (
    <div 
      ref={containerRef}
      style={{
        background: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0.9rem 1rem',
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          maxWidth: '1300px', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '1rem 1.5rem'
        }}
      >
        {/* Item 1: Camisas Entregues */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.15rem' }}>👕</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#CCFF00', letterSpacing: '-0.5px' }}>
              {jerseysCount}+
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('rb_stats_jerseys')}
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)', display: 'none' }} className="desktop-divider" />

        {/* Item 2: Cidades */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.15rem' }}>📍</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#CCFF00', letterSpacing: '-0.5px' }}>
              {citiesCount}+
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('rb_stats_cities')}
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)', display: 'none' }} className="desktop-divider" />

        {/* Item 3: Prazo Médio */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.15rem' }}>⚡</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#CCFF00', letterSpacing: '-0.5px' }}>
              {deliveryTime.toFixed(1)} {t('rb_stats_time_unit')}
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('rb_stats_time')}
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)', display: 'none' }} className="desktop-divider" />

        {/* Item 4: Províncias */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.15rem' }}>🍁</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#CCFF00', letterSpacing: '-0.5px' }}>
              {provincesCount}/10
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('rb_stats_provinces')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

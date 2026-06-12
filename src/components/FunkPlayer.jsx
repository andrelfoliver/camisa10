import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Disc, X, Download, Music } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FunkPlayer = () => {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Sync state with HTML5 Audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      audio.currentTime = 0;
      // loop the audio
      audio.play().catch(() => {});
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    // Initial sync
    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.warn("⚠️ Autoplay block: user interaction required", err);
      });
    }
  };

  // Handle progress bar drag
  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle volume slider change
  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    audio.volume = newVol;
    audio.muted = newVol === 0;
  };

  // Toggle Mute
  const toggleMute = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audio.muted = nextMute;
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} src="/funk-ifooty.mp3" preload="metadata" />

      <div className="funk-player-wrapper" style={{ position: 'fixed', bottom: '7.5rem', right: '2rem', zIndex: 999 }}>
        {/* State 1: Minimized */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="funk-teaser-btn pulse-glow"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--surface-color)',
              border: '2px solid var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--accent-color)',
              boxShadow: '0 0 15px rgba(204, 255, 0, 0.3)',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            title={language === 'pt' ? 'Ouvir o Funk do iFooty! 🎧' : 'Listen to Funk do iFooty! 🎧'}
          >
            {isPlaying ? (
              <Disc size={28} className="spin-animation" style={{ animation: 'spin 4s linear infinite' }} />
            ) : (
              <Music size={28} />
            )}

            {/* Equalizer animation mini bars */}
            {isPlaying && (
              <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '2px', height: '10px', alignItems: 'flex-end' }}>
                <span className="eq-bar bar1" />
                <span className="eq-bar bar2" />
                <span className="eq-bar bar3" />
              </div>
            )}
          </button>
        )}

        {/* State 2: Expanded Player */}
        {isExpanded && (
          <div
            className="glass-panel funk-expanded-card"
            style={{
              width: '320px',
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'rgba(31, 41, 55, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(204, 255, 0, 0.25)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(204, 255, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
              animation: 'fadeInUp 0.3s forwards'
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <Disc
                    size={32}
                    className={isPlaying ? 'spin-animation' : ''}
                    style={{
                      color: isPlaying ? 'var(--accent-color)' : 'var(--text-muted)',
                      animation: isPlaying ? 'spin 3s linear infinite' : 'none',
                      transformOrigin: 'center'
                    }}
                  />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Funk do iFooty 🇧🇷🔥</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {language === 'pt' ? 'Jingle oficial da iFooty' : 'Official iFooty Jingle'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '1rem' }}>
              <button
                onClick={togglePlay}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--accent-color)',
                  color: '#000',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.15s'
                }}
                className="hover-scale"
              >
                {isPlaying ? <Pause size={20} fill="#000" /> : <Play size={20} fill="#000" style={{ marginLeft: '2px' }} />}
              </button>

              {/* Progress Slider wrapper */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={handleProgressChange}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent-color)',
                    cursor: 'pointer',
                    height: '4px',
                    borderRadius: '2px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Volume & Download Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.8rem' }}>
              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={toggleMute} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    width: '70px',
                    accentColor: 'var(--accent-color)',
                    cursor: 'pointer',
                    height: '4px',
                    borderRadius: '2px'
                  }}
                />
              </div>

              {/* Download */}
              <a
                href="/funk-ifooty.mp3"
                download="funk-ifooty.mp3"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--accent-color)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid rgba(204, 255, 0, 0.15)',
                  transition: 'all 0.2s'
                }}
                className="hover-highlight"
              >
                <Download size={14} /> {language === 'pt' ? 'Baixar MP3' : 'Download MP3'}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes barJump {
          0% { height: 3px; }
          50% { height: 12px; }
          100% { height: 3px; }
        }
        .funk-teaser-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 25px rgba(204, 255, 0, 0.6);
        }
        .pulse-glow {
          animation: pulseGlow 2s infinite alternate;
        }
        @keyframes pulseGlow {
          from { box-shadow: 0 0 15px rgba(204, 255, 0, 0.3); }
          to { box-shadow: 0 0 22px rgba(204, 255, 0, 0.55); }
        }
        .eq-bar {
          width: 3px;
          background: var(--accent-color);
          border-radius: 1px;
          animation: barJump 1s infinite ease-in-out;
        }
        .bar1 { animation-delay: 0.1s; }
        .bar2 { animation-delay: 0.3s; animation-duration: 0.8s; }
        .bar3 { animation-delay: 0.2s; animation-duration: 1.2s; }
        .hover-scale:hover {
          transform: scale(1.08);
        }
        .hover-highlight:hover {
          background: rgba(204, 255, 0, 0.1) !important;
          border-color: var(--accent-color) !important;
        }
      `}</style>
    </>
  );
};

export default FunkPlayer;

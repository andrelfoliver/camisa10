import React from 'react';

// Detecta URLs de vídeo (ignora query string / hash, ou detecta #video e data:video)
export const isVideoUrl = (src) => {
  if (typeof src !== 'string' || !src) return false;
  const clean = src.split(/[?#]/)[0];
  if (/\.(mp4|webm)$/i.test(clean)) return true;
  if (src.startsWith('data:video/')) return true;
  if (src.includes('#video') || src.includes('.mp4') || src.includes('.webm')) return true;
  return false;
};

const ProductMedia = ({ src, alt, style, className, onError, ...props }) => {
  const isVideo = isVideoUrl(src);

  if (isVideo) {
    return (
      <video
        src={src}
        style={{ objectFit: 'contain', ...style }}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onError={onError}
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Product Image'}
      style={style}
      className={className}
      loading="lazy"
      onError={onError}
      {...props}
    />
  );
};

export default ProductMedia;

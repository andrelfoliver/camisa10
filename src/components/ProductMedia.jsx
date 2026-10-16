import React from 'react';

// Detecta URLs de vídeo (ignora query string / hash, ex: ?t=123)
export const isVideoUrl = (src) =>
  typeof src === 'string' && /\.(mp4|webm)$/i.test(src.split(/[?#]/)[0]);

const ProductMedia = ({ src, alt, style, className, onError, ...props }) => {
  const isVideo = isVideoUrl(src);

  if (isVideo) {
    return (
      <video
        src={src}
        style={{ ...style, objectFit: 'contain' }}
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

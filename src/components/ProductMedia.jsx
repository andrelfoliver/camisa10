import React from 'react';

const ProductMedia = ({ src, alt, style, className, onError, ...props }) => {
  const isVideo = src && src.toLowerCase().endsWith('.mp4');

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
      onError={onError}
      {...props}
    />
  );
};

export default ProductMedia;

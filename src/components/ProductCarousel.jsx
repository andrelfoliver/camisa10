import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductCarousel = ({ products = [] }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    if (products.length === 0) return;
    const savedIds = localStorage.getItem('featured_shirts');
    if (savedIds) {
      const ids = JSON.parse(savedIds);
      // Mantém a ordem dos ids selecionados no admin
      const filtered = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
      if (filtered.length > 0) {
        setFeaturedProducts(filtered);
        return;
      }
    }
    setFeaturedProducts(products.slice(0, 4));
  }, [products]);

  return (
    <div className="carousel-container">
      {featuredProducts.map(product => (
        <div key={product.id} className="carousel-slide">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
};

export default ProductCarousel;

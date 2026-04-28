import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image = 'https://ifooty.ca/og-image-full.png',
  url = 'https://ifooty.ca',
  type = 'website'
}) => {
  const siteTitle = title ? `${title} | iFooty` : 'iFooty | Especialista em Camisas de Futebol no Canadá - Brasileiras, Europeias e Retrô a Pronta Entrega';
  const siteDescription = description || 'iFooty, a sua conexão com o futebol no Canadá. Encontre mantos sagrados com qualidade premium, envio rápido para todo o país e atendimento personalizado para brasileiros e apaixonados por futebol!';
  const siteKeywords = keywords || 'camisas de futebol canadá, futebol canadá, camisa flamengo canadá, camisa seleção brasileira canadá, camisas de time, jerseys canada';

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />

      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="iFooty" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;

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
  const siteTitle = title ? `${title} | iFooty` : 'iFooty | Premium Sports Jerseys in Canada 🇨🇦';
  const siteDescription = description || 'Premium sports jerseys in Canada. Fast shipping across Canada & USA. Find NHL, NFL, NBA, soccer, and retro jerseys with premium quality.';
  const siteKeywords = keywords || 'sports jerseys canada, soccer jerseys canada, nhl jerseys canada, nfl jerseys canada, nba jerseys canada, soccer store canada, retro jerseys canada';

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

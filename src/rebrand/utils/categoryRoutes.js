/**
 * Canonical category route mapping for the Rebrand.
 * 
 * This is the single source of truth for mapping display categories
 * and DB categories to their canonical URL slugs used in /colecao/:slug routes.
 * 
 * Used by:
 * - ProductPage.jsx (client-side BreadcrumbList JSON-LD)
 * 
 * The server-side equivalent lives in api/product-metadata.js (CATEGORY_TO_ROUTE).
 * Both must stay in sync.
 */

// Display category → canonical route slug
const CATEGORY_TO_ROUTE = {
  'Soccer':        'soccer',
  'Basketball':    'basketball',
  'Hockey':        'hockey',
  'Football':      'football',
  'Baseball':      'baseball',
  'Tênis':         'soccer',
  'Streetwear':    'soccer',
  // DB categories (for broader compatibility)
  'Brasileirão':   'soccer',
  'Seleções':      'soccer',
  'Internacionais':'soccer',
  'Lançamentos':   'soccer',
  'NBA':           'basketball',
  'NHL':           'hockey',
  'NFL':           'football',
  'MLB':           'baseball',
};

const CATEGORY_DISPLAY_NAME = {
  'soccer':     'Soccer',
  'basketball': 'Basketball',
  'hockey':     'Hockey',
  'football':   'Football',
  'baseball':   'Baseball',
};

export function getCategoryRoute(category) {
  return CATEGORY_TO_ROUTE[category] || 'soccer';
}

export function getCategoryDisplayName(category) {
  const route = getCategoryRoute(category);
  return CATEGORY_DISPLAY_NAME[route] || category || 'Jerseys';
}

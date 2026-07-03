// src/context/AnalyticsContext.jsx
// Wrapper leve sobre o serviço analytics.js existente
import React, { createContext, useContext, useCallback } from 'react';
import { trackEvent } from '../services/analytics';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
  const track = useCallback((eventType, metadata = {}) => {
    const nameMap = {
      page_view:         'PageView',
      product_view:      'ViewContent',
      category_view:     'ViewCategory',
      search:            'Search',
      cart_add:          'AddToCart',
      cart_remove:       'RemoveFromCart',
      checkout_start:    'InitiateCheckout',
      checkout_abandon:  'CheckoutAbandon',
      purchase:          'Purchase',
      login:             'Login',
      signup:            'CompleteRegistration',
    };

    const eventName = nameMap[eventType] || eventType;
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    trackEvent(eventName, { path, ...metadata });
  }, []);

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) return { track: () => {} };
  return ctx;
};

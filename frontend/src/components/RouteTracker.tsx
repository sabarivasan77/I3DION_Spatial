import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tracker } from '../services/Tracker';

export default function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // 1. Centralized Route Scroll Restoration: Scroll to top of new page on navigation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior
    });

    // 2. Analytics Tracking
    const isProductPage = location.pathname.startsWith('/product/') || location.pathname.startsWith('/hub/product/');
    let slug = undefined;
    
    if (isProductPage) {
      slug = location.pathname.split('/product/')[1] || location.pathname.split('/hub/product/')[1];
      Tracker.trackEvent('product_view', { path: location.pathname }, slug);
    } else {
      Tracker.trackEvent('page_view', { path: location.pathname });
    }
  }, [location.pathname]);

  return null;
}

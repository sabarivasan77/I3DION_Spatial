import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tracker } from '../services/Tracker';

export default function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Determine if it's a product page
    const isProductPage = location.pathname.startsWith('/product/');
    let slug = undefined;
    
    if (isProductPage) {
      slug = location.pathname.split('/product/')[1];
      Tracker.trackEvent('product_view', { path: location.pathname }, slug);
    } else {
      Tracker.trackEvent('page_view', { path: location.pathname });
    }
  }, [location.pathname]);

  return null;
}

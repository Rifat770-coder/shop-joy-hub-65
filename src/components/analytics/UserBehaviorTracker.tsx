import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  useAutoPageTracking, 
  useClickTracking, 
  useScrollTracking,
  useUserBehaviorTracking 
} from '@/hooks/useAnalytics';

interface UserBehaviorTrackerProps {
  children: React.ReactNode;
  enabled?: boolean;
}

/**
 * Global user behavior tracking component
 * Automatically tracks page views, clicks, and scroll behavior
 */
export const UserBehaviorTracker: React.FC<UserBehaviorTrackerProps> = ({ 
  children, 
  enabled = true 
}) => {
  const location = useLocation();
  const { trackProductView, trackAddToCart, trackPurchase } = useUserBehaviorTracking();

  // Auto-track page views
  useAutoPageTracking(location.pathname, enabled);
  
  // Auto-track clicks
  useClickTracking(location.pathname, enabled);
  
  // Auto-track scroll behavior
  useScrollTracking(location.pathname, enabled);

  // Expose tracking functions globally for manual tracking
  useEffect(() => {
    if (enabled) {
      // Make tracking functions available globally
      (window as any).analytics = {
        trackProductView,
        trackAddToCart,
        trackPurchase,
      };
    }

    return () => {
      // Cleanup
      delete (window as any).analytics;
    };
  }, [enabled, trackProductView, trackAddToCart, trackPurchase]);

  return <>{children}</>;
};

export default UserBehaviorTracker;
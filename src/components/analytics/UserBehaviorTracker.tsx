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

  // Auto-track page views only — click/scroll tracking disabled (too many Appwrite calls)
  useAutoPageTracking(location.pathname, enabled);
  // useClickTracking(location.pathname, enabled);   // disabled: fires on every click
  // useScrollTracking(location.pathname, enabled);  // disabled: fires constantly

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
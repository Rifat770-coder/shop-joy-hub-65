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
  // Analytics tracking disabled to reduce memory/network usage
  return <>{children}</>;
};

export default UserBehaviorTracker;
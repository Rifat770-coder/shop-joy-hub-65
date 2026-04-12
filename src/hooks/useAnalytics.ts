/**
 * Analytics Hooks
 * React hooks for analytics data and user behavior tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import { 
  CustomerLifetimeValue, 
  SalesForecast, 
  InventoryAnalysis, 
  CustomerSegment,
  CohortAnalysis,
  UserBehaviorEvent,
  HeatmapData
} from '@/types/analytics';
import { useEffect, useCallback } from 'react';

/**
 * Hook for Customer Lifetime Value data
 */
export const useCustomerLTV = () => {
  return useQuery<CustomerLifetimeValue[]>({
    queryKey: ['analytics', 'customer-ltv'],
    queryFn: () => analyticsService.calculateCustomerLTV(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for Sales Forecasting
 */
export const useSalesForecast = (days: number = 30) => {
  return useQuery<SalesForecast[]>({
    queryKey: ['analytics', 'sales-forecast', days],
    queryFn: () => analyticsService.generateSalesForecast(days),
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for Inventory Analysis
 */
export const useInventoryAnalysis = () => {
  return useQuery<InventoryAnalysis[]>({
    queryKey: ['analytics', 'inventory-analysis'],
    queryFn: () => analyticsService.analyzeInventory(),
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for Customer Segmentation
 */
export const useCustomerSegmentation = () => {
  return useQuery<CustomerSegment[]>({
    queryKey: ['analytics', 'customer-segmentation'],
    queryFn: () => analyticsService.performCustomerSegmentation(),
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for Cohort Analysis
 */
export const useCohortAnalysis = () => {
  return useQuery<CohortAnalysis[]>({
    queryKey: ['analytics', 'cohort-analysis'],
    queryFn: () => analyticsService.generateCohortAnalysis(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for Heatmap Data
 */
export const useHeatmapData = (page: string, days: number = 7) => {
  return useQuery<HeatmapData[]>({
    queryKey: ['analytics', 'heatmap', page, days],
    queryFn: () => analyticsService.generateHeatmapData(page, days),
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!page,
  });
};

/**
 * Hook for tracking user behavior
 */
export const useUserBehaviorTracking = () => {
  const queryClient = useQueryClient();

  const trackEvent = useMutation({
    mutationFn: (event: Omit<UserBehaviorEvent, 'id' | 'timestamp'>) => 
      analyticsService.trackUserBehavior(event),
    onSuccess: () => {
      // Invalidate heatmap queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['analytics', 'heatmap'] });
    },
  });

  // Helper function to track page views
  const trackPageView = useCallback((page: string, additionalData?: Record<string, any>) => {
    trackEvent.mutate({
      userId: undefined, // Will be set by auth context if available
      sessionId: getSessionId(),
      eventType: 'page_view',
      eventData: { ...additionalData },
      page,
    });
  }, [trackEvent]);

  // Helper function to track clicks
  const trackClick = useCallback((element: string, page: string, coordinates?: { x: number; y: number }) => {
    trackEvent.mutate({
      userId: undefined,
      sessionId: getSessionId(),
      eventType: 'click',
      eventData: { element },
      page,
      coordinates,
    });
  }, [trackEvent]);

  // Helper function to track product views
  const trackProductView = useCallback((productId: string, productName: string, page: string) => {
    trackEvent.mutate({
      userId: undefined,
      sessionId: getSessionId(),
      eventType: 'product_view',
      eventData: { productId, productName },
      page,
    });
  }, [trackEvent]);

  // Helper function to track add to cart
  const trackAddToCart = useCallback((productId: string, quantity: number, price: number, page: string) => {
    trackEvent.mutate({
      userId: undefined,
      sessionId: getSessionId(),
      eventType: 'add_to_cart',
      eventData: { productId, quantity, price, value: quantity * price },
      page,
    });
  }, [trackEvent]);

  // Helper function to track purchases
  const trackPurchase = useCallback((orderId: string, total: number, items: any[], page: string) => {
    trackEvent.mutate({
      userId: undefined,
      sessionId: getSessionId(),
      eventType: 'purchase',
      eventData: { orderId, total, items, itemCount: items.length },
      page,
    });
  }, [trackEvent]);

  return {
    trackEvent: trackEvent.mutate,
    trackPageView,
    trackClick,
    trackProductView,
    trackAddToCart,
    trackPurchase,
    isTracking: trackEvent.isPending,
  };
};

/**
 * Hook for automatic page view tracking
 */
export const useAutoPageTracking = (page: string, enabled: boolean = true) => {
  const { trackPageView } = useUserBehaviorTracking();

  useEffect(() => {
    if (enabled && page) {
      trackPageView(page, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href,
      });
    }
  }, [page, enabled, trackPageView]);
};

/**
 * Hook for click tracking
 */
export const useClickTracking = (page: string, enabled: boolean = true) => {
  const { trackClick } = useUserBehaviorTracking();

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const element = target.tagName.toLowerCase();
      const elementId = target.id;
      const elementClass = target.className;
      
      let elementIdentifier = element;
      if (elementId) elementIdentifier += `#${elementId}`;
      if (elementClass) elementIdentifier += `.${elementClass.split(' ')[0]}`;

      trackClick(elementIdentifier, page, {
        x: event.clientX,
        y: event.clientY,
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [page, enabled, trackClick]);
};

/**
 * Hook for scroll tracking
 */
export const useScrollTracking = (page: string, enabled: boolean = true) => {
  const { trackEvent } = useUserBehaviorTracking();

  useEffect(() => {
    if (!enabled) return;

    let maxScrollDepth = 0;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Debounce scroll tracking
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          trackEvent({
            userId: undefined,
            sessionId: getSessionId(),
            eventType: 'scroll',
            eventData: { scrollDepth: maxScrollDepth },
            page,
          });
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [page, enabled, trackEvent]);
};

// Helper function to get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}
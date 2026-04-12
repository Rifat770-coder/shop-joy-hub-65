// Advanced Analytics Types

export interface CustomerLifetimeValue {
  customerId: string;
  customerName: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  daysSinceFirstOrder: number;
  predictedLTV: number;
  ltv12Months: number;
  ltv24Months: number;
  customerSegment: string;
  riskScore: number; // 0-100, higher = more likely to churn
}

export interface SalesForecast {
  period: string;
  date: string;
  predictedRevenue: number;
  predictedOrders: number;
  confidence: number;
  actualRevenue?: number;
  actualOrders?: number;
  variance?: number;
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  name: string;
  impact: number;
  description: string;
}

export interface InventoryAnalysis {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  averageDailySales: number;
  daysOfInventory: number;
  turnoverRate: number;
  reorderPoint: number;
  recommendedOrderQuantity: number;
  stockoutRisk: 'low' | 'medium' | 'high';
  overstock: boolean;
  seasonalityFactor: number;
  profitMargin: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  averageLTV: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  churnRate: number;
  profitability: number;
  color: string;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  variants: ABTestVariant[];
  results?: ABTestResults;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficPercentage: number;
}

export interface ABTestResults {
  totalParticipants: number;
  variantResults: VariantResult[];
  statisticalSignificance: number;
  winner?: string;
  confidence: number;
}

export interface VariantResult {
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  improvement: number;
}

export interface UserBehaviorEvent {
  id: string;
  userId?: string;
  sessionId: string;
  eventType: string;
  eventData: Record<string, any>;
  page: string;
  timestamp: string;
  coordinates?: { x: number; y: number };
}

export interface HeatmapData {
  page: string;
  element: string;
  clicks: number;
  hovers: number;
  scrollDepth: number;
  coordinates: Array<{
    x: number;
    y: number;
    intensity: number;
  }>;
}

export interface CohortAnalysis {
  cohortMonth: string;
  customerCount: number;
  retentionRates: number[];
  revenueRates: number[];
}

export interface RFMAnalysis {
  customerId: string;
  recency: number;
  frequency: number;
  monetary: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmSegment: string;
}
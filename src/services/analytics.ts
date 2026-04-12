/**
 * Advanced Analytics Service
 * Handles customer lifetime value, sales forecasting, inventory analysis, and more
 */

import { databases, DATABASE_ID, COLLECTIONS, isAppwriteConfigured } from '@/integrations/appwrite/config';
import { Query } from 'appwrite';
import {
  CustomerLifetimeValue,
  SalesForecast,
  InventoryAnalysis,
  CustomerSegment,
  CohortAnalysis,
  RFMAnalysis,
  UserBehaviorEvent,
  HeatmapData
} from '@/types/analytics';

class AnalyticsService {
  private lastEventAt = 0;
  private backoffUntil = 0;
  private readonly minEventIntervalMs = 800;
  private readonly backoffMs = 60_000;
  private collectionMissing = false;

  private serializeValue(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.stringify(value);
  }

  private parseValue<T>(value: unknown, fallback: T): T {
    if (typeof value !== 'string') {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  /**
   * Calculate Customer Lifetime Value
   */
  async calculateCustomerLTV(): Promise<CustomerLifetimeValue[]> {
    try {
      // Get all orders and profiles
      const [ordersResponse, profilesResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
          Query.orderDesc('$createdAt'),
          Query.limit(1000)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
          Query.limit(1000)
        ])
      ]);

      const orders = ordersResponse.documents;
      const profiles = profilesResponse.documents;

      // Group orders by customer
      const customerOrders = new Map();
      orders.forEach(order => {
        const customerId = order.userId;
        if (!customerOrders.has(customerId)) {
          customerOrders.set(customerId, []);
        }
        customerOrders.get(customerId).push(order);
      });

      // Calculate LTV for each customer
      const ltvData: CustomerLifetimeValue[] = [];

      for (const [customerId, customerOrderList] of customerOrders) {
        const profile = profiles.find(p => p.userId === customerId);
        if (!profile) continue;

        const totalSpent = customerOrderList.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        const totalOrders = customerOrderList.length;
        const averageOrderValue = totalSpent / totalOrders;

        const orderDates = customerOrderList.map((order: any) => new Date(order.$createdAt));
        const firstOrderDate = new Date(Math.min(...orderDates.map(d => d.getTime())));
        const lastOrderDate = new Date(Math.max(...orderDates.map(d => d.getTime())));
        const daysSinceFirstOrder = Math.floor((Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24));

        // Simple LTV prediction based on historical data
        const purchaseFrequency = totalOrders / Math.max(daysSinceFirstOrder / 30, 1); // orders per month
        const predictedLTV = averageOrderValue * purchaseFrequency * 24; // 24 months projection

        // Calculate risk score (days since last order)
        const daysSinceLastOrder = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        const riskScore = Math.min(daysSinceLastOrder * 2, 100);

        ltvData.push({
          customerId,
          customerName: profile.fullName || 'Unknown',
          email: profile.email || '',
          totalOrders,
          totalSpent,
          averageOrderValue,
          firstOrderDate: firstOrderDate.toISOString(),
          lastOrderDate: lastOrderDate.toISOString(),
          daysSinceFirstOrder,
          predictedLTV,
          ltv12Months: predictedLTV * 0.5,
          ltv24Months: predictedLTV,
          customerSegment: this.getCustomerSegment(totalSpent, totalOrders, daysSinceLastOrder),
          riskScore
        });
      }

      return ltvData.sort((a, b) => b.predictedLTV - a.predictedLTV);
    } catch (error) {
      console.error('Error calculating customer LTV:', error);
      return [];
    }
  }

  /**
   * Generate Sales Forecast
   */
  async generateSalesForecast(days: number = 30): Promise<SalesForecast[]> {
    try {
      // Get historical sales data
      const ordersResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
        Query.orderDesc('$createdAt'),
        Query.limit(1000)
      ]);

      const orders = ordersResponse.documents;
      
      // Group orders by date
      const dailySales = new Map();
      orders.forEach(order => {
        const date = new Date(order.$createdAt).toISOString().split('T')[0];
        if (!dailySales.has(date)) {
          dailySales.set(date, { revenue: 0, orders: 0 });
        }
        const dayData = dailySales.get(date);
        dayData.revenue += order.total || 0;
        dayData.orders += 1;
      });

      // Calculate moving averages for prediction
      const salesArray = Array.from(dailySales.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30); // Last 30 days

      const avgDailyRevenue = salesArray.reduce((sum, [, data]) => sum + data.revenue, 0) / salesArray.length;
      const avgDailyOrders = salesArray.reduce((sum, [, data]) => sum + data.orders, 0) / salesArray.length;

      // Generate forecast
      const forecast: SalesForecast[] = [];
      const today = new Date();

      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        // Simple trend-based prediction with some randomness
        const trendFactor = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
        const seasonalFactor = this.getSeasonalFactor(forecastDate);
        
        forecast.push({
          period: 'daily',
          date: forecastDate.toISOString().split('T')[0],
          predictedRevenue: avgDailyRevenue * trendFactor * seasonalFactor,
          predictedOrders: Math.round(avgDailyOrders * trendFactor * seasonalFactor),
          confidence: Math.max(0.6 - (i * 0.01), 0.3), // Decreasing confidence over time
          factors: [
            { name: 'Historical Trend', impact: trendFactor - 1, description: 'Based on recent sales patterns' },
            { name: 'Seasonal', impact: seasonalFactor - 1, description: 'Seasonal adjustment factor' }
          ]
        });
      }

      return forecast;
    } catch (error) {
      console.error('Error generating sales forecast:', error);
      return [];
    }
  }

  /**
   * Analyze Inventory Performance
   */
  async analyzeInventory(): Promise<InventoryAnalysis[]> {
    try {
      // Get products and recent orders
      const [productsResponse, ordersResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.limit(1000)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
          Query.orderDesc('$createdAt'),
          Query.limit(500)
        ])
      ]);

      const products = productsResponse.documents;
      const orders = ordersResponse.documents;

      // Calculate sales velocity for each product
      const productSales = new Map();
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach((item: any) => {
            const productId = item.product.id;
            if (!productSales.has(productId)) {
              productSales.set(productId, { totalSold: 0, salesDays: new Set() });
            }
            const salesData = productSales.get(productId);
            salesData.totalSold += item.quantity;
            salesData.salesDays.add(new Date(order.$createdAt).toISOString().split('T')[0]);
          });
        }
      });

      // Analyze each product
      const inventoryAnalysis: InventoryAnalysis[] = products.map(product => {
        const salesData = productSales.get(product.$id) || { totalSold: 0, salesDays: new Set() };
        const daysSelling = Math.max(salesData.salesDays.size, 1);
        const averageDailySales = salesData.totalSold / daysSelling;
        const currentStock = product.stock || 0;
        const daysOfInventory = averageDailySales > 0 ? currentStock / averageDailySales : 999;
        const turnoverRate = averageDailySales * 365 / Math.max(currentStock, 1);

        // Calculate reorder point (assuming 7-day lead time)
        const reorderPoint = Math.ceil(averageDailySales * 7 * 1.5); // 50% safety stock

        // Determine stock risk
        let stockoutRisk: 'low' | 'medium' | 'high' = 'low';
        if (daysOfInventory < 7) stockoutRisk = 'high';
        else if (daysOfInventory < 14) stockoutRisk = 'medium';

        return {
          productId: product.$id,
          productName: product.name,
          category: product.category,
          currentStock,
          averageDailySales,
          daysOfInventory,
          turnoverRate,
          reorderPoint,
          recommendedOrderQuantity: Math.max(reorderPoint * 2, 10),
          stockoutRisk,
          overstock: daysOfInventory > 90,
          seasonalityFactor: this.getProductSeasonality(product.category),
          profitMargin: 0.3 // Default 30% margin
        };
      });

      return inventoryAnalysis.sort((a, b) => {
        if (a.stockoutRisk === 'high' && b.stockoutRisk !== 'high') return -1;
        if (b.stockoutRisk === 'high' && a.stockoutRisk !== 'high') return 1;
        return a.daysOfInventory - b.daysOfInventory;
      });
    } catch (error) {
      console.error('Error analyzing inventory:', error);
      return [];
    }
  }

  /**
   * Perform Customer Segmentation
   */
  async performCustomerSegmentation(): Promise<CustomerSegment[]> {
    const ltvData = await this.calculateCustomerLTV();
    
    const segments: CustomerSegment[] = [
      {
        id: 'champions',
        name: 'Champions',
        description: 'High value, frequent buyers',
        customerCount: 0,
        averageLTV: 0,
        averageOrderValue: 0,
        purchaseFrequency: 0,
        churnRate: 0,
        profitability: 0,
        color: '#10B981'
      },
      {
        id: 'loyal',
        name: 'Loyal Customers',
        description: 'Regular buyers with good value',
        customerCount: 0,
        averageLTV: 0,
        averageOrderValue: 0,
        purchaseFrequency: 0,
        churnRate: 0,
        profitability: 0,
        color: '#3B82F6'
      },
      {
        id: 'potential',
        name: 'Potential Loyalists',
        description: 'Recent customers with potential',
        customerCount: 0,
        averageLTV: 0,
        averageOrderValue: 0,
        purchaseFrequency: 0,
        churnRate: 0,
        profitability: 0,
        color: '#F59E0B'
      },
      {
        id: 'at-risk',
        name: 'At Risk',
        description: 'Customers who might churn',
        customerCount: 0,
        averageLTV: 0,
        averageOrderValue: 0,
        purchaseFrequency: 0,
        churnRate: 0,
        profitability: 0,
        color: '#EF4444'
      }
    ];

    // Categorize customers into segments
    const segmentMap = new Map();
    ltvData.forEach(customer => {
      const segment = customer.customerSegment;
      if (!segmentMap.has(segment)) {
        segmentMap.set(segment, []);
      }
      segmentMap.get(segment).push(customer);
    });

    // Calculate segment metrics
    segments.forEach(segment => {
      const customers = segmentMap.get(segment.id) || [];
      segment.customerCount = customers.length;
      
      if (customers.length > 0) {
        segment.averageLTV = customers.reduce((sum, c) => sum + c.predictedLTV, 0) / customers.length;
        segment.averageOrderValue = customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length;
        segment.purchaseFrequency = customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length;
        segment.churnRate = customers.filter(c => c.riskScore > 50).length / customers.length;
        segment.profitability = segment.averageLTV * 0.3; // Assume 30% margin
      }
    });

    return segments.filter(s => s.customerCount > 0);
  }

  /**
   * Generate Cohort Analysis
   */
  async generateCohortAnalysis(): Promise<CohortAnalysis[]> {
    try {
      const ordersResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
        Query.orderDesc('$createdAt'),
        Query.limit(1000)
      ]);

      const orders = ordersResponse.documents;
      
      // Group customers by first purchase month
      const customerCohorts = new Map();
      const customerFirstPurchase = new Map();

      orders.forEach(order => {
        const customerId = order.userId;
        const orderDate = new Date(order.$createdAt);
        
        if (!customerFirstPurchase.has(customerId) || 
            orderDate < customerFirstPurchase.get(customerId)) {
          customerFirstPurchase.set(customerId, orderDate);
        }
      });

      // Create cohorts
      customerFirstPurchase.forEach((firstPurchase, customerId) => {
        const cohortMonth = `${firstPurchase.getFullYear()}-${String(firstPurchase.getMonth() + 1).padStart(2, '0')}`;
        if (!customerCohorts.has(cohortMonth)) {
          customerCohorts.set(cohortMonth, new Set());
        }
        customerCohorts.get(cohortMonth).add(customerId);
      });

      // Calculate retention rates
      const cohortAnalysis: CohortAnalysis[] = [];
      
      for (const [cohortMonth, customers] of customerCohorts) {
        const cohortSize = customers.size;
        const retentionRates: number[] = [];
        const revenueRates: number[] = [];

        // Calculate retention for each month after cohort month
        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
          const targetDate = new Date(cohortMonth + '-01');
          targetDate.setMonth(targetDate.getMonth() + monthOffset);
          
          const activeCustomers = new Set();
          let monthRevenue = 0;

          orders.forEach(order => {
            const orderDate = new Date(order.$createdAt);
            const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (orderMonth === targetMonth && customers.has(order.userId)) {
              activeCustomers.add(order.userId);
              monthRevenue += order.total || 0;
            }
          });

          retentionRates.push(activeCustomers.size / cohortSize);
          revenueRates.push(monthRevenue / cohortSize);
        }

        cohortAnalysis.push({
          cohortMonth,
          customerCount: cohortSize,
          retentionRates,
          revenueRates
        });
      }

      return cohortAnalysis.sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth));
    } catch (error) {
      console.error('Error generating cohort analysis:', error);
      return [];
    }
  }

  /**
   * Track User Behavior Event
   */
  async trackUserBehavior(event: Omit<UserBehaviorEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      if (!isAppwriteConfigured) {
        return;
      }

      const now = Date.now();
      if (this.collectionMissing) {
        return;
      }
      if (now < this.backoffUntil) {
        return;
      }

      if (now - this.lastEventAt < this.minEventIntervalMs) {
        return;
      }

      this.lastEventAt = now;

      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_BEHAVIOR_EVENTS,
        crypto.randomUUID(),
        {
          userId: event.userId,
          sessionId: event.sessionId,
          eventType: event.eventType,
          eventData: this.serializeValue(event.eventData),
          page: event.page,
          coordinates: this.serializeValue(event.coordinates),
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      const errorCode = typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: number }).code
        : undefined;

      if (errorCode === 404) {
        this.collectionMissing = true;
        return;
      }

      if (errorCode === 429) {
        this.backoffUntil = Date.now() + this.backoffMs;
        return;
      }

      console.error('Error tracking user behavior:', error);
    }
  }

  /**
   * Generate Heatmap Data
   */
  async generateHeatmapData(page: string, days: number = 7): Promise<HeatmapData[]> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_BEHAVIOR_EVENTS, [
        Query.equal('page', page),
        Query.greaterThan('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()),
        Query.limit(10000)
      ]);

      const events = response.documents;
      const heatmapData = new Map();

      events.forEach(event => {
        const eventData = this.parseValue<{ element?: string }>(event.eventData, {});
        const coordinates = this.parseValue<{ x: number; y: number }[]>(event.coordinates, []);
        const element = eventData.element || 'unknown';
        const key = `${page}-${element}`;
        
        if (!heatmapData.has(key)) {
          heatmapData.set(key, {
            page,
            element,
            clicks: 0,
            hovers: 0,
            scrollDepth: 0,
            coordinates: []
          });
        }

        const data = heatmapData.get(key);
        
        if (event.eventType === 'click') {
          data.clicks++;
          coordinates.forEach((point) => {
            data.coordinates.push({
              x: point.x,
              y: point.y,
              intensity: 1
            });
          });
        } else if (event.eventType === 'hover') {
          data.hovers++;
        } else if (event.eventType === 'scroll') {
          const scrollDepth = this.parseValue<{ scrollDepth?: number }>(event.eventData, {}).scrollDepth || 0;
          data.scrollDepth = Math.max(data.scrollDepth, scrollDepth);
        }
      });

      return Array.from(heatmapData.values());
    } catch (error) {
      console.error('Error generating heatmap data:', error);
      return [];
    }
  }

  // Helper methods
  private getCustomerSegment(totalSpent: number, totalOrders: number, daysSinceLastOrder: number): string {
    if (totalSpent > 1000 && totalOrders > 5 && daysSinceLastOrder < 30) return 'champions';
    if (totalSpent > 500 && totalOrders > 3 && daysSinceLastOrder < 60) return 'loyal';
    if (totalOrders > 1 && daysSinceLastOrder < 90) return 'potential';
    return 'at-risk';
  }

  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Simple seasonal adjustment (higher in Nov-Dec for holidays)
    if (month === 10 || month === 11) return 1.2; // November, December
    if (month === 0) return 1.1; // January
    return 1.0;
  }

  private getProductSeasonality(category: string): number {
    const seasonalCategories: Record<string, number> = {
      'Fashion': 1.2,
      'Electronics': 1.1,
      'Home & Garden': 0.9,
      'Sports': 1.0,
      'Books': 0.8,
      'Beauty': 1.1,
      'Toys': 1.3,
      'Automotive': 0.9
    };
    return seasonalCategories[category] || 1.0;
  }
}

export const analyticsService = new AnalyticsService();
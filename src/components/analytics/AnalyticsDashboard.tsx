import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Package,
  Target,
  Activity,
  BarChart3,
  PieChart,
  MousePointer
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import ABTestManager from './ABTestManager';
import HeatmapVisualization from './HeatmapVisualization';
import {
  useCustomerLTV,
  useSalesForecast,
  useInventoryAnalysis,
  useCustomerSegmentation,
  useHeatmapData
} from '@/hooks/useAnalytics';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedHeatmapPage, setSelectedHeatmapPage] = useState('/');

  // Analytics data
  const { data: ltvData, isLoading: ltvLoading } = useCustomerLTV();
  const { data: forecastData, isLoading: forecastLoading } = useSalesForecast(30);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryAnalysis();
  const { data: segmentData, isLoading: segmentLoading } = useCustomerSegmentation();
  const { data: heatmapData } = useHeatmapData(selectedHeatmapPage, 7);

  // Calculate key metrics
  const totalCustomers = ltvData?.length || 0;
  const averageLTV = ltvData?.reduce((sum, customer) => sum + customer.predictedLTV, 0) / totalCustomers || 0;
  const highValueCustomers = ltvData?.filter(customer => customer.predictedLTV > 1000).length || 0;
  const atRiskCustomers = ltvData?.filter(customer => customer.riskScore > 70).length || 0;

  const predictedRevenue = forecastData?.reduce((sum, day) => sum + day.predictedRevenue, 0) || 0;
  const lowStockItems = inventoryData?.filter(item => item.stockoutRisk === 'high').length || 0;

  // Sample A/B test data
  const [abTests] = useState([
    {
      id: '1',
      name: 'Homepage Hero Button Color',
      description: 'Testing blue vs green call-to-action button',
      status: 'running' as const,
      startDate: '2024-01-15T00:00:00Z',
      variants: [
        { id: 'control', name: 'Blue Button', description: 'Original blue CTA', isControl: true, trafficPercentage: 50 },
        { id: 'variant-a', name: 'Green Button', description: 'New green CTA', isControl: false, trafficPercentage: 50 }
      ],
      results: {
        totalParticipants: 1250,
        variantResults: [
          { variantId: 'control', participants: 625, conversions: 31, conversionRate: 4.96, revenue: 1550, improvement: 0 },
          { variantId: 'variant-a', participants: 625, conversions: 38, conversionRate: 6.08, revenue: 1900, improvement: 22.6 }
        ],
        statisticalSignificance: 0.85,
        confidence: 0.95,
        winner: 'variant-a'
      }
    }
  ]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageLTV.toFixed(0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Value Customers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highValueCustomers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              LTV > $1,000
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">At Risk Customers</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{atRiskCustomers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              High churn probability
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="sales">Sales Forecast</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="experiments">A/B Tests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                {segmentLoading ? (
                  <div className="h-64 flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={segmentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="customerCount"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {segmentData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>30-Day Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {forecastLoading ? (
                  <div className="h-64 flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={forecastData?.slice(0, 30)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [`$${value.toFixed(0)}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predictedRevenue" 
                        stroke="#3B82F6" 
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Revenue Growth</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Predicted 15% increase in next 30 days based on current trends
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Customer Retention</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Champions segment shows 85% retention rate over 6 months
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Inventory Alert</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lowStockItems} products need immediate reordering
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {segmentData?.map((segment) => (
              <Card key={segment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    {segment.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold">{segment.customerCount}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avg LTV:</span>
                      <span className="font-medium">${segment.averageLTV.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Order:</span>
                      <span className="font-medium">${segment.averageOrderValue.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Churn Rate:</span>
                      <span className="font-medium">{(segment.churnRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sales Forecast Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecast Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedRevenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedOrders" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <HeatmapVisualization 
            data={heatmapData || []}
            page={selectedHeatmapPage}
            onPageChange={setSelectedHeatmapPage}
          />
        </TabsContent>

        {/* A/B Tests Tab */}
        <TabsContent value="experiments" className="space-y-4">
          <ABTestManager 
            experiments={abTests}
            onCreateExperiment={(experiment) => {
              console.log('Creating experiment:', experiment);
            }}
            onUpdateExperiment={(id, updates) => {
              console.log('Updating experiment:', id, updates);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
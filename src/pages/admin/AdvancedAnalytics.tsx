import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Target, 
  BarChart3, 
  PieChart, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Eye,
  MousePointer
} from 'lucide-react';
import {
  useCustomerLTV,
  useSalesForecast,
  useInventoryAnalysis,
  useCustomerSegmentation,
  useCohortAnalysis,
  useHeatmapData
} from '@/hooks/useAnalytics';
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
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdvancedAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [forecastDays, setForecastDays] = useState(30);

  // Analytics data hooks
  const { data: ltvData, isLoading: ltvLoading } = useCustomerLTV();
  const { data: forecastData, isLoading: forecastLoading } = useSalesForecast(forecastDays);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryAnalysis();
  const { data: segmentData, isLoading: segmentLoading } = useCustomerSegmentation();
  const { data: cohortData, isLoading: cohortLoading } = useCohortAnalysis();
  const { data: heatmapData } = useHeatmapData('/products', 7);

  // Overview metrics
  const totalCustomers = ltvData?.length || 0;
  const averageLTV = ltvData?.reduce((sum, customer) => sum + customer.predictedLTV, 0) / totalCustomers || 0;
  const highRiskCustomers = ltvData?.filter(customer => customer.riskScore > 70).length || 0;
  const lowStockProducts = inventoryData?.filter(product => product.stockoutRisk === 'high').length || 0;

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep insights into customer behavior, sales forecasting, and business intelligence
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active customer base</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averageLTV.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Customer lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">At Risk Customers</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{highRiskCustomers}</div>
              <p className="text-xs text-muted-foreground">High churn risk</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockProducts}</div>
              <p className="text-xs text-muted-foreground">Need reordering</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ltv">Customer LTV</TabsTrigger>
            <TabsTrigger value="forecast">Sales Forecast</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Customer Segments Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  {segmentLoading ? (
                    <div className="h-64 flex items-center justify-center">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
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

              {/* Sales Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>30-Day Sales Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  {forecastLoading ? (
                    <div className="h-64 flex items-center justify-center">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={forecastData?.slice(0, 30)}>
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
                        <Line 
                          type="monotone" 
                          dataKey="predictedRevenue" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Customers by LTV */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers by Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ltvData?.slice(0, 10).map((customer, index) => (
                    <div key={customer.customerId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.customerName}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${customer.predictedLTV.toFixed(0)}</p>
                        <Badge variant={customer.riskScore > 50 ? 'destructive' : 'secondary'}>
                          {customer.customerSegment}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer LTV Tab */}
          <TabsContent value="ltv" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed breakdown of customer value and churn risk
                </p>
              </CardHeader>
              <CardContent>
                {ltvLoading ? (
                  <div className="h-64 flex items-center justify-center">Loading LTV data...</div>
                ) : (
                  <div className="space-y-4">
                    {ltvData?.map((customer) => (
                      <div key={customer.customerId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{customer.customerName}</h4>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          </div>
                          <Badge variant={customer.riskScore > 70 ? 'destructive' : customer.riskScore > 40 ? 'secondary' : 'default'}>
                            Risk: {customer.riskScore}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Orders</p>
                            <p className="font-medium">{customer.totalOrders}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Spent</p>
                            <p className="font-medium">${customer.totalSpent.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Order Value</p>
                            <p className="font-medium">${customer.averageOrderValue.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Predicted LTV</p>
                            <p className="font-medium text-green-600">${customer.predictedLTV.toFixed(0)}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Churn Risk</span>
                            <span>{customer.riskScore}%</span>
                          </div>
                          <Progress value={customer.riskScore} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <div className="flex gap-4 mb-6">
              <Button 
                variant={forecastDays === 7 ? 'default' : 'outline'}
                onClick={() => setForecastDays(7)}
              >
                7 Days
              </Button>
              <Button 
                variant={forecastDays === 30 ? 'default' : 'outline'}
                onClick={() => setForecastDays(30)}
              >
                30 Days
              </Button>
              <Button 
                variant={forecastDays === 90 ? 'default' : 'outline'}
                onClick={() => setForecastDays(90)}
              >
                90 Days
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Forecast - {forecastDays} Days</CardTitle>
              </CardHeader>
              <CardContent>
                {forecastLoading ? (
                  <div className="h-96 flex items-center justify-center">Loading forecast...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number, name: string) => [
                          name === 'predictedRevenue' ? `$${value.toFixed(0)}` : value.toFixed(0),
                          name === 'predictedRevenue' ? 'Revenue' : 'Orders'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predictedRevenue" 
                        stackId="1"
                        stroke="#3B82F6" 
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Forecast Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Forecast Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecastData?.[0]?.factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{factor.name}</p>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                      <Badge variant={factor.impact > 0 ? 'default' : 'secondary'}>
                        {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Stock levels, turnover rates, and reorder recommendations
                </p>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="h-64 flex items-center justify-center">Loading inventory data...</div>
                ) : (
                  <div className="space-y-4">
                    {inventoryData?.map((product) => (
                      <div key={product.productId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{product.productName}</h4>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                          <Badge 
                            variant={
                              product.stockoutRisk === 'high' ? 'destructive' : 
                              product.stockoutRisk === 'medium' ? 'secondary' : 'default'
                            }
                          >
                            {product.stockoutRisk} risk
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current Stock</p>
                            <p className="font-medium">{product.currentStock}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Daily Sales</p>
                            <p className="font-medium">{product.averageDailySales.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days of Inventory</p>
                            <p className="font-medium">{product.daysOfInventory.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Turnover Rate</p>
                            <p className="font-medium">{product.turnoverRate.toFixed(1)}x</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reorder Point</p>
                            <p className="font-medium text-orange-600">{product.reorderPoint}</p>
                          </div>
                        </div>

                        {product.stockoutRisk === 'high' && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Recommend ordering {product.recommendedOrderQuantity} units immediately
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Segments Tab */}
          <TabsContent value="segments" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {segmentData?.map((segment) => (
                <Card key={segment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: segment.color }}
                      />
                      {segment.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{segment.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customers</p>
                        <p className="text-2xl font-bold">{segment.customerCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg LTV</p>
                        <p className="text-2xl font-bold">${segment.averageLTV.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Order Value</p>
                        <p className="font-medium">${segment.averageOrderValue.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Churn Rate</p>
                        <p className="font-medium">{(segment.churnRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Purchase Frequency</span>
                        <span>{segment.purchaseFrequency.toFixed(1)} orders</span>
                      </div>
                      <Progress value={segment.purchaseFrequency * 10} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Cohort Analysis Tab */}
          <TabsContent value="cohorts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customer retention rates by acquisition month
                </p>
              </CardHeader>
              <CardContent>
                {cohortLoading ? (
                  <div className="h-64 flex items-center justify-center">Loading cohort data...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left p-2">Cohort</th>
                          <th className="text-left p-2">Size</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} className="text-center p-2">M{i}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cohortData?.map((cohort) => (
                          <tr key={cohort.cohortMonth} className="border-t">
                            <td className="p-2 font-medium">{cohort.cohortMonth}</td>
                            <td className="p-2">{cohort.customerCount}</td>
                            {cohort.retentionRates.map((rate, index) => (
                              <td 
                                key={index} 
                                className="p-2 text-center"
                                style={{
                                  backgroundColor: `rgba(59, 130, 246, ${rate})`,
                                  color: rate > 0.5 ? 'white' : 'black'
                                }}
                              >
                                {(rate * 100).toFixed(0)}%
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdvancedAnalytics;
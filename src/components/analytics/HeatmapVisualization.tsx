import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MousePointer, Eye, Activity, BarChart3 } from 'lucide-react';
import { HeatmapData } from '@/types/analytics';

interface HeatmapVisualizationProps {
  data: HeatmapData[];
  page: string;
  onPageChange?: (page: string) => void;
}

export const HeatmapVisualization: React.FC<HeatmapVisualizationProps> = ({
  data,
  page,
  onPageChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pages = [
    { value: '/', label: 'Homepage' },
    { value: '/products', label: 'Products' },
    { value: '/categories', label: 'Categories' },
    { value: '/cart', label: 'Shopping Cart' },
    { value: '/checkout', label: 'Checkout' }
  ];

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create heatmap visualization
    data.forEach(heatmapItem => {
      heatmapItem.coordinates.forEach(coord => {
        const x = (coord.x / 100) * canvas.width;
        const y = (coord.y / 100) * canvas.height;
        const intensity = Math.min(coord.intensity / 10, 1); // Normalize intensity

        // Create gradient for heat point
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
        gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${intensity * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, [data]);

  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
  const totalHovers = data.reduce((sum, item) => sum + item.hovers, 0);
  const avgScrollDepth = data.length > 0 
    ? data.reduce((sum, item) => sum + item.scrollDepth, 0) / data.length 
    : 0;

  const topElements = data
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Behavior Heatmap</h2>
          <p className="text-muted-foreground">Visual representation of user interactions</p>
        </div>
        
        <Select value={page} onValueChange={onPageChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select page" />
          </SelectTrigger>
          <SelectContent>
            {pages.map(p => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">User interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hovers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHovers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Hover events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Scroll Depth</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScrollDepth.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Page engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Elements Tracked</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">Interactive elements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Heatmap Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Click Heatmap - {pages.find(p => p.value === page)?.label}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Red areas indicate high user interaction
            </p>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-auto border rounded-lg bg-gray-50"
                style={{ maxHeight: '400px' }}
              />
              {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No heatmap data available</p>
                    <p className="text-sm text-muted-foreground">
                      User interactions will appear here once tracking begins
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Most Clicked Elements</CardTitle>
            <p className="text-sm text-muted-foreground">
              Elements with highest interaction
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topElements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interaction data yet
                </p>
              ) : (
                topElements.map((element, index) => (
                  <div key={element.element} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{element.element}</p>
                        <p className="text-xs text-muted-foreground">
                          {element.hovers} hovers
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {element.clicks} clicks
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Element Details Table */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Element Interaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Element</th>
                    <th className="text-center p-2">Clicks</th>
                    <th className="text-center p-2">Hovers</th>
                    <th className="text-center p-2">Scroll Depth</th>
                    <th className="text-center p-2">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((element, index) => {
                    const engagementScore = (element.clicks * 2 + element.hovers + element.scrollDepth / 10) / 3;
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{element.element}</td>
                        <td className="p-2 text-center">{element.clicks}</td>
                        <td className="p-2 text-center">{element.hovers}</td>
                        <td className="p-2 text-center">{element.scrollDepth.toFixed(0)}%</td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant={
                              engagementScore > 50 ? 'default' : 
                              engagementScore > 20 ? 'secondary' : 'outline'
                            }
                          >
                            {engagementScore.toFixed(0)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HeatmapVisualization;
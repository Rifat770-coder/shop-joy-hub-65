import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Clock, 
  Palette, 
  Save, 
  Eye, 
  Calendar,
  Percent,
  Target,
  Loader2
} from 'lucide-react';
import { useFlashSaleSettings, useUpdateFlashSale, useFlashSaleCountdown } from '@/hooks/useFlashSale';
import { FlashSaleSettings } from '@/types/flashSale';
import { toast } from '@/hooks/use-toast';

const backgroundOptions = [
  { value: 'from-orange-400 via-pink-400 to-purple-500', label: 'Orange to Purple', preview: 'bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500' },
  { value: 'from-red-500 via-pink-500 to-purple-600', label: 'Red to Purple', preview: 'bg-gradient-to-r from-red-500 via-pink-500 to-purple-600' },
  { value: 'from-blue-500 via-purple-500 to-pink-500', label: 'Blue to Pink', preview: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' },
  { value: 'from-green-400 via-blue-500 to-purple-600', label: 'Green to Purple', preview: 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600' },
  { value: 'from-yellow-400 via-red-500 to-pink-500', label: 'Yellow to Pink', preview: 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500' },
  { value: 'from-indigo-500 via-purple-500 to-pink-500', label: 'Indigo to Pink', preview: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' },
];

export const FlashSaleManager: React.FC = () => {
  const { data: settings, isLoading } = useFlashSaleSettings();
  const updateFlashSale = useUpdateFlashSale();
  const countdown = useFlashSaleCountdown(settings?.endDate || new Date().toISOString());

  const [formData, setFormData] = useState<Partial<FlashSaleSettings>>({
    isActive: false,
    title: 'Up to 70% Off',
    subtitle: 'Electronics, fashion & more. Limited stock available!',
    discountPercentage: 70,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    backgroundColor: 'from-orange-400 via-pink-400 to-purple-500',
    textColor: 'text-white',
    buttonText: 'Shop Now',
    targetUrl: '/deals',
    categories: [],
    products: [],
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        startDate: new Date(settings.startDate).toISOString().slice(0, 16),
        endDate: new Date(settings.endDate).toISOString().slice(0, 16),
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateFlashSale.mutateAsync({
        ...formData,
        startDate: new Date(formData.startDate!).toISOString(),
        endDate: new Date(formData.endDate!).toISOString(),
      });
    } catch (error) {
      console.error('Error updating flash sale:', error);
    }
  };

  const handleInputChange = (field: keyof FlashSaleSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCountdown = (num: number) => num.toString().padStart(2, '0');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Flash Sale Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status and Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="text-base font-medium">
                    Flash Sale Status
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Up to 70% Off"
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    placeholder="Electronics, fashion & more. Limited stock available!"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="discountPercentage" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Discount Percentage
                  </Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.discountPercentage}
                    onChange={(e) => handleInputChange('discountPercentage', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date & Time
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    End Date & Time
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => handleInputChange('buttonText', e.target.value)}
                    placeholder="Shop Now"
                  />
                </div>

                <div>
                  <Label htmlFor="targetUrl" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Target URL
                  </Label>
                  <Input
                    id="targetUrl"
                    value={formData.targetUrl}
                    onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                    placeholder="/deals"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Design Settings */}
            <div>
              <Label className="flex items-center gap-2 text-base font-medium mb-4">
                <Palette className="h-4 w-4" />
                Design Settings
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backgroundOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                      formData.backgroundColor === option.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('backgroundColor', option.value)}
                  >
                    <div className={`h-20 rounded-t-lg ${option.preview}`} />
                    <div className="p-3">
                      <p className="text-sm font-medium">{option.label}</p>
                      {formData.backgroundColor === option.value && (
                        <Badge className="mt-1" size="sm">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Current Status */}
            {settings && formData.isActive && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Current Flash Sale Status
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCountdown(countdown.days)}
                    </div>
                    <div className="text-xs text-muted-foreground">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCountdown(countdown.hours)}
                    </div>
                    <div className="text-xs text-muted-foreground">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCountdown(countdown.minutes)}
                    </div>
                    <div className="text-xs text-muted-foreground">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCountdown(countdown.seconds)}
                    </div>
                    <div className="text-xs text-muted-foreground">Seconds</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={countdown.isExpired ? 'destructive' : 'default'}>
                    {countdown.isExpired ? 'Expired' : 'Active'}
                  </Badge>
                  <span className="text-muted-foreground">
                    {countdown.isExpired 
                      ? 'Flash sale has ended' 
                      : `${countdown.days * 24 + countdown.hours} hours remaining`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={updateFlashSale.isPending}
                className="flex items-center gap-2"
              >
                {updateFlashSale.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Flash Sale Settings
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => window.open('/', '_blank')}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
import { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search,
  ArrowUpDown,
  Plus,
  Minus,
  Bell,
  TrendingDown
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { products as initialProducts } from '@/data/products';

interface StockUpdate {
  productId: string;
  stock: number;
  lowStockThreshold: number;
  lastRestocked?: string;
}

const LOW_STOCK_THRESHOLD_DEFAULT = 10;

export default function AdminInventory() {
  const [stockUpdates, setStockUpdates] = useState<Record<string, StockUpdate>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('stock');
  const [selectedProduct, setSelectedProduct] = useState<typeof initialProducts[0] | null>(null);
  const [restockAmount, setRestockAmount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load stock updates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_stock_updates');
    if (saved) {
      setStockUpdates(JSON.parse(saved));
    }
  }, []);

  // Save stock updates to localStorage
  const saveStockUpdates = (updates: Record<string, StockUpdate>) => {
    setStockUpdates(updates);
    localStorage.setItem('admin_stock_updates', JSON.stringify(updates));
  };

  // Get current stock for a product
  const getProductStock = (productId: string, originalStock: number) => {
    return stockUpdates[productId]?.stock ?? originalStock;
  };

  // Get low stock threshold for a product
  const getLowStockThreshold = (productId: string) => {
    return stockUpdates[productId]?.lowStockThreshold ?? LOW_STOCK_THRESHOLD_DEFAULT;
  };

  // Products with current stock info
  const productsWithStock = useMemo(() => {
    return initialProducts.map((product) => ({
      ...product,
      currentStock: getProductStock(product.id, product.stock),
      threshold: getLowStockThreshold(product.id),
      lastRestocked: stockUpdates[product.id]?.lastRestocked,
    }));
  }, [stockUpdates]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...productsWithStock];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    switch (filterStatus) {
      case 'low':
        filtered = filtered.filter((p) => p.currentStock > 0 && p.currentStock <= p.threshold);
        break;
      case 'out':
        filtered = filtered.filter((p) => p.currentStock === 0);
        break;
      case 'ok':
        filtered = filtered.filter((p) => p.currentStock > p.threshold);
        break;
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stock':
        filtered.sort((a, b) => a.currentStock - b.currentStock);
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return filtered;
  }, [productsWithStock, searchQuery, filterStatus, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const lowStock = productsWithStock.filter((p) => p.currentStock > 0 && p.currentStock <= p.threshold);
    const outOfStock = productsWithStock.filter((p) => p.currentStock === 0);
    const totalValue = productsWithStock.reduce((sum, p) => sum + p.price * p.currentStock, 0);

    return {
      total: productsWithStock.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      healthy: productsWithStock.length - lowStock.length - outOfStock.length,
      totalValue,
    };
  }, [productsWithStock]);

  // Restock product
  const handleRestock = () => {
    if (!selectedProduct || restockAmount <= 0) return;

    const currentStock = getProductStock(selectedProduct.id, selectedProduct.stock);
    const newStock = currentStock + restockAmount;

    const updates = {
      ...stockUpdates,
      [selectedProduct.id]: {
        productId: selectedProduct.id,
        stock: newStock,
        lowStockThreshold: getLowStockThreshold(selectedProduct.id),
        lastRestocked: new Date().toISOString(),
      },
    };

    saveStockUpdates(updates);
    setDialogOpen(false);
    setRestockAmount(0);
    setSelectedProduct(null);

    toast({
      title: 'Stock updated',
      description: `Added ${restockAmount} units to ${selectedProduct.name}. New stock: ${newStock}`,
    });
  };

  // Update stock directly
  const updateStock = (productId: string, newStock: number) => {
    const product = initialProducts.find((p) => p.id === productId);
    if (!product) return;

    const updates = {
      ...stockUpdates,
      [productId]: {
        productId,
        stock: Math.max(0, newStock),
        lowStockThreshold: getLowStockThreshold(productId),
        lastRestocked: stockUpdates[productId]?.lastRestocked,
      },
    };

    saveStockUpdates(updates);
  };

  // Update threshold
  const updateThreshold = (productId: string, threshold: number) => {
    const currentStock = getProductStock(productId, initialProducts.find((p) => p.id === productId)?.stock || 0);

    const updates = {
      ...stockUpdates,
      [productId]: {
        productId,
        stock: currentStock,
        lowStockThreshold: Math.max(1, threshold),
        lastRestocked: stockUpdates[productId]?.lastRestocked,
      },
    };

    saveStockUpdates(updates);
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle };
    if (stock <= threshold) return { label: 'Low Stock', color: 'bg-warning/10 text-warning border-warning/30', icon: AlertTriangle };
    return { label: 'In Stock', color: 'bg-success/10 text-success border-success/30', icon: CheckCircle };
  };

  // Low stock alerts
  const lowStockAlerts = productsWithStock.filter(
    (p) => p.currentStock <= p.threshold
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Track stock levels and manage product inventory
          </p>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                  {lowStockAlerts.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowStockAlerts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.currentStock === 0 ? (
                          <span className="text-destructive">Out of stock</span>
                        ) : (
                          <span className="text-warning">Only {product.currentStock} left</span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setDialogOpen(true);
                      }}
                    >
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
              {lowStockAlerts.length > 6 && (
                <p className="text-sm text-muted-foreground mt-3">
                  And {lowStockAlerts.length - 6} more items need attention...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className={stats.outOfStock > 0 ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.outOfStock}</div>
            </CardContent>
          </Card>
          <Card className={stats.lowStock > 0 ? 'border-warning/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="ok">In Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stock">Stock Level</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.currentStock, product.threshold);
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStock(product.id, product.currentStock - 1)}
                            disabled={product.currentStock === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{product.currentStock}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStock(product.id, product.currentStock + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={product.threshold}
                          onChange={(e) => updateThreshold(product.id, parseInt(e.target.value) || 10)}
                          className="w-20 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ${(product.price * product.currentStock).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setDialogOpen(true);
                          }}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Restock Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restock Product</DialogTitle>
              <DialogDescription>
                Add inventory for {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current stock: {getProductStock(selectedProduct.id, selectedProduct.stock)} units
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="restock-amount">Units to Add</Label>
                  <Input
                    id="restock-amount"
                    type="number"
                    min="1"
                    value={restockAmount || ''}
                    onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                  />
                </div>
                {restockAmount > 0 && (
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-sm">
                      New stock level:{' '}
                      <span className="font-medium">
                        {getProductStock(selectedProduct.id, selectedProduct.stock) + restockAmount} units
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRestock} disabled={restockAmount <= 0}>
                Confirm Restock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

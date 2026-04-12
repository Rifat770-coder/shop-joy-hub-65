import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Tag, Percent, DollarSign, Calendar, Users } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { toast } from '@/hooks/use-toast';
import { Query } from 'appwrite';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface CouponForm {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minimumOrder: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const defaultForm: CouponForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minimumOrder: '0',
  maxUses: '',
  startsAt: new Date().toISOString().slice(0, 16),
  expiresAt: '',
  isActive: true,
};

const normalizeCoupon = (doc: Record<string, unknown>): Coupon => ({
  id: (doc.$id as string) || (doc.id as string),
  code: (doc.code as string) || '',
  description: (doc.description as string) || null,
  discountType: ((doc.discountType as string) || 'percentage') as 'percentage' | 'fixed',
  discountValue: Number(doc.discountValue || 0),
  minimumOrder: Number(doc.minimumOrder || 0),
  maxUses: doc.maxUses === null || doc.maxUses === undefined ? null : Number(doc.maxUses),
  usedCount: Number(doc.usedCount || 0),
  startsAt: (doc.startsAt as string) || null,
  expiresAt: (doc.expiresAt as string) || null,
  isActive: Boolean(doc.isActive),
});

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        []
      );

      const sortedCoupons = response.documents
        .map((doc) => normalizeCoupon(doc as unknown as Record<string, unknown>))
        .sort((a, b) => {
          const dateA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
          const dateB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
          return dateB - dateA;
        });
      setCoupons(sortedCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coupons.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        minimumOrder: coupon.minimumOrder.toString(),
        maxUses: coupon.maxUses?.toString() || '',
        startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '',
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setForm(defaultForm);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      toast({
        title: 'Missing code',
        description: 'Please enter a coupon code.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.discountValue || parseFloat(form.discountValue) <= 0) {
      toast({
        title: 'Invalid discount',
        description: 'Please enter a valid discount value.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const couponData = {
        code: form.code.toUpperCase().trim(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minimumOrder: parseFloat(form.minimumOrder) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive: form.isActive,
        usedCount: editingCoupon?.usedCount ?? 0,
      };

      if (editingCoupon) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.COUPONS,
          editingCoupon.id,
          couponData
        );

        toast({
          title: 'Coupon updated',
          description: 'The coupon has been updated successfully.',
        });
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.COUPONS,
          crypto.randomUUID(),
          couponData
        );

        toast({
          title: 'Coupon created',
          description: 'The coupon has been created successfully.',
        });
      }

      setDialogOpen(false);
      fetchCoupons();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save coupon.';
      console.error('Error saving coupon:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        coupon.id
      );

      toast({
        title: 'Coupon deleted',
        description: 'The coupon has been deleted successfully.',
      });

      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        coupon.id,
        { isActive: !coupon.isActive }
      );

      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to update coupon status.',
        variant: 'destructive',
      });
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { label: 'Inactive', variant: 'secondary' as const };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return { label: 'Scheduled', variant: 'outline' as const };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { label: 'Exhausted', variant: 'secondary' as const };
    }
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Coupons & Discounts</h1>
            <p className="text-muted-foreground mt-1">
              Manage promotional codes and special offers
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
                <DialogDescription>
                  {editingCoupon
                    ? 'Update the coupon details below.'
                    : 'Fill in the details to create a new coupon.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g., 20% off summer sale"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={form.discountType}
                      onValueChange={(v) => setForm({ ...form, discountType: v as 'percentage' | 'fixed' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Discount Value *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {form.discountType === 'percentage' ? '%' : '$'}
                      </span>
                      <Input
                        id="discountValue"
                        type="number"
                        value={form.discountValue}
                        onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                        className="pl-8"
                        placeholder="0"
                        min="0"
                        step={form.discountType === 'percentage' ? '1' : '0.01'}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumOrder">Minimum Order ($)</Label>
                    <Input
                      id="minimumOrder"
                      type="number"
                      value={form.minimumOrder}
                      onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Max Uses (empty = unlimited)</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startsAt">Start Date</Label>
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.length}</p>
                <p className="text-sm text-muted-foreground">Total Coupons</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Percent className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {coupons.filter((c) => getCouponStatus(c).label === 'Active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Coupons</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {coupons.filter((c) => getCouponStatus(c).label === 'Expired').length}
                </p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Uses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No coupons yet. Create your first coupon to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div>
                          <p className="font-mono font-semibold">{coupon.code}</p>
                          {coupon.description && (
                            <p className="text-xs text-muted-foreground">{coupon.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.discountType === 'percentage' ? (
                            <>
                              <Percent className="h-3 w-3" />
                              {coupon.discountValue}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3" />
                              {coupon.discountValue.toFixed(2)}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${coupon.minimumOrder.toFixed(2)}</TableCell>
                      <TableCell>
                        {coupon.usedCount}
                        {coupon.maxUses !== null && ` / ${coupon.maxUses}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.isActive}
                          onCheckedChange={() => handleToggleActive(coupon)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(coupon)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;

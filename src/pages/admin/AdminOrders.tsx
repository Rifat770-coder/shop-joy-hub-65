import { useState } from 'react';
import { Search, Eye, MoreHorizontal } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Order } from '@/types';

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    items: [],
    total: 299.99,
    status: 'delivered',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    shippingAddress: '123 Main St, New York, NY 10001',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'ORD-002',
    items: [],
    total: 149.50,
    status: 'processing',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    createdAt: '2024-01-14T14:20:00Z',
  },
  {
    id: 'ORD-003',
    items: [],
    total: 89.99,
    status: 'shipped',
    customerName: 'Bob Johnson',
    customerEmail: 'bob@example.com',
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
    createdAt: '2024-01-13T09:15:00Z',
  },
  {
    id: 'ORD-004',
    items: [],
    total: 459.00,
    status: 'pending',
    customerName: 'Alice Brown',
    customerEmail: 'alice@example.com',
    shippingAddress: '321 Elm St, Houston, TX 77001',
    createdAt: '2024-01-12T16:45:00Z',
  },
  {
    id: 'ORD-005',
    items: [],
    total: 199.99,
    status: 'delivered',
    customerName: 'Charlie Wilson',
    customerEmail: 'charlie@example.com',
    shippingAddress: '654 Maple Dr, Phoenix, AZ 85001',
    createdAt: '2024-01-11T11:00:00Z',
  },
];

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'delivered':
      return 'bg-success/10 text-success border-success/30';
    case 'processing':
      return 'bg-info/10 text-info border-info/30';
    case 'shipped':
      return 'bg-warning/10 text-warning border-warning/30';
    case 'pending':
      return 'bg-muted text-muted-foreground border-border';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast({
      title: 'Order updated',
      description: `Order ${orderId} status changed to ${newStatus}.`,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage customer orders
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(order.status)} border`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                        >
                          Mark as Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                        >
                          Mark as Shipped
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                        >
                          Mark as Delivered
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

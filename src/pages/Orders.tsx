import { useState } from 'react';
import { Search, Filter, Truck, Store, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/ordersApi';
import { formatCurrency, formatDateTime, truncateId, formatPhone } from '@/utils/formatters';
import { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Orders = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleRowClick = (item: Order) => {
    setSelectedOrder(item);
  };

  const { data, isLoading, isFetching, refetch } = useGetOrdersQuery({ 
    status: statusFilter === 'all' ? '' : statusFilter, 
    search, 
    page,
    limit: 20 
  });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus({ orderId, status: newStatus }).unwrap();
      toast.success('Order status updated');
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (order: Order) => (
        <span className="font-mono font-medium">{order?.order_number}</span>
      ),
    },
    {
      key: 'customer_phone',
      header: 'Customer',
      render: (order: Order) => formatPhone(order.customer_phone),
    },
    {
      key: 'fulfillment_type',
      header: 'Type',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          {order.fulfillment_type === 'delivery' ? (
            <Truck className="h-4 w-4 text-primary" />
          ) : order.fulfillment_type === 'takeaway' ? (
            <Store className="h-4 w-4 text-secondary" />
          ) : null}
          <span className="capitalize">{order.fulfillment_type || 'N/A'}</span>
        </div>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'location',
      header: 'Location',
      render: (order: Order) => {
        const location = order.fulfillment_type === 'takeaway'
          ? (order as any).pickup_outlet_name
          : (order as any).delivery_address || order.fulfillment_location;
        return (
          <span className="text-sm text-muted-foreground truncate max-w-[150px] block" title={location || ''}>
            {location || 'N/A'}
          </span>
        );
      },
      className: 'hidden lg:table-cell',
    },
    {
      key: 'scheduled_time',
      header: 'Pick/Delivery Time',
      render: (order: Order) => {
        const time = order.fulfillment_type === 'takeaway'
          ? (order as any).pickup_time
          : (order as any).delivery_time;
        return time ? formatDateTime(time) : 'N/A';
      }
    },
    {
      key: 'items',
      header: 'Items',
      render: (order: Order) => `${order.items.length} items`,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'total',
      header: 'Total',
      render: (order: Order) => (
        <span className="font-semibold">{formatCurrency(order.total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: Order) => <Badge variant={order.status}>{order.status}</Badge>,
    },
    {
      key: 'created_at',
      header: 'Created Time',
      render: (order: Order) => formatDateTime(order.created_at),
      className: 'hidden lg:table-cell',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Orders" 
        description="Manage and track all customer orders"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={data?.orders ?? []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        emptyMessage="No orders found"
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default Orders;
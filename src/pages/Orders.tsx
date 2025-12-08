import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/ui/FormModal';
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

  const { data, isLoading } = useGetOrdersQuery({ 
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
        <span className="font-mono font-medium">#{truncateId(order.id)}</span>
      ),
    },
    {
      key: 'customer_phone',
      header: 'Customer',
      render: (order: Order) => formatPhone(order.customer_phone),
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
      header: 'Date',
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | null)}>
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
      <FormModal
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder ? truncateId(selectedOrder.id) : ''}`}
        description={selectedOrder ? formatPhone(selectedOrder.customer_phone) : ''}
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Items */}
            <div>
              <h4 className="font-semibold mb-3">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.quantity * item.unit_price)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t border-border mt-4">
                <p className="font-semibold">Total</p>
                <p className="font-bold text-lg">{formatCurrency(selectedOrder.total)}</p>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <h4 className="font-semibold mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {(['preparing', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={status === 'cancelled' ? 'destructive' : status === 'completed' ? 'success' : 'warning'}
                    size="sm"
                    disabled={isUpdating || selectedOrder.status === status}
                    onClick={() => handleStatusChange(selectedOrder.id, status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default Orders;

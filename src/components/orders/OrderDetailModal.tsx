import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime, truncateId, formatPhone } from '@/utils/formatters';
import { MapPin, Clock, Truck, Store } from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange?: (orderId: string, status: OrderStatus) => Promise<void>;
  isUpdating?: boolean;
}

export const OrderDetailModal = ({ 
  order, 
  onClose, 
  onStatusChange,
  isUpdating = false 
}: OrderDetailModalProps) => {
  if (!order) return null;

  return (
    <FormModal
      open={!!order}
      onOpenChange={onClose}
      title={`Order #${truncateId(order.id)}`}
      description={formatPhone(order.customer_phone)}
    >
      <div className="space-y-6">
        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={order.status}>{order.status}</Badge>
          </div>
        </div>

        {/* Fulfillment Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            {order.fulfillment_type === 'delivery' ? (
              <Truck className="h-5 w-5 text-primary" />
            ) : (
              <Store className="h-5 w-5 text-secondary" />
            )}
            <span className="font-semibold capitalize">
              {order.fulfillment_type || 'N/A'}
            </span>
          </div>
          
          {order.fulfillment_datetime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(order.fulfillment_datetime)}</span>
            </div>
          )}
          
          {order.fulfillment_location && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{order.fulfillment_location}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <h4 className="font-semibold mb-3">Items</h4>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic mt-1">{item.notes}</p>
                  )}
                </div>
                <p className="font-semibold">{formatCurrency(item.quantity * item.unit_price)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4 border-t border-border mt-4">
            <p className="font-semibold">Total</p>
            <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
          </div>
        </div>

        {/* Status Update */}
        {onStatusChange && (
          <div>
            <h4 className="font-semibold mb-3">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {(['preparing', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'destructive' : status === 'completed' ? 'success' : 'warning'}
                  size="sm"
                  disabled={isUpdating || order.status === status}
                  onClick={() => onStatusChange(order.id, status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
};
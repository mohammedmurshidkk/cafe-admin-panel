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
      title={`Order #${order?.order_number}`}
      description={formatPhone(order.customer_phone)}
    >
      <div className="space-y-5">
        {/* Order Info Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
                <p className="font-medium">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
            <Badge variant={order.status} className="text-sm px-3 py-1">{order.status}</Badge>
          </div>
        </div>

        {/* Fulfillment Info Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.fulfillment_type === 'delivery' ? 'bg-blue-50' : 'bg-green-50'}`}>
              {order.fulfillment_type === 'delivery' ? (
                <Truck className="h-5 w-5 text-blue-600" />
              ) : (
                <Store className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Fulfillment</p>
              <p className="font-semibold capitalize">{order.fulfillment_type || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-2 pl-[52px]">
            {(order.pickup_time || order?.delivery_time) && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateTime(order.pickup_time || order?.delivery_time)}</span>
              </div>
            )}

            {(order.pickup_outlet_name || order?.delivery_address) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{order.pickup_outlet_name || order?.delivery_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Order Items</h4>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">{item.quantity}</span>
                    <span className="text-sm text-muted-foreground">× {formatCurrency(item.unit_price)}</span>
                    {(item as any).size_or_weight && (
                      <span className="text-xs text-muted-foreground">({(item as any).size_or_weight})</span>
                    )}
                  </div>
                  {/* Custom Text with Prompt */}
                  {((item as any).custom_text_prompt || (item as any).custom_text) && (
                    <div className="text-xs bg-amber-50 px-2 py-1.5 rounded mt-2 border border-amber-200">
                      {(item as any).custom_text_prompt && (
                        <p className="text-amber-700 font-medium">
                          Q: {(item as any).custom_text_prompt}
                        </p>
                      )}
                      {(item as any).custom_text && (
                        <p className="text-amber-600 mt-0.5">
                          A: "{(item as any).custom_text}"
                        </p>
                      )}
                    </div>
                  )}
                  {/* Addons */}
                  {(item as any).addons && (item as any).addons.length > 0 && (
                    <div className="mt-2 pl-2 border-l-2 border-gray-200 space-y-1">
                      {(item as any).addons.map((addon: any, addonIdx: number) => (
                        <div key={addonIdx} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>+ {addon.addon_name} × {addon.quantity}</span>
                          <span>{formatCurrency(addon.line_total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded mt-2 inline-block">{item.notes}</p>
                  )}
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(item.quantity * item.unit_price)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-gray-200">
            <p className="font-semibold text-gray-600">Total</p>
            <p className="font-bold text-xl text-primary">{formatCurrency(order.total)}</p>
          </div>
        </div>

        {/* Status Update Card */}
        {onStatusChange && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {(['preparing', 'completed', 'cancelled'] as OrderStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'destructive' : status === 'completed' ? 'success' : 'warning'}
                  size="sm"
                  className="flex-1 min-w-[100px]"
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
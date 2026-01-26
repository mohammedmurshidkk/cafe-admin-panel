import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, Truck, Store } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetBusinessProfileQuery } from '@/store/api/businessApi';
import {
  useLazyGetOrderPrefillQuery,
  useCreateManualOrderMutation,
  ManualOrderItem,
} from '@/store/api/ordersApi';
import { FulfillmentType } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ManualOrderModalProps {
  open: boolean;
  onClose: () => void;
  sessionId?: string; // If provided, will prefill from session
  customerPhone?: string; // For fresh orders from orders page
}

interface OrderItemForm extends ManualOrderItem {
  id: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const emptyItem = (): OrderItemForm => ({
  id: generateId(),
  name: '',
  quantity: 1,
  unit_price: 0,
  size_or_weight: '',
  notes: '',
});

export const ManualOrderModal = ({
  open,
  onClose,
  sessionId,
  customerPhone: initialPhone,
}: ManualOrderModalProps) => {
  const [items, setItems] = useState<OrderItemForm[]>([emptyItem()]);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || '');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [pickupOutletId, setPickupOutletId] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isPrefilling, setIsPrefilling] = useState(false);

  const { data: businessData } = useGetBusinessProfileQuery();
  const [getPrefill] = useLazyGetOrderPrefillQuery();
  const [createOrder, { isLoading: isCreating }] = useCreateManualOrderMutation();

  const outlets = businessData?.business?.outlets || [];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setItems([emptyItem()]);
      setCustomerPhone(initialPhone || '');
      setFulfillmentType('delivery');
      setDeliveryAddress('');
      setDeliveryFee(0);
      setDeliveryTime('');
      setPickupOutletId('');
      setPickupTime('');
    }
  }, [open, initialPhone]);

  // Prefill data from session if sessionId provided
  useEffect(() => {
    if (open && sessionId) {
      setIsPrefilling(true);
      getPrefill(sessionId)
        .unwrap()
        .then((result) => {
          const data = result.data;
          if (data.customerPhone) setCustomerPhone(data.customerPhone);
          if (data.items && data.items.length > 0) {
            setItems(data.items.map((item) => ({ ...item, id: generateId() })));
          }
          if (data.fulfillmentType) setFulfillmentType(data.fulfillmentType);
          if (data.deliveryAddress) setDeliveryAddress(data.deliveryAddress);
          if (data.deliveryTime) setDeliveryTime(data.deliveryTime);
          if (data.pickupTime) setPickupTime(data.pickupTime);
          if (data.pickupOutletId) setPickupOutletId(data.pickupOutletId);
        })
        .catch((err) => {
          console.error('Failed to prefill:', err);
          toast.error('Failed to load session data');
        })
        .finally(() => setIsPrefilling(false));
    }
  }, [open, sessionId, getPrefill]);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem()]);
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleItemChange = useCallback(
    (id: string, field: keyof ManualOrderItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const calculateTotal = useCallback(() => {
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    return itemsTotal + (fulfillmentType === 'delivery' ? deliveryFee : 0);
  }, [items, fulfillmentType, deliveryFee]);

  const handleSubmit = async () => {
    // Validation
    if (!customerPhone.trim()) {
      toast.error('Customer phone is required');
      return;
    }

    const validItems = items.filter((item) => item.name.trim() && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('At least one valid item is required');
      return;
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Delivery address is required');
      return;
    }

    if (fulfillmentType === 'takeaway' && !pickupOutletId) {
      toast.error('Please select a pickup outlet');
      return;
    }

    try {
      await createOrder({
        sessionId,
        customerPhone: customerPhone.trim(),
        items: validItems.map(({ id, ...item }) => item),
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        deliveryFee: fulfillmentType === 'delivery' ? deliveryFee : undefined,
        deliveryTime: fulfillmentType === 'delivery' && deliveryTime ? deliveryTime : undefined,
        pickupOutletId: fulfillmentType === 'takeaway' ? pickupOutletId : undefined,
        pickupTime: fulfillmentType === 'takeaway' && pickupTime ? pickupTime : undefined,
      }).unwrap();

      toast.success('Order created successfully');
      onClose();
    } catch (err) {
      console.error('Failed to create order:', err);
      toast.error('Failed to create order');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sessionId ? 'Complete Order' : 'Create Manual Order'}
          </DialogTitle>
        </DialogHeader>

        {isPrefilling ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading session data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="919876543210"
                disabled={!!sessionId}
              />
            </div>

            {/* Fulfillment Type */}
            <div className="space-y-2">
              <Label>Fulfillment Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={fulfillmentType === 'delivery' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFulfillmentType('delivery')}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Delivery
                </Button>
                <Button
                  type="button"
                  variant={fulfillmentType === 'takeaway' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFulfillmentType('takeaway')}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Takeaway
                </Button>
              </div>
            </div>

            {/* Delivery Fields */}
            {fulfillmentType === 'delivery' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryFee">Delivery Fee</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Delivery Time</Label>
                    <Input
                      id="deliveryTime"
                      type="datetime-local"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Takeaway Fields */}
            {fulfillmentType === 'takeaway' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="outlet">Pickup Outlet</Label>
                  <Select value={pickupOutletId} onValueChange={setPickupOutletId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets.map((outlet) => (
                        <SelectItem key={outlet.id} value={outlet.id}>
                          {outlet.outlet_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupTime">Pickup Time</Label>
                  <Input
                    id="pickupTime"
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg bg-card space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">
                        <Input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) =>
                            handleItemChange(item.id, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Input
                          placeholder="Size/Weight (e.g., 1kg)"
                          value={item.size_or_weight || ''}
                          onChange={(e) =>
                            handleItemChange(item.id, 'size_or_weight', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', Number(e.target.value))
                          }
                          min={1}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(item.id, 'unit_price', Number(e.target.value))
                          }
                          min={0}
                        />
                      </div>
                    </div>

                    <Textarea
                      placeholder="Item notes (optional)"
                      value={item.notes || ''}
                      onChange={(e) =>
                        handleItemChange(item.id, 'notes', e.target.value)
                      }
                      rows={2}
                      className="text-sm"
                    />

                    <div className="text-right text-sm text-muted-foreground">
                      Subtotal: ₹{(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || isPrefilling}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetAvailableDeliveryBoysQuery, useAssignOrderToDeliveryBoyMutation } from '@/store/api/deliveryBoysApi';
import { useUpdateOrderStatusMutation } from '@/store/api/ordersApi';
import { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

interface AssignDeliveryModalProps {
  order: Order | null;
  onClose: () => void;
}

export const AssignDeliveryModal = ({ order, onClose }: AssignDeliveryModalProps) => {
  const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'processing' | 'out_for_delivery'>('processing');

  const { data, isLoading: isLoadingDeliveryBoys } = useGetAvailableDeliveryBoysQuery(undefined, {
    skip: !order,
  });
  const [assignOrder, { isLoading: isAssigning }] = useAssignOrderToDeliveryBoyMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  const isSubmitting = isAssigning || isUpdatingStatus;

  const handleSubmit = async () => {
    if (!order || !selectedDeliveryBoyId) {
      toast.error('Please select a delivery boy');
      return;
    }

    try {
      // Assign order to delivery boy
      await assignOrder({
        orderId: order.id,
        delivery_boy_id: selectedDeliveryBoyId,
      }).unwrap();

      // Update order status if different from current
      if (order.status !== selectedStatus) {
        await updateStatus({
          orderId: order.id,
          status: selectedStatus,
        }).unwrap();
      }

      toast.success('Order assigned successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to assign order');
    }
  };

  const handleClose = () => {
    setSelectedDeliveryBoyId('');
    setSelectedStatus('processing');
    onClose();
  };

  if (!order) return null;

  const deliveryBoys = data?.delivery_boys ?? [];

  return (
    <FormModal
      open={!!order}
      onOpenChange={handleClose}
      title="Assign Delivery Boy"
      description={`Order #${order.order_number}`}
    >
      <div className="space-y-6">
        {/* Delivery Boy Selection */}
        <div className="space-y-2">
          <Label>Select Delivery Boy</Label>
          {isLoadingDeliveryBoys ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading available delivery boys...</span>
            </div>
          ) : deliveryBoys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No delivery boys available</p>
          ) : (
            <Select value={selectedDeliveryBoyId} onValueChange={setSelectedDeliveryBoyId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a delivery boy" />
              </SelectTrigger>
              <SelectContent>
                {deliveryBoys.map((boy) => (
                  <SelectItem key={boy.id} value={boy.id} disabled={boy.is_available === false}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{boy.name}</span>
                      <span className="text-muted-foreground">({boy.phone})</span>
                      {boy.is_available === false && (
                        <span className="text-destructive text-xs ml-auto">(Unavailable)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Status Selection */}
        <div className="space-y-3">
          <Label>Update Order Status</Label>
          <RadioGroup
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as 'processing' | 'out_for_delivery')}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="processing" id="processing" />
              <Label htmlFor="processing" className="cursor-pointer flex-1">
                <span className="font-medium">Processing</span>
                <p className="text-sm text-muted-foreground">Order is being prepared</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="out_for_delivery" id="out_for_delivery" />
              <Label htmlFor="out_for_delivery" className="cursor-pointer flex-1">
                <span className="font-medium">Out for Delivery</span>
                <p className="text-sm text-muted-foreground">Order is on the way</p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || !selectedDeliveryBoyId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              'Assign'
            )}
          </Button>
        </div>
      </div>
    </FormModal>
  );
};

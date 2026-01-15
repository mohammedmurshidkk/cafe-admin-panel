import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Truck, Phone } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGetDeliveryBoysQuery,
  useCreateDeliveryBoyMutation,
  useUpdateDeliveryBoyMutation,
  useDeleteDeliveryBoyMutation,
} from '@/store/api/deliveryBoysApi';
import { DeliveryBoy } from '@/types';
import { toast } from 'sonner';
import { formatPhone } from '@/utils/formatters';

interface DeliveryBoyFormData {
  name: string;
  phone: string;
}

const defaultFormData: DeliveryBoyFormData = {
  name: '',
  phone: '',
};

const DeliveryBoys = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeliveryBoy, setEditingDeliveryBoy] = useState<DeliveryBoy | null>(null);
  const [deleteDeliveryBoy, setDeleteDeliveryBoy] = useState<DeliveryBoy | null>(null);
  const [formData, setFormData] = useState<DeliveryBoyFormData>(defaultFormData);

  const { data, isLoading } = useGetDeliveryBoysQuery();
  const [createDeliveryBoy, { isLoading: isCreating }] = useCreateDeliveryBoyMutation();
  const [updateDeliveryBoy, { isLoading: isUpdating }] = useUpdateDeliveryBoyMutation();
  const [deleteDeliveryBoyMutation, { isLoading: isDeleting }] = useDeleteDeliveryBoyMutation();

  const deliveryBoys = data?.delivery_boys ?? [];
  const filteredDeliveryBoys = deliveryBoys.filter(boy =>
    !searchQuery ||
    boy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    boy.phone.includes(searchQuery)
  );

  const openForm = (deliveryBoy?: DeliveryBoy) => {
    if (deliveryBoy) {
      setEditingDeliveryBoy(deliveryBoy);
      setFormData({
        name: deliveryBoy.name,
        phone: deliveryBoy.phone,
      });
    } else {
      setEditingDeliveryBoy(null);
      setFormData(defaultFormData);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDeliveryBoy) {
        await updateDeliveryBoy({ id: editingDeliveryBoy.id, ...formData }).unwrap();
        toast.success('Delivery boy updated');
      } else {
        await createDeliveryBoy(formData).unwrap();
        toast.success('Delivery boy created');
      }
      setIsFormOpen(false);
    } catch (error) {
      toast.error('Failed to save delivery boy');
    }
  };

  const handleDelete = async () => {
    if (!deleteDeliveryBoy) return;
    try {
      await deleteDeliveryBoyMutation(deleteDeliveryBoy.id).unwrap();
      toast.success('Delivery boy deleted');
      setDeleteDeliveryBoy(null);
    } catch (error: any) {
      const message = error?.data?.error || 'Failed to delete delivery boy';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Delivery Boys"
        description="Manage delivery personnel for order assignments"
        action={
          <Button variant="gradient" onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Delivery Boy
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredDeliveryBoys.length ? (
        <div className="card-warm divide-y divide-border">
          {filteredDeliveryBoys.map((boy) => (
            <div
              key={boy.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{boy.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{formatPhone(boy.phone)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => openForm(boy)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDeliveryBoy(boy)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Truck}
          title="No delivery boys"
          description={searchQuery ? 'No delivery boys match your search' : 'Add delivery boys to assign orders'}
          action={!searchQuery ? { label: 'Add Delivery Boy', onClick: () => openForm() } : undefined}
        />
      )}

      <FormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingDeliveryBoy ? 'Edit Delivery Boy' : 'Add Delivery Boy'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating || isUpdating}>
              {editingDeliveryBoy ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteDeliveryBoy}
        onOpenChange={() => setDeleteDeliveryBoy(null)}
        title="Delete Delivery Boy"
        description={`Are you sure you want to delete "${deleteDeliveryBoy?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DeliveryBoys;

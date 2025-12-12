import { useState, useEffect } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SuperadminBusiness, SuperadminBusinessFormData } from '@/types';

interface BusinessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SuperadminBusinessFormData) => Promise<void>;
  business?: SuperadminBusiness | null;
  isLoading?: boolean;
}

export const BusinessFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  business,
  isLoading,
}: BusinessFormModalProps) => {
  const [formData, setFormData] = useState<SuperadminBusinessFormData>({
    name: '',
    phone: '',
    address: '',
    is_active: true,
    supports_delivery: true,
    supports_takeaway: true,
    delivery_fee: 0,
    free_delivery_above: 0,
    minimum_wait_minutes: 30,
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        phone: business.phone,
        address: business.address || '',
        is_active: business.is_active,
        supports_delivery: business.supports_delivery,
        supports_takeaway: business.supports_takeaway,
        delivery_fee: business.delivery_fee || 0,
        free_delivery_above: business.free_delivery_above || 0,
        minimum_wait_minutes: business.minimum_wait_minutes || 30,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        is_active: true,
        supports_delivery: true,
        supports_takeaway: true,
        delivery_fee: 0,
        free_delivery_above: 0,
        minimum_wait_minutes: 30,
      });
    }
  }, [business, isOpen]);

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={business ? 'Edit Business' : 'Create Business'}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel={business ? 'Update' : 'Create'}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Business Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter business name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Business address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="supports_delivery" className="cursor-pointer">Delivery</Label>
            <Switch
              id="supports_delivery"
              checked={formData.supports_delivery}
              onCheckedChange={(checked) => setFormData({ ...formData, supports_delivery: checked })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <Label htmlFor="supports_takeaway" className="cursor-pointer">Takeaway</Label>
          <Switch
            id="supports_takeaway"
            checked={formData.supports_takeaway}
            onCheckedChange={(checked) => setFormData({ ...formData, supports_takeaway: checked })}
          />
        </div>

        {formData.supports_delivery && (
          <div className="space-y-4 p-4 border border-border rounded-lg">
            <h4 className="font-medium text-sm">Delivery Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_fee">Delivery Fee</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="free_delivery_above">Free Delivery Above</Label>
                <Input
                  id="free_delivery_above"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.free_delivery_above}
                  onChange={(e) => setFormData({ ...formData, free_delivery_above: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="minimum_wait_minutes">Minimum Wait Time (minutes)</Label>
          <Input
            id="minimum_wait_minutes"
            type="number"
            min="0"
            value={formData.minimum_wait_minutes}
            onChange={(e) => setFormData({ ...formData, minimum_wait_minutes: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
    </FormModal>
  );
};

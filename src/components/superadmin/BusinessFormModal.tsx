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
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        phone: business.phone,
        address: business.address || '',
        is_active: business.is_active,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        is_active: true,
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
      submitLabel={business ? 'Update' : 'Next: Create Admin'}
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
          <p className="text-xs text-muted-foreground">
            WhatsApp registered phone number with country code
          </p>
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

        {business && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        )}
      </div>
    </FormModal>
  );
};

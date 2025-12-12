import { useState } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  businessName: string;
  isLoading?: boolean;
}

export const CreateAdminModal = ({
  isOpen,
  onClose,
  onSubmit,
  businessName,
  isLoading,
}: CreateAdminModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    await onSubmit(name, email, password);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Admin User"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel="Create Admin"
    >
      <div className="space-y-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm">
            Creating first admin for <strong>{businessName}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_name">Name *</Label>
          <Input
            id="admin_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Admin Name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_email">Email *</Label>
          <Input
            id="admin_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@business.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_password">Password *</Label>
          <Input
            id="admin_password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm Password *</Label>
          <Input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </FormModal>
  );
};

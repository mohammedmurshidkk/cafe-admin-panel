import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string | ReactNode;
  description?: string;
  children: ReactNode;
  onSubmit?: () => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  className?: string;
}

export const FormModal = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  onSubmit,
  isLoading,
  submitLabel = 'Save',
  className,
}: FormModalProps) => {
  const isDialogOpen = open ?? isOpen ?? false;
  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!value && onClose) onClose();
  };

  const handleSubmit = async () => {
    if (onSubmit) await onSubmit();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("max-w-lg max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {onSubmit && (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

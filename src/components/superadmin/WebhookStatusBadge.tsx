import { Badge } from '@/components/ui/badge';
import { WebhookStatus } from '@/types';
import { Circle } from 'lucide-react';

interface WebhookStatusBadgeProps {
  status: WebhookStatus | undefined;
}

export const WebhookStatusBadge = ({ status }: WebhookStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status?.status) {
      case 'active':
        return {
          label: 'Active',
          className: 'bg-green-100 text-green-800 border-green-200',
          dotColor: 'text-green-500',
        };
      case 'inactive':
        return {
          label: 'Inactive',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          dotColor: 'text-yellow-500',
        };
      case 'never':
      default:
        return {
          label: 'Never Received',
          className: 'bg-red-100 text-red-800 border-red-200',
          dotColor: 'text-red-500',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant="outline" className={config.className}>
      <Circle className={`h-2 w-2 mr-1.5 fill-current ${config.dotColor}`} />
      {config.label}
    </Badge>
  );
};

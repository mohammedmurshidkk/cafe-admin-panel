import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetBusinessStatsQuery, useGetWebhookStatusQuery } from '@/store/api/superadminApi';
import { WebhookStatusBadge } from './WebhookStatusBadge';
import { MessageSquare, ShoppingCart, Users, Clock, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string | null;
}

export const BusinessStatsModal = ({ isOpen, onClose, businessId }: BusinessStatsModalProps) => {
  const { data: stats, isLoading: statsLoading } = useGetBusinessStatsQuery(businessId!, {
    skip: !businessId,
  });
  const { data: webhookStatus, isLoading: webhookLoading } = useGetWebhookStatusQuery(businessId!, {
    skip: !businessId,
  });

  const isLoading = statsLoading || webhookLoading;

  const statCards = [
    { label: 'Messages', value: stats?.data?.stats?.messages ?? 0, icon: MessageSquare, color: 'text-blue-600' },
    { label: 'Orders', value: stats?.data?.stats?.orders ?? 0, icon: ShoppingCart, color: 'text-green-600' },
    { label: 'Sessions', value: stats?.data?.stats?.sessions ?? 0, icon: Clock, color: 'text-purple-600' },
    { label: 'Customers', value: stats?.data?.stats?.customers ?? 0, icon: Users, color: 'text-orange-600' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Business Statistics</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Business Info Header */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-lg">{stats?.data?.business?.name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{stats?.data?.business?.phone}</span>
              </div>
              {webhookStatus && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">Webhook Status:</span>
                  <WebhookStatusBadge status={webhookStatus?.data} />
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border rounded-lg p-4 flex items-center gap-3"
                >
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Image, Package, AlertCircle, Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '@/store/api/notificationsApi';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'customer_image', label: 'Images' },
  { value: 'new_order', label: 'Orders' },
  { value: 'ai_error', label: 'AI Errors' },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'customer_image':
      return <Image className="h-5 w-5 text-primary" />;
    case 'new_order':
      return <Package className="h-5 w-5 text-secondary" />;
    case 'ai_error':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useGetNotificationsQuery({ page, limit: 20, type: typeFilter });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const notifications = data?.notifications || [];
  const pagination = data?.pagination;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // Navigate to relevant section based on type
    if (notification.type === 'new_order') {
      navigate('/orders');
    } else if (notification.type === 'customer_image' || notification.type === 'ai_error') {
      navigate('/sessions');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notifications"
        description="View and manage all your notifications"
        action={
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm mt-1">We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 text-left hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {notification.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {notification.customer_phone || 'System'}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {Math.ceil(pagination.total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(pagination.total / 20)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notifications;

import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Image, Package, AlertCircle, Bell } from 'lucide-react';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '@/store/api/notificationsApi';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'customer_image':
      return <Image className="h-4 w-4 text-primary" />;
    case 'new_order':
      return <Package className="h-4 w-4 text-secondary" />;
    case 'ai_error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

export const NotificationDropdown = () => {
  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 10 });
  const [markAsRead] = useMarkAsReadMutation();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const notifications = data?.data || [];

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Notifications</h3>
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
                !notification.read && "bg-primary/5"
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {notification.customer_phone || 'System'}
                  </p>
                </div>
                <p className="text-sm text-foreground line-clamp-2 mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Link
        to="/notifications"
        className="block px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted/50 border-t border-border transition-colors"
      >
        View All
      </Link>
    </div>
  );
};

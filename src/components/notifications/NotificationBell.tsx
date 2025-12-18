import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGetUnreadCountQuery } from '@/store/api/notificationsApi';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.data?.length || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 flex items-center justify-center",
                "min-w-[18px] h-[18px] px-1 rounded-full",
                "bg-destructive text-destructive-foreground text-xs font-medium",
                "animate-scale-in"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationDropdown />
      </PopoverContent>
    </Popover>
  );
};

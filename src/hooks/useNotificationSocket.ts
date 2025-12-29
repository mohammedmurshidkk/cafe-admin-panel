import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useGetUnreadCountQuery } from '@/store/api/notificationsApi';
import { toast } from 'sonner';
import type { Notification } from '@/types';

interface UseNotificationSocketOptions {
  soundEnabled?: boolean;
  browserNotificationsEnabled?: boolean;
}

export const useNotificationSocket = (
  options: UseNotificationSocketOptions = {}
) => {
  const { soundEnabled = true, browserNotificationsEnabled = true } = options;
  const { on } = useSocket();
  const { refetch: refetchUnreadCount } = useGetUnreadCountQuery();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if (browserNotificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [browserNotificationsEnabled]);

  // Initialize audio for notification sound
  useEffect(() => {
    if (soundEnabled) {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to browser autoplay policy
      });
    }
  }, [soundEnabled]);

  const showBrowserNotification = useCallback(
    (notification: Notification) => {
      if (
        browserNotificationsEnabled &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.hidden // Only show when tab is not focused
      ) {
        const browserNotif = new Notification('New Notification', {
          body: notification.message,
          icon: '/favicon.ico', // or your app icon
          tag: notification.id, // prevents duplicate notifications
        });

        browserNotif.onclick = () => {
          window.focus();
          browserNotif.close();
        };
      }
    },
    [browserNotificationsEnabled]
  );

  // useEffect(() => {
  //   const unsubscribe = on('new_notification', (data: unknown) => {
  //     const notification = data as Notification;

  //     // Refetch unread count
  //     refetchUnreadCount();

  //     // Play sound
  //     playNotificationSound();

  //     // Show browser notification (desktop)
  //     showBrowserNotification(notification);

  //     // Show toast notification (in-app)
  //     toast.info(notification.message, {
  //       description: notification.customer_phone || 'System notification',
  //       duration: 5000,
  //     });
  //   });

  //   return unsubscribe;
  // }, [on, refetchUnreadCount, playNotificationSound, showBrowserNotification])
};

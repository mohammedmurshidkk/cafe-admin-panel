import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useGetUnreadCountQuery } from '@/store/api/notificationsApi';
import { toast } from 'sonner';
import type { Notification } from '@/types';

interface UseNotificationSocketOptions {
  soundEnabled?: boolean;
}

export const useNotificationSocket = (options: UseNotificationSocketOptions = {}) => {
  const { soundEnabled = false } = options;
  const { on } = useSocket();
  const { refetch: refetchUnreadCount } = useGetUnreadCountQuery();
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    const unsubscribe = on('new_notification', (data: unknown) => {
      const notification = data as Notification;
      
      // Refetch unread count
      refetchUnreadCount();
      
      // Play sound
      playNotificationSound();
      
      // Show toast notification
      toast.info(notification.message, {
        description: notification.customer_phone || 'System notification',
        duration: 5000,
      });
    });

    return unsubscribe;
  }, [on, refetchUnreadCount, playNotificationSound]);
};

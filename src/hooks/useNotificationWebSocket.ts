import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState } from '@/store/store';
import { notificationsApi } from '@/store/api/notificationsApi';
import { toast } from 'sonner';
import { Notification as NotificationType } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';
const NOTIFICATION_SOUND = '/notification.mp3';

interface UseNotificationWebSocketOptions {
  onNewNotification?: (notification: NotificationType) => void;
  enabled?: boolean;
}

export const useNotificationWebSocket = (options: UseNotificationWebSocketOptions = {}) => {
  const { enabled = true } = options;
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const businessId = useSelector((state: RootState) => state.auth.user?.business_id);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play failed - browser autoplay policy
      });
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    playNotificationSound();

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    toast.info(title, { description: body });
  }, [playNotificationSound]);

  useEffect(() => {
    if (!token || !enabled) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Notification socket connected');
      if (businessId) {
        socketRef.current?.emit('join_business', { businessId });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Notification socket disconnected');
    });

    // Listen for new notifications
    socketRef.current.on('new_notification', (notification: NotificationType) => {
      // Invalidate cache to trigger refetch
      dispatch(notificationsApi.util.invalidateTags(['Notifications', 'NotificationCount']));

      // Show browser notification
      const typeLabel = notification.type.replace('_', ' ');
      showBrowserNotification(
        `New ${typeLabel}`,
        notification.message.slice(0, 100)
      );

      options.onNewNotification?.(notification);
    });

    // Listen for notification read status changes (from other tabs/devices)
    socketRef.current.on('notification_read', () => {
      dispatch(notificationsApi.util.invalidateTags(['Notifications', 'NotificationCount']));
    });

    // Listen for all notifications marked as read
    socketRef.current.on('notifications_read_all', () => {
      dispatch(notificationsApi.util.invalidateTags(['Notifications', 'NotificationCount']));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, businessId, enabled, dispatch, showBrowserNotification, options]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
};

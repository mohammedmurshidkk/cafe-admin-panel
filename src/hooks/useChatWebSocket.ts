import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState } from '@/store/store';
import { chatApi } from '@/store/api/chatApi';
import { ChatMessage } from '@/types';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';
const CHAT_NOTIFICATION_SOUND = '/chat-notification.mp3';

interface UseChatWebSocketOptions {
  onNewMessage?: (sessionId: string, message: ChatMessage) => void;
  selectedSessionId?: string | null;
}

export const useChatWebSocket = (options: UseChatWebSocketOptions = {}) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const businessId = useSelector((state: RootState) => state.auth.user?.business_id);
  const socketRef = useRef<Socket | null>(null);
  const selectedSessionIdRef = useRef(options.selectedSessionId);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Keep ref updated
  useEffect(() => {
    selectedSessionIdRef.current = options.selectedSessionId;
  }, [options.selectedSessionId]);

  // Initialize audio for chat notification sound
  useEffect(() => {
    audioRef.current = new Audio(CHAT_NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to browser autoplay policy
      });
    }
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    // Play notification sound
    playNotificationSound();

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    // Also show toast
    toast.info(title, { description: body });
  }, [playNotificationSound]);

  useEffect(() => {
    if (!token) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Chat socket connected');
      // Join business room for receiving messages
      if (businessId) {
        socketRef.current?.emit('join_business', { businessId });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Chat socket disconnected');
    });

    // Listen for new messages
    socketRef.current.on('new_message', (data: { session_id: string; message: ChatMessage }) => {
      const { session_id, message } = data;

      // Update messages cache if viewing this session
      dispatch(
        chatApi.util.updateQueryData(
          'getSessionMessages',
          { sessionId: session_id },
          (draft) => {
            // Handle both nested and flat response structures
            const messages = draft.messages || (draft as any).data?.messages;
            if (messages) {
              const exists = messages.some((m: ChatMessage) => m.id === message.id);
              if (!exists) {
                messages.push(message);
              }
            }
          }
        )
      );

      // Invalidate sessions list to update last_message and unread_count
      dispatch(chatApi.util.invalidateTags(['ChatSessions']));

      // Show notification if message is inbound and not viewing this session
      if (message.direction === 'inbound' && session_id !== selectedSessionIdRef.current) {
        const preview = message.message_type === 'text'
          ? message.content.slice(0, 50)
          : `New ${message.message_type}`;
        showNotification('New Message', preview);
      }

      options.onNewMessage?.(session_id, message);
    });

    // Listen for message status updates (checkmarks)
    socketRef.current.on('message_status', (data: { session_id: string; message_id: string; status: string }) => {
      dispatch(
        chatApi.util.updateQueryData(
          'getSessionMessages',
          { sessionId: data.session_id },
          (draft) => {
            // Handle both nested and flat response structures
            const messages = draft.messages || (draft as any).data?.messages;
            if (messages) {
              const message = messages.find((m: ChatMessage) => m.id === data.message_id);
              if (message) {
                message.status = data.status as 'sent' | 'delivered' | 'read' | 'failed';
              }
            }
          }
        )
      );
    });

    // Listen for session updates (ai_paused, status change, etc.)
    socketRef.current.on('session_update', (data: { session_id: string }) => {
      // Refresh sessions list to get updated data
      dispatch(chatApi.util.invalidateTags(['ChatSessions']));
      // Also refresh messages if viewing this session
      if (data.session_id) {
        dispatch(chatApi.util.invalidateTags([{ type: 'Messages', id: data.session_id }]));
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, businessId, dispatch, showNotification, options]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
};

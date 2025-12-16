import { apiSlice } from './apiSlice';
import type { Notification, NotificationsResponse, UnreadCountResponse } from '@/types';

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, { page?: number; limit?: number; type?: string }>({
      query: ({ page = 1, limit = 20, type }) => ({
        url: '/notifications',
        params: { page, limit, ...(type && type !== 'all' ? { type } : {}) },
      }),
      providesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => '/notifications/unread',
      providesTags: ['NotificationCount'],
    }),
    markAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications', 'NotificationCount'],
    }),
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications', 'NotificationCount'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationsApi;

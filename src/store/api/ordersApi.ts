import { apiSlice } from './apiSlice';
import { Order, OrdersResponse, OrderStatus, SuccessResponse } from '@/types';

interface OrdersQueryParams {
  status?: OrderStatus | '';
  search?: string;
  page?: number;
  limit?: number;
}

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<OrdersResponse, OrdersQueryParams>({
      query: ({ status, search, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        params.append('page', String(page));
        params.append('limit', String(limit));
        return `/orders?${params.toString()}`;
      },
      providesTags: ['Orders'],
    }),
    getRecentOrders: builder.query<{ orders: Order[] }, { limit: number; status?: string }>({
      query: ({ limit, status }) => {
        const params = new URLSearchParams();
        params.append('limit', String(limit));
        if (status) params.append('status', status);
        return `/orders?${params.toString()}`;
      },
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation<SuccessResponse, { orderId: string; status: OrderStatus }>({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders', 'Dashboard'],
    }),
  }),
});

export const { useGetOrdersQuery, useGetRecentOrdersQuery, useUpdateOrderStatusMutation } = ordersApi;

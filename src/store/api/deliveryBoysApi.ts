import { apiSlice } from './apiSlice';
import { DeliveryBoy, DeliveryBoysResponse, AssignOrderRequest, SuccessResponse } from '@/types';

export const deliveryBoysApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDeliveryBoys: builder.query<DeliveryBoysResponse, void>({
      query: () => '/admin/delivery-boys',
      providesTags: ['DeliveryBoys'],
    }),
    getAvailableDeliveryBoys: builder.query<DeliveryBoysResponse, void>({
      query: () => '/admin/delivery-boys/available',
      providesTags: ['DeliveryBoys'],
    }),
    getDeliveryBoy: builder.query<DeliveryBoy, string>({
      query: (id) => `/admin/delivery-boys/${id}`,
      providesTags: ['DeliveryBoys'],
    }),
    createDeliveryBoy: builder.mutation<DeliveryBoy, { name: string; phone: string }>({
      query: (body) => ({
        url: '/admin/delivery-boys',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryBoys'],
    }),
    updateDeliveryBoy: builder.mutation<DeliveryBoy, { id: string; name: string; phone: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/delivery-boys/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DeliveryBoys'],
    }),
    deleteDeliveryBoy: builder.mutation<SuccessResponse, string>({
      query: (id) => ({
        url: `/admin/delivery-boys/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeliveryBoys'],
    }),
    assignOrderToDeliveryBoy: builder.mutation<SuccessResponse, { orderId: string } & AssignOrderRequest>({
      query: ({ orderId, ...body }) => ({
        url: `/admin/delivery-boys/assign/${orderId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryBoys', 'Orders'],
    }),
  }),
});

export const {
  useGetDeliveryBoysQuery,
  useGetAvailableDeliveryBoysQuery,
  useGetDeliveryBoyQuery,
  useCreateDeliveryBoyMutation,
  useUpdateDeliveryBoyMutation,
  useDeleteDeliveryBoyMutation,
  useAssignOrderToDeliveryBoyMutation,
} = deliveryBoysApi;

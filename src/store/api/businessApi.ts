import { apiSlice } from './apiSlice';
import { Business, BusinessResponse, Outlet } from '@/types';

interface UpdateBusinessData {
  name?: string;
  welcome_message?: string;
  closing_message?: string;
  custom_ai_prompt?: string;
  critical_message?: string;
  critical_message_enabled?: boolean;
  order_number_prefix?: string;
  customer_support_phone?: string;
  supports_delivery?: boolean;
  supports_takeaway?: boolean;
  delivery_fee?: number;
  free_delivery_above?: number;
  delivery_radius_km?: number;
  minimum_wait_minutes?: number;
  free_radius_meters?:number
  minimum_delivery_charge?:number
  minimum_charge_distance_meters?:number
  increment_per_km?:number
  max_delivery_radius_meters?:number
}

interface OutletData {
  outlet_name: string;
  address: string;
  phone: string;
  is_active?: boolean;
}

export const businessApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessProfile: builder.query<BusinessResponse, void>({
      query: () => '/business/profile',
      providesTags: ['Business'],
    }),
    updateBusinessProfile: builder.mutation<BusinessResponse, UpdateBusinessData>({
      query: (data) => ({
        url: '/business/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Business'],
    }),
    uploadBusinessLogo: builder.mutation<{ logo_url: string }, FormData>({
      query: (formData) => ({
        url: '/business/logo',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Business'],
    }),
    createOutlet: builder.mutation<{ outlet: Outlet }, OutletData>({
      query: (data) => ({
        url: '/business/outlets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Business'],
    }),
    updateOutlet: builder.mutation<{ outlet: Outlet }, { id: string } & OutletData>({
      query: ({ id, ...data }) => ({
        url: `/business/outlets/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Business'],
    }),
    deleteOutlet: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/business/outlets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Business'],
    }),
  }),
});

export const { 
  useGetBusinessProfileQuery, 
  useUpdateBusinessProfileMutation, 
  useUploadBusinessLogoMutation,
  useCreateOutletMutation, 
  useUpdateOutletMutation, 
  useDeleteOutletMutation 
} = businessApi;

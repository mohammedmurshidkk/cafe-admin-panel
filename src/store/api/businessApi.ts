import { apiSlice } from './apiSlice';
import { Business, BusinessResponse, Outlet } from '@/types';

interface UpdateBusinessData {
  name?: string;
  welcome_message?: string;
  thank_you_message?: string;
  custom_ai_prompt?: string;
  critical_message?: string;
  critical_message_enabled?: boolean;
}

interface OutletData {
  name: string;
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

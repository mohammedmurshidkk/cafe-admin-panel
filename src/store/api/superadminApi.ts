import { apiSlice } from './apiSlice';
import { SuperadminBusiness, BusinessesResponse, SuperadminBusinessFormData, CreateAdminData, SuccessResponse } from '@/types';

export const superadminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBusinesses: builder.query<BusinessesResponse, { search?: string; page?: number; limit?: number }>({
      query: ({ search = '', page = 1, limit = 20 }) => 
        `/superadmin/businesses?search=${search}&page=${page}&limit=${limit}`,
      providesTags: ['Businesses'],
    }),
    createBusiness: builder.mutation<{ business: SuperadminBusiness }, SuperadminBusinessFormData>({
      query: (data) => ({
        url: '/superadmin/businesses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Businesses'],
    }),
    updateBusiness: builder.mutation<{ business: SuperadminBusiness }, { id: string } & Partial<SuperadminBusinessFormData>>({
      query: ({ id, ...data }) => ({
        url: `/superadmin/businesses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Businesses'],
    }),
    toggleBusinessStatus: builder.mutation<SuccessResponse, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/superadmin/businesses/${id}/toggle-status`,
        method: 'PATCH',
        body: { is_active },
      }),
      invalidatesTags: ['Businesses'],
    }),
    uploadBusinessLogo: builder.mutation<{ logo_url: string }, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/superadmin/businesses/${id}/logo`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Businesses'],
    }),
    createBusinessAdmin: builder.mutation<SuccessResponse, CreateAdminData>({
      query: (data) => ({
        url: `/superadmin/businesses/${data?.business_id}/admins`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Businesses'],
    }),
  }),
});

export const { 
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useToggleBusinessStatusMutation,
  useUploadBusinessLogoMutation,
  useCreateBusinessAdminMutation,
} = superadminApi;

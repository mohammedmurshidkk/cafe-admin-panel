import { apiSlice } from './apiSlice';
import { AddonGroup, AddonGroupsResponse, Addon } from '@/types';

export const addonsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAddonGroups: builder.query<AddonGroupsResponse, void>({
      query: () => '/addons/groups',
      providesTags: ['Addons'],
    }),
    createAddonGroup: builder.mutation<{ group: AddonGroup }, { name: string }>({
      query: (data) => ({
        url: '/addon-groups',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Addons'],
    }),
    deleteAddonGroup: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/addon-groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addons'],
    }),
    createAddon: builder.mutation<{ addon: Addon }, { name: string; price: number; group_id: string }>({
      query: (data) => ({
        url: '/addons',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Addons'],
    }),
    updateAddon: builder.mutation<{ addon: Addon }, { id: string; name?: string; price?: number;category?:string; is_available?: boolean }>({
      query: ({ id, ...data }) => ({
        url: `/addons/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Addons'],
    }),
    deleteAddon: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/addons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addons'],
    }),
  }),
});

export const { 
  useGetAddonGroupsQuery, 
  useCreateAddonGroupMutation, 
  useDeleteAddonGroupMutation,
  useCreateAddonMutation, 
  useUpdateAddonMutation, 
  useDeleteAddonMutation 
} = addonsApi;
